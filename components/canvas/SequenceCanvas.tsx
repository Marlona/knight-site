"use client";

import Image from "next/image";
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import {
  SequenceLoader,
  loadManifest,
  sequenceBase,
} from "@/lib/sequences";

export type SequenceCanvasHandle = {
  /** Drive the scrub position, 0..1. Called from the parent's ScrollTrigger. */
  setProgress: (p: number) => void;
};

const DPR_CAP = 1.5;

/**
 * Scroll-scrubbed image-sequence canvas (Apple-style). Renders the poster
 * immediately (the hero's is the LCP image); nearby frames load on demand
 * once `activate` fires, and the canvas draws the nearest loaded frame
 * cover-fitted over the poster.
 */
const SequenceCanvas = forwardRef<
  SequenceCanvasHandle,
  {
    name: string;
    /** "load" = start after window load (hero); "visible" = load while intersecting the viewport. */
    activate?: "load" | "visible";
    priority?: boolean;
    className?: string;
  }
>(function SequenceCanvas({ name, activate = "visible", priority = false, className = "" }, ref) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const loaderRef = useRef<SequenceLoader | null>(null);
  const progressRef = useRef(0);
  const lastDrawnRef = useRef(-1);
  const rafRef = useRef(0);
  const [hasFrames, setHasFrames] = useState(false);

  const draw = useCallback(() => {
    rafRef.current = 0;
    const canvas = canvasRef.current;
    const loader = loaderRef.current;
    if (!canvas || !loader) return;
    const { frameCount } = loader;
    const index = Math.round(progressRef.current * (frameCount - 1));
    const bitmap = loader.nearest(index);
    if (!bitmap) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const cw = canvas.width;
    const ch = canvas.height;
    // Cover-fit: scale bitmap to fill, center the overflow.
    const scale = Math.max(cw / bitmap.width, ch / bitmap.height);
    const dw = bitmap.width * scale;
    const dh = bitmap.height * scale;
    try {
      ctx.drawImage(bitmap, (cw - dw) / 2, (ch - dh) / 2, dw, dh);
    } catch {
      loader.pause();
      setHasFrames(false);
      return;
    }
    lastDrawnRef.current = index;
    setHasFrames(true);
  }, []);

  const scheduleDraw = useCallback(() => {
    if (!rafRef.current) rafRef.current = requestAnimationFrame(draw);
  }, [draw]);

  useImperativeHandle(
    ref,
    () => ({
      setProgress: (p: number) => {
        progressRef.current = Math.max(0, Math.min(1, p));
        const loader = loaderRef.current;
        if (!loader) return;
        const index = Math.round(progressRef.current * (loader.frameCount - 1));
        loader.setProgress(progressRef.current);
        if (index !== lastDrawnRef.current) scheduleDraw();
      },
    }),
    [scheduleDraw],
  );

  // Only visible sections retain decoded frames. Background tabs release them.
  useEffect(() => {
    const controller = new AbortController();
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;
    const mobile = window.matchMedia("(max-width: 767px)");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    let visible = false;
    let loaded = activate !== "load" || document.readyState === "complete";
    let manifest: Awaited<ReturnType<typeof loadManifest>> | undefined;
    const resize = () => {
      if (!visible || document.hidden || reduced.matches) return;
      const dpr = Math.min(window.devicePixelRatio || 1, DPR_CAP);
      canvas.width = Math.round(container.clientWidth * dpr);
      canvas.height = Math.round(container.clientHeight * dpr);
      lastDrawnRef.current = -1;
      scheduleDraw();
    };
    const update = () => {
      if (visible && loaded && !document.hidden && !reduced.matches) {
        resize();
        loaderRef.current?.setProgress(progressRef.current);
        loaderRef.current?.start();
      } else {
        loaderRef.current?.pause();
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        rafRef.current = 0;
        lastDrawnRef.current = -1;
        canvas.width = canvas.height = 0;
        setHasFrames(false);
      }
    };
    const rebuild = () => {
      loaderRef.current?.dispose();
      loaderRef.current = null;
      setHasFrames(false);
      canvas.width = canvas.height = 0;
      if (manifest && !reduced.matches && typeof createImageBitmap === "function") {
        try {
          loaderRef.current = new SequenceLoader(name, manifest, mobile.matches ? "mobile" : "desktop", scheduleDraw);
        } catch { /* Invalid manifests leave the independent poster visible. */ }
      }
      update();
    };
    const onLoad = () => { loaded = true; update(); };
    const observer = new IntersectionObserver(entries => {
      visible = entries.some(entry => entry.isIntersecting);
      update();
    });
    observer.observe(container);
    const ro = new ResizeObserver(resize);
    ro.observe(container);
    window.addEventListener("load", onLoad);
    document.addEventListener("visibilitychange", update);
    mobile.addEventListener("change", rebuild);
    reduced.addEventListener("change", rebuild);
    void loadManifest(name, controller.signal).then(value => {
      if (controller.signal.aborted) return;
      manifest = value;
      rebuild();
    }).catch(() => { /* Poster remains available on manifest/network failure. */ });
    return () => {
      controller.abort();
      observer.disconnect();
      ro.disconnect();
      window.removeEventListener("load", onLoad);
      document.removeEventListener("visibilitychange", update);
      mobile.removeEventListener("change", rebuild);
      reduced.removeEventListener("change", rebuild);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
      loaderRef.current?.dispose();
      loaderRef.current = null;
      canvas.width = canvas.height = 0;
    };
  }, [name, activate, scheduleDraw]);

  return (
    <div ref={containerRef} className={`absolute inset-0 overflow-hidden ${className}`}>
      <Image
        src={`${sequenceBase(name)}/poster.webp`}
        alt=""
        fill
        priority={priority}
        sizes="100vw"
        className="object-cover"
      />
      <canvas
        ref={canvasRef}
        data-sequence={name}
        data-painted={hasFrames ? "true" : "false"}
        className={`absolute inset-0 h-full w-full transition-opacity duration-500 ${
          hasFrames ? "opacity-100" : "opacity-0"
        }`}
      />
    </div>
  );
});

export default SequenceCanvas;
