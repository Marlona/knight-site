"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import SequenceCanvas, { type SequenceCanvasHandle } from "@/components/canvas/SequenceCanvas";
import ChapterMarker from "@/components/ui/ChapterMarker";
import { hostInterlude } from "@/lib/content";

/**
 * Chapter 03 — The Host. The "documentary cut": full-bleed footage behind
 * matte-black letterbox bars that ease open as the sequence scrubs.
 */
export default function HostInterlude() {
  const sectionRef = useRef<HTMLElement>(null);
  const seqRef = useRef<SequenceCanvasHandle>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top top",
            end: "bottom bottom",
            scrub: 0.5,
            onUpdate: (self) => seqRef.current?.setProgress(self.progress),
          },
        });

        tl.to(".letterbox-top", { scaleY: 0.3, duration: 0.3, ease: "power2.inOut" }, 0)
          .to(".letterbox-bottom", { scaleY: 0.3, duration: 0.3, ease: "power2.inOut" }, 0)
          .fromTo(
            ".host-copy",
            { opacity: 0, y: 36 },
            { opacity: 1, y: 0, duration: 0.2, ease: "power2.out" },
            0.3,
          );
      });
    },
    { scope: sectionRef },
  );

  return (
    <section ref={sectionRef} className="relative h-[300vh] bg-ink">
      <div className="sticky top-0 h-screen overflow-hidden">
        <SequenceCanvas ref={seqRef} name={hostInterlude.chapter.sequence} />
        <div className="absolute inset-0 bg-ink/35" />

        {/* Letterbox bars */}
        <div className="letterbox-top absolute inset-x-0 top-0 z-20 h-[18vh] origin-top bg-ink" />
        <div className="letterbox-bottom absolute inset-x-0 bottom-0 z-20 h-[18vh] origin-bottom bg-ink" />

        <div className="host-copy relative z-10 flex h-full flex-col items-center justify-center px-6 text-center">
          <ChapterMarker chapter={hostInterlude.chapter} dark />
          <h2 className="font-display text-editorial mt-8 max-w-4xl text-[clamp(2.4rem,6.5vw,5.5rem)] font-light text-ivory">
            {hostInterlude.line}
          </h2>
          <p className="mt-8 max-w-md text-ivory/75">{hostInterlude.copy}</p>
        </div>
      </div>
    </section>
  );
}
