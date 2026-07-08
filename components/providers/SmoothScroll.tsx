"use client";

import Lenis from "lenis";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";

declare global {
  interface Window {
    /** Test hook used by scripts/verify.mjs for deterministic scrolling. */
    __lenis?: Lenis;
  }
}

export default function SmoothScroll({ children }: { children: React.ReactNode }) {
  useGSAP(() => {
    document.fonts?.ready.then(() => ScrollTrigger.refresh());

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const lenis = new Lenis({ autoRaf: false, duration: 1.1 });
    lenis.on("scroll", ScrollTrigger.update);

    const raf = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);
    window.__lenis = lenis;

    return () => {
      gsap.ticker.remove(raf);
      lenis.destroy();
      delete window.__lenis;
    };
  });

  return <>{children}</>;
}
