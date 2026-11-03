export type SequenceVariant = {
  width: number;
  height: number;
  /** Variant-specific count for higher-frame-rate mobile sequences. */
  frameCount?: number;
  /** Path template relative to the sequence base, `{i}` = 1-based frame, zero-padded to 3. */
  path: string;
};

export type SequenceManifest = {
  name: string;
  frameCount: number;
  fps: number;
  poster: string;
  variants: {
    desktop: SequenceVariant;
    mobile: SequenceVariant;
  };
};

export function sequenceBase(name: string): string {
  return `/sequences/${name}`;
}

export async function loadManifest(name: string, signal?: AbortSignal): Promise<SequenceManifest> {
  const res = await fetch(`${sequenceBase(name)}/manifest.json`, { signal });
  if (!res.ok) throw new Error(`Failed to load sequence manifest: ${name}`);
  return res.json();
}

export function framePath(name: string, variant: SequenceVariant, index: number): string {
  const num = String(index + 1).padStart(3, "0");
  return `${sequenceBase(name)}/${variant.path.replace("{i}", num)}`;
}

// Page-wide accounting includes frames being fetched/decoded. Canvas backing
// stores and browser decoder working memory are separate from this budget.
export const FRAME_BUDGET = 48 * 1024 * 1024;
const loaders = new Set<SequenceLoader>();
let reservedBytes = 0;
let jobs = 0;
let tasks = 0;
const decodeWaiters: Array<() => void> = [];

async function decodeFrame(blob: Blob, options: ImageBitmapOptions, signal: AbortSignal) {
  if (jobs >= 2) await new Promise<void>(resolve => decodeWaiters.push(resolve));
  else jobs++;
  try {
    if (signal.aborted) return null;
    return await createImageBitmap(blob, options);
  } finally {
    jobs--;
    const next = decodeWaiters.shift();
    if (next) { jobs++; next(); }
  }
}
let pumping = false;

export function sequenceMemoryStats() {
  return { bytes: reservedBytes, jobs, tasks, budget: FRAME_BUDGET };
}

function pump() {
  if (pumping) return;
  pumping = true;
  try {
    // All visible targets precede speculative neighbor frames.
    for (const offset of [0, 1, -1, 2, 3, 4, 5, 6, 7, 8, 9, 10, -2, -3]) {
      for (const loader of loaders) {
        if (tasks >= 6) return;
        loader.request(offset);
      }
    }
  } finally {
    pumping = false;
  }
}

export class SequenceLoader {
  private frames = new Map<number, ImageBitmap>();
  private pending = new Map<number, AbortController>();
  private failed = new Set<number>();
  private active = false;
  private disposed = false;
  private target = 0;
  private direction = 1;
  private readonly width: number;
  private readonly height: number;
  private readonly bytes: number;

  constructor(
    private readonly name: string,
    readonly manifest: SequenceManifest,
    private readonly variantKey: "desktop" | "mobile",
    private readonly onFrameLoaded?: (index: number) => void,
  ) {
    const { width, height } = this.variant;
    // Match the mobile canvas resolution instead of decoding 900px images
    // into a ~585px backing store. This buys a useful lookahead within 48 MiB.
    const scale = variantKey === "mobile" ? Math.min(1, 600 / width) : 1;
    this.width = Math.round(width * scale);
    this.height = Math.round(height * scale);
    this.bytes = this.width * this.height * 4;
    if (![width, height, this.frameCount].every(n => Number.isSafeInteger(n) && n > 0)
      || this.bytes > FRAME_BUDGET / 2) throw new Error("Invalid sequence dimensions");
  }

  get variant() { return this.manifest.variants[this.variantKey]; }
  get frameCount() { return this.variant.frameCount ?? this.manifest.frameCount; }

  start() {
    if (this.disposed || this.active) return;
    this.active = true;
    loaders.add(this);
    pump();
  }

