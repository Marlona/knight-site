"use client";

import { useRef } from "react";
import { gsap, SplitText, useGSAP } from "@/lib/gsap";
import SequenceCanvas, { type SequenceCanvasHandle } from "@/components/canvas/SequenceCanvas";
import ChapterMarker from "@/components/ui/ChapterMarker";
import { about } from "@/lib/content";

/**
 * Chapter 02 — The Designer. Pinned sequence; three editorial statements
 * exchange via line masks while the room "assembles" behind them, closing on
 * the bio panel.
 */
export default function About() {
  const sectionRef = useRef<HTMLElement>(null);
  const seqRef = useRef<SequenceCanvasHandle>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.set(".about-bio", { opacity: 0, y: 48 });

        const splits = gsap.utils.toArray<HTMLElement>(".about-line").map(
          (el) => new SplitText(el, { type: "words", aria: "none" }),
        );
        splits.forEach((split) => gsap.set(split.words, { yPercent: 120, opacity: 0 }));

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top top",
            end: "bottom bottom",
            scrub: 0.5,
            onUpdate: (self) => seqRef.current?.setProgress(self.progress),
          },
        });

        const slots = [0.04, 0.3, 0.56];
        splits.forEach((split, i) => {
          tl.to(
            split.words,
            { yPercent: 0, opacity: 1, stagger: 0.02, duration: 0.1, ease: "power3.out" },
            slots[i],
          );
          tl.to(
            split.words,
            { yPercent: -120, opacity: 0, stagger: 0.015, duration: 0.08, ease: "power3.in" },
            slots[i] + 0.16,
          );
        });

        tl.to(".about-bio", { opacity: 1, y: 0, duration: 0.16, ease: "power2.out" }, 0.8);

        return () => splits.forEach((split) => split.revert());
      });
    },
    { scope: sectionRef },
  );

  return (
    <section ref={sectionRef} className="relative h-[350vh] bg-parchment">
      <div className="sticky top-0 flex h-screen items-center justify-center overflow-hidden">
        <SequenceCanvas ref={seqRef} name={about.chapter.sequence} />
        <div className="absolute inset-0 bg-ivory/35" />

        <div className="absolute left-6 top-8 md:left-12 md:top-12">
          <ChapterMarker chapter={about.chapter} />
        </div>

        <p className="sr-only">{about.lines.join(" ")}</p>
        <div aria-hidden className="relative z-10 mx-auto max-w-5xl px-6 text-center">
          {about.lines.map((line) => (
            <p
              key={line}
              className="about-line font-display text-editorial absolute inset-x-0 top-1/2 -translate-y-1/2 px-6 text-[clamp(2rem,5.5vw,4.5rem)] font-light text-ink"
            >
              {line}
            </p>
          ))}
        </div>

        <div className="about-bio glass absolute inset-x-6 bottom-8 z-20 mx-auto max-w-2xl rounded-2xl p-8 md:bottom-14 md:p-10">
          <p className="text-base leading-relaxed text-ink/85 md:text-lg">{about.bio}</p>
          <p className="mono-caps mt-6 text-ink/70">{about.signature}</p>
        </div>
      </div>
    </section>
  );
}
