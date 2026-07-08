"use client";

import { useRef } from "react";
import { gsap, SplitText, useGSAP } from "@/lib/gsap";
import SequenceCanvas, { type SequenceCanvasHandle } from "@/components/canvas/SequenceCanvas";
import ChapterMarker from "@/components/ui/ChapterMarker";
import { hero, site } from "@/lib/content";

/**
 * Chapter 01 — The Visionary. 400vh scroll runway; the viewport stays sticky
 * while one ScrollTrigger scrubs the walkthrough sequence and reveals the
 * headline letter-by-letter.
 */
export default function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const seqRef = useRef<SequenceCanvasHandle>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const split = new SplitText(".hero-line-inner", { type: "chars", aria: "none" });
        gsap.set(split.chars, { yPercent: 120 });

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top top",
            end: "bottom bottom",
            scrub: 0.5,
            onUpdate: (self) => seqRef.current?.setProgress(self.progress),
          },
        });

        tl.to(
          split.chars,
          { yPercent: 0, stagger: 0.015, ease: "power3.out", duration: 0.28 },
          0.02,
        )
          .fromTo(
            ".hero-service",
            { opacity: 0, y: 20 },
            { opacity: 1, y: 0, stagger: 0.04, duration: 0.12, ease: "power2.out" },
            0.3,
          )
          .to(".hero-cue", { opacity: 0, duration: 0.04 }, 0.04)
          .to(".hero-veil", { opacity: 0.75, duration: 0.4 }, 0.6);

        return () => split.revert();
      });
    },
    { scope: sectionRef },
  );

  return (
    <section ref={sectionRef} id="top" className="relative h-[400vh] bg-charcoal">
      <div className="sticky top-0 h-screen overflow-hidden">
        <SequenceCanvas ref={seqRef} name={hero.chapter.sequence} activate="load" priority />
        {/* Readability gradient over the footage */}
        <div className="hero-veil absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/25 to-ink/40" />

        <div className="relative z-10 flex h-full flex-col justify-between p-6 md:p-12">
          <div className="flex items-center justify-between">
            <p className="font-display text-xl tracking-tight text-ivory">{site.studio}</p>
            <p className="mono-caps hidden text-ivory/70 md:block">
              {site.person} · Portfolio
            </p>
          </div>

          <div>
            <div className="mb-6">
              <ChapterMarker chapter={hero.chapter} dark />
            </div>
            <h1 className="font-display text-editorial max-w-5xl font-light text-ivory">
              <span className="sr-only">{hero.headline.join(" ")}</span>
              <span aria-hidden>
                {hero.headline.map((line) => (
                  <span
                    key={line}
                    className="block overflow-hidden text-[clamp(2.6rem,8vw,7rem)]"
                  >
                    <span className="hero-line-inner block">{line}</span>
                  </span>
                ))}
              </span>
            </h1>

            <div className="mt-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <ul className="flex flex-wrap items-center gap-x-3 gap-y-2">
                {hero.services.map((service, i) => (
                  <li key={service} className="hero-service mono-caps flex items-center gap-3 text-ivory/85">
                    {i > 0 && <span aria-hidden className="text-ember">•</span>}
                    {service}
                  </li>
                ))}
              </ul>
              <p className="hero-cue mono-caps flex items-center gap-3 text-ivory/60">
                {hero.scrollCue}
                <span aria-hidden className="animate-bounce">↓</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