  setProgress(progress: number) {
    if (!Number.isFinite(progress)) return;
    const target = Math.round(Math.max(0, Math.min(1, progress)) * (this.frameCount - 1));
    if (target !== this.target) this.direction = Math.sign(target - this.target);
    this.target = target;
    this.trim();
    for (const [index, controller] of this.pending) {
      if (Math.abs(index - this.target) > 14) controller.abort();
    }
    if (this.active) pump();
  }

  private remove(index: number) {
    const bitmap = this.frames.get(index);
    if (!bitmap) return;
    bitmap.close();
    this.frames.delete(index);
    reservedBytes -= this.bytes;
  }

  private nearestIndex() {
    let best = -1;
    for (const index of this.frames.keys()) {
      if (best < 0 || Math.abs(index - this.target) < Math.abs(best - this.target)) best = index;
    }
    return best;
  }

  private trim() {
    const nearest = this.nearestIndex();
    for (const index of this.frames.keys()) {
      if (!this.inWindow(index) && index !== nearest) this.remove(index);
    }
  }

  private inWindow(index: number) {
    const distance = (index - this.target) * this.direction;
    return distance >= -3 && distance <= 10;
  }

  request(offset: number) {
    const index = this.target + offset * this.direction;
    if (!this.active || index < 0 || index >= this.frameCount || this.frames.has(index)
      || this.pending.has(index) || this.failed.has(index)) return;
    if (reservedBytes + this.bytes > FRAME_BUDGET && offset === 0) {
      // Target frames may displace prefetch frames, but never another section's
      // nearest frame. Neighbor requests cannot cause eviction/refetch loops.
      for (const loader of loaders) {
        const nearest = loader.nearestIndex();
        for (const key of loader.frames.keys()) {
          if (key !== nearest && reservedBytes + this.bytes > FRAME_BUDGET) loader.remove(key);
        }
      }
    }
    if (reservedBytes + this.bytes > FRAME_BUDGET) return;
    const controller = new AbortController();
    this.pending.set(index, controller);
    reservedBytes += this.bytes;
    tasks++;
    void this.decode(index, controller);
  }

  private async decode(index: number, controller: AbortController) {
    let retained = false;
    try {
      const response = await fetch(framePath(this.name, this.variant, index), { signal: controller.signal });
      if (!response.ok) throw new Error("Frame unavailable");
      const blob = await response.blob();
      if (controller.signal.aborted) return;
      const bitmap = await decodeFrame(blob, {
        resizeWidth: this.width, resizeHeight: this.height,
      }, controller.signal);
      if (!bitmap) return;
      // Decoding itself is not cancellable. Keep its reservation until it
      // settles and close late results before releasing that reservation.
      if (controller.signal.aborted || !this.active || this.disposed
        || Math.abs(index - this.target) > 14
        || bitmap.width !== this.width || bitmap.height !== this.height) {
        bitmap.close();
        if (!controller.signal.aborted && this.active) this.failed.add(index);
        return;
      }
      this.frames.set(index, bitmap);
      retained = true;
      this.trim();
      this.onFrameLoaded?.(index);
    } catch {
      if (!controller.signal.aborted) this.failed.add(index);
    } finally {
      if (!retained) reservedBytes -= this.bytes;
      this.pending.delete(index);
      tasks--;
      pump();
    }
  }

  nearest(index: number): ImageBitmap | null {
    let best: ImageBitmap | null = null;
    let distance = Infinity;
    for (const [key, bitmap] of this.frames) {
      if (Math.abs(key - index) < distance) {
        best = bitmap;
        distance = Math.abs(key - index);
      }
    }
    return best;
  }

  pause() {
    this.active = false;
    loaders.delete(this);
    for (const controller of this.pending.values()) controller.abort();
    for (const index of this.frames.keys()) this.remove(index);
    this.failed.clear();
    pump();
  }

  dispose() { this.disposed = true; this.pause(); }
}
