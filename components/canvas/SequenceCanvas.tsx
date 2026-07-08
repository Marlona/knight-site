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
  type SequenceManifest,
} from "@/lib/sequences";

export type SequenceCanvasHandle = {
  /** Drive the scrub position, 0..1. Called from the parent's ScrollTrigger. */
  setProgress: (p: number) => void;
};

const DPR_CAP = 1.5;

/**
 * Scroll-scrubbed image-sequence canvas (Apple-style). Renders the poster
 * immediately (the hero's is the LCP image); frames stream in bisection order
 * once `activate` fires, and the canvas draws the nearest loaded frame
 * cover-fitted over the poster.
 */
const SequenceCanvas = forwardRef<
  SequenceCanvasHandle,
  {
    name: string;
    /** "load" = start after window load (hero); "visible" = pre-warm when near viewport. */
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
  const [manifest, setManifest] = useState<SequenceManifest | null>(null);
  const [hasFrames, setHasFrames] = useState(false);

  const draw = useCallback(() => {
    rafRef.current = 0;
    const canvas = canvasRef.current;
    const loader = loaderRef.current;
    if (!canvas || !loader) return;
    const { frameCount } = loader.manifest;
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
    ctx.drawImage(bitmap, (cw - dw) / 2, (ch - dh) / 2, dw, dh);
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
        const index = Math.round(progressRef.current * (loader.manifest.frameCount - 1));
        if (index !== lastDrawnRef.current) scheduleDraw();
      },
    }),
    [scheduleDraw],
  );

  // Manifest + loader lifecycle.
  useEffect(() => {
    let cancelled = false;
    let observer: IntersectionObserver | undefined;
    const onLoad = () => loaderRef.current?.start();

    loadManifest(name).then((m) => {
      if (cancelled) return;
      setManifest(m);
      const isMobile = !window.matchMedia("(min-width: 768px)").matches;
      const loader = new SequenceLoader(name, m, isMobile ? "mobile" : "desktop", () =>
        scheduleDraw(),
      );
      loaderRef.current = loader;

      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return; // poster only

      if (activate === "load") {
        if (document.readyState === "complete") loader.start();
        else window.addEventListener("load", onLoad, { once: true });
      } else if (containerRef.current) {
        observer = new IntersectionObserver(
          (entries) => {
            if (entries.some((e) => e.isIntersecting)) {
              loader.start();
              observer?.disconnect();
            }
          },
          { rootMargin: "150% 0px" },
        );
        observer.observe(containerRef.current);
      }
    });

    return () => {
      cancelled = true;
      window.removeEventListener("load", onLoad);
      observer?.disconnect();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      loaderRef.current?.dispose();
      loaderRef.current = null;
    };
  }, [name, activate, scheduleDraw]);

  // Size the canvas buffer to its box (DPR-capped) and redraw on resize.
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, DPR_CAP);
      canvas.width = Math.round(container.clientWidth * dpr);
      canvas.height = Math.round(container.clientHeight * dpr);
      lastDrawnRef.current = -1;
      scheduleDraw();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(container);
    return () => ro.disconnect();
  }, [scheduleDraw]);

  return (
    <div ref={containerRef} className={`absolute inset-0 overflow-hidden ${className}`}>
      {manifest && (
        <Image
          src={`${sequenceBase(name)}/${manifest.poster}`}
          alt=""
          fill
          priority={priority}
          sizes="100vw"
          className="object-cover"
        />
      )}
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
