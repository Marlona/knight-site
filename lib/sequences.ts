/**
 * Scroll-scrubbed image sequences.
 *
 * Each sequence lives at /sequences/<name>/ with a manifest.json describing
 * frame counts and per-breakpoint variants. Frames are fetched in bisection
 * order (ends first, then midpoints) so a partially loaded sequence scrubs
 * coarsely instead of stalling, and decoded off-thread via createImageBitmap.
 */

export type SequenceVariant = {
  width: number;
  height: number;
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

export async function loadManifest(name: string): Promise<SequenceManifest> {
  const res = await fetch(`${sequenceBase(name)}/manifest.json`);
  if (!res.ok) throw new Error(`Failed to load sequence manifest: ${name}`);
  return res.json();
}

export function framePath(name: string, variant: SequenceVariant, index: number): string {
  const num = String(index + 1).padStart(3, "0");
  return `${sequenceBase(name)}/${variant.path.replace("{i}", num)}`;
}

/** Ends first, then recursive midpoints — breadth-first over ranges. */
export function bisectionOrder(n: number): number[] {
  if (n <= 0) return [];
  const seen = new Set<number>();
  const order: number[] = [];
  const push = (i: number) => {
    if (!seen.has(i)) {
      seen.add(i);
      order.push(i);
    }
  };
  push(0);
  if (n > 1) push(n - 1);
  const queue: Array<[number, number]> = [[0, n - 1]];
  while (queue.length) {
    const [lo, hi] = queue.shift()!;
    if (hi - lo < 2) continue;
    const mid = (lo + hi) >> 1;
    push(mid);
    queue.push([lo, mid], [mid, hi]);
  }
  return order;
}

const FETCH_CONCURRENCY = 6;

export class SequenceLoader {
  private bitmaps: Array<ImageBitmap | null>;
  private disposed = false;
  private started = false;

  constructor(
    private readonly name: string,
    readonly manifest: SequenceManifest,
    private readonly variantKey: "desktop" | "mobile",
    private readonly onFrameLoaded?: (index: number) => void,
  ) {
    this.bitmaps = new Array(manifest.frameCount).fill(null);
  }

  get variant(): SequenceVariant {
    return this.manifest.variants[this.variantKey];
  }

  /** Kick off loading all frames in bisection order with bounded concurrency. */
  start(): void {
    if (this.started || this.disposed) return;
    this.started = true;
    const order = bisectionOrder(this.manifest.frameCount);
    let cursor = 0;
    const next = async (): Promise<void> => {
      while (cursor < order.length && !this.disposed) {
        const index = order[cursor++];
        try {
          const res = await fetch(framePath(this.name, this.variant, index));
          if (!res.ok) continue;
          const blob = await res.blob();
          const bitmap = await createImageBitmap(blob);
          if (this.disposed) {
            bitmap.close();
            return;
          }
          this.bitmaps[index] = bitmap;
          this.onFrameLoaded?.(index);
        } catch {
          // Skip failed frames; nearest-neighbor lookup covers gaps.
        }
      }
    };
    for (let i = 0; i < FETCH_CONCURRENCY; i++) void next();
  }

  /** Nearest loaded frame to `index`, scanning outward. Null until first frame lands. */
  nearest(index: number): ImageBitmap | null {
    const n = this.bitmaps.length;
    const clamped = Math.max(0, Math.min(n - 1, Math.round(index)));
    if (this.bitmaps[clamped]) return this.bitmaps[clamped];
    for (let d = 1; d < n; d++) {
      const lo = clamped - d;
      const hi = clamped + d;
      if (lo >= 0 && this.bitmaps[lo]) return this.bitmaps[lo];
      if (hi < n && this.bitmaps[hi]) return this.bitmaps[hi];
    }
    return null;
  }

  dispose(): void {
    this.disposed = true;
    for (const bitmap of this.bitmaps) bitmap?.close();
    this.bitmaps.fill(null);
  }
}
