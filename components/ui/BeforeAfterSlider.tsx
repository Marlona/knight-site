"use client";

import Image from "next/image";
import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";

/**
 * Full-screen draggable before/after reveal. The after image is clipped with
 * inset() driven by a CSS variable; pointer capture + gsap.quickTo keep the
 * handle buttery without React re-renders. Keyboard accessible (arrow keys).
 */
export default function BeforeAfterSlider({
  before,
  after,
}: {
  before: { src: string; label: string };
  after: { src: string; label: string };
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const positionRef = useRef(50);
  const setRevealRef = useRef<((value: number) => void) | null>(null);

  useGSAP(
    () => {
      const root = rootRef.current;
      if (!root) return;
      gsap.set(root, { "--reveal": "50%" });
      const quick = gsap.quickTo(root, "--reveal", {
        duration: 0.35,
        ease: "power3.out",
        unit: "%",
      });
      setRevealRef.current = (value: number) => {
        positionRef.current = Math.max(0, Math.min(100, value));
        quick(positionRef.current);
      };
    },
    { scope: rootRef },
  );

  const moveTo = (clientX: number) => {
    const rect = rootRef.current?.getBoundingClientRect();
    if (!rect) return;
    setRevealRef.current?.(((clientX - rect.left) / rect.width) * 100);
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    moveTo(e.clientX);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) moveTo(e.clientX);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") setRevealRef.current?.(positionRef.current - 5);
    if (e.key === "ArrowRight") setRevealRef.current?.(positionRef.current + 5);
  };

  return (
    <div
      ref={rootRef}
      className="relative h-[80vh] cursor-ew-resize touch-pan-y select-none overflow-hidden rounded-2xl"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      style={{ "--reveal": "50%" } as React.CSSProperties}
    >
      <Image src={before.src} alt={before.label} fill sizes="100vw" className="object-cover" />
      <div
        className="absolute inset-0"
        style={{ clipPath: "inset(0 calc(100% - var(--reveal)) 0 0)" }}
      >
        <Image src={after.src} alt={after.label} fill sizes="100vw" className="object-cover" />
      </div>

      {/* Oak divider + glass handle */}
      <div
        className="absolute inset-y-0 z-10 w-px bg-oak-light"
        style={{ left: "var(--reveal)" }}
      >
        <div
          role="slider"
          tabIndex={0}
          aria-label="Reveal before and after"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(positionRef.current)}
          onKeyDown={onKeyDown}
          className="glass-dark absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full outline-offset-4"
        >
          <span aria-hidden className="text-ivory">
            ⇤⇥
          </span>
        </div>
      </div>

      <p className="mono-caps glass-dark absolute bottom-5 left-5 rounded-full px-4 py-2">
        {before.label}
      </p>
      <p className="mono-caps glass-dark absolute bottom-5 right-5 rounded-full px-4 py-2">
        {after.label}
      </p>
    </div>
  );
}
