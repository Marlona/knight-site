"use client";

import { useRef } from "react";
import { gsap, SplitText, useGSAP } from "@/lib/gsap";
import SequenceCanvas, { type SequenceCanvasHandle } from "@/components/canvas/SequenceCanvas";
import ChapterMarker from "@/components/ui/ChapterMarker";
import MagneticButton from "@/components/ui/MagneticButton";
import { finalCta } from "@/lib/content";

/**
 * Chapter 04 — The Operator. The dashboards sequence scrubs to Andrea's
 * hero-pose closing frame while the CTA reveals.
 */
export default function FinalCta() {
  const sectionRef = useRef<HTMLElement>(null);
  const seqRef = useRef<SequenceCanvasHandle>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const split = new SplitText(".cta-headline-visual", { type: "words", aria: "none" });
        gsap.set(split.words, { yPercent: 120, opacity: 0 });

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
          split.words,
          { yPercent: 0, opacity: 1, stagger: 0.03, duration: 0.25, ease: "power3.out" },
          0.15,
        ).fromTo(
          ".cta-actions",
          { opacity: 0, y: 32 },
          { opacity: 1, y: 0, duration: 0.2, ease: "power2.out" },
          0.45,
        );

        return () => split.revert();
      });
    },
    { scope: sectionRef },
  );

  const scrollToShowcase = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const target = document.querySelector("#showcase");
    if (!target) return;
    if (window.__lenis) window.__lenis.scrollTo(target as HTMLElement, { duration: 1.6 });
    else target.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section ref={sectionRef} className="relative h-[300vh] bg-ink">
      <div className="sticky top-0 h-screen overflow-hidden">
        <SequenceCanvas ref={seqRef} name={finalCta.chapter.sequence} />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/40 to-ink/30" />

        <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center">
          <ChapterMarker chapter={finalCta.chapter} dark />
          <h2 className="cta-headline font-display text-editorial mt-8 max-w-4xl text-[clamp(2.75rem,8vw,7rem)] font-light text-ivory">
            <span className="sr-only">{finalCta.headline}</span>
            <span aria-hidden className="cta-headline-visual block">
              {finalCta.headline}
            </span>
          </h2>
          <p className="cta-copy mt-8 max-w-lg text-ivory/75">{finalCta.copy}</p>
          <div className="cta-actions mt-12 flex flex-col items-center gap-4 sm:flex-row">
            <MagneticButton href={finalCta.primary.href}>{finalCta.primary.label}</MagneticButton>
            <MagneticButton href={finalCta.secondary.target} variant="ghost" onClick={scrollToShowcase}>
              {finalCta.secondary.label}
            </MagneticButton>
          </div>
        </div>
      </div>
    </section>
  );
}
