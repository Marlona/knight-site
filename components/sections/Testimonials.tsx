"use client";

import { useRef } from "react";
import { gsap, SplitText, useGSAP } from "@/lib/gsap";
import GridLines from "@/components/ui/GridLines";
import { testimonials } from "@/lib/content";

function Stars() {
  return (
    <span role="img" className="testimonial-stars flex gap-1.5 text-ember" aria-label="Five stars">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          className="star h-4 w-4"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden
        >
          <path d="M12 2l2.9 6.3 6.9.8-5.1 4.7 1.4 6.8L12 17.2 5.9 20.6l1.4-6.8L2.2 9.1l6.9-.8L12 2z" />
        </svg>
      ))}
    </span>
  );
}

/** Luxury editorial quotes — oversized serif, line-mask reveals, star stagger. */
export default function Testimonials() {
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const splits: SplitText[] = [];
        gsap.utils.toArray<HTMLElement>(".testimonial").forEach((block) => {
          const quote = block.querySelector<HTMLElement>(".testimonial-quote-visual");
          if (!quote) return;
          const split = new SplitText(quote, {
            type: "lines",
            linesClass: "line",
            mask: "lines",
            aria: "none",
          });
          splits.push(split);

          const tl = gsap.timeline({
            scrollTrigger: {
              trigger: block,
              start: "top 72%",
              toggleActions: "play none none reverse",
            },
          });
          tl.from(split.lines, {
            yPercent: 110,
            stagger: 0.09,
            duration: 0.9,
            ease: "power3.out",
          }).from(
            block.querySelectorAll(".star"),
            { scale: 0, opacity: 0, stagger: 0.06, duration: 0.4, ease: "back.out(2)" },
            "<0.2",
          );
        });
        return () => splits.forEach((split) => split.revert());
      });
    },
    { scope: sectionRef },
  );

  return (
    <section ref={sectionRef} className="relative bg-parchment">
      <GridLines />
      <div className="relative mx-auto max-w-5xl px-6 py-24 md:py-36">
        <p className="mono-caps mb-16 text-ink/65">What clients say</p>
        <div className="space-y-24 md:space-y-32">
          {testimonials.map((testimonial) => (
            <figure key={testimonial.quote} className="testimonial">
              <Stars />
              <blockquote className="testimonial-quote font-display text-editorial mt-6 text-[clamp(1.9rem,4.5vw,3.75rem)] font-light text-ink">
                <span className="sr-only">“{testimonial.quote}”</span>
                <span aria-hidden className="testimonial-quote-visual block">
                  “{testimonial.quote}”
                </span>
              </blockquote>
              <figcaption className="mono-caps mt-6 text-ink/65">
                {testimonial.attribution}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
