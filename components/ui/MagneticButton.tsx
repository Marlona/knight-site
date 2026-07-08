"use client";

import { useRef } from "react";
import { motion, useMotionValue, useSpring } from "motion/react";

/**
 * CTA button that leans toward the cursor with a spring, plus a slow
 * background sweep on hover. Pointer-driven micro-interaction → Motion,
 * not GSAP.
 */
export default function MagneticButton({
  href,
  children,
  variant = "primary",
  onClick,
}: {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "ghost";
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
}) {
  const ref = useRef<HTMLAnchorElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 180, damping: 14, mass: 0.35 });
  const sy = useSpring(y, { stiffness: 180, damping: 14, mass: 0.35 });

  const onPointerMove = (e: React.PointerEvent) => {
    const el = ref.current;
    if (!el || e.pointerType !== "mouse") return;
    const rect = el.getBoundingClientRect();
    x.set((e.clientX - rect.left - rect.width / 2) * 0.25);
    y.set((e.clientY - rect.top - rect.height / 2) * 0.35);
  };

  const reset = () => {
    x.set(0);
    y.set(0);
  };

  const styles =
    variant === "primary"
      ? "bg-ink text-ivory hover:bg-charcoal"
      : "border border-ivory/40 text-ivory hover:border-ivory";

  return (
    <motion.a
      ref={ref}
      href={href}
      onClick={onClick}
      onPointerMove={onPointerMove}
      onPointerLeave={reset}
      style={{ x: sx, y: sy }}
      whileTap={{ scale: 0.97 }}
      className={`mono-caps inline-flex items-center gap-3 rounded-full px-8 py-4 transition-colors duration-300 ${styles}`}
    >
      {children}
      <span aria-hidden>→</span>
    </motion.a>
  );
}
