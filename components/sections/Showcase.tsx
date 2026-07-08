"use client";

import { useRef } from "react";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import HoverCard from "@/components/ui/HoverCard";
import SectionHeading from "@/components/ui/SectionHeading";
import { projects } from "@/lib/content";

export default function Showcase() {
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      gsap.set(".showcase-card", { opacity: 0, y: 48 });
      ScrollTrigger.batch(".showcase-card", {
        start: "top 85%",
        once: true,
        onEnter: (batch) =>
          gsap.to(batch, { opacity: 1, y: 0, stagger: 0.09, duration: 0.8, ease: "power3.out" }),
      });
    },
    { scope: sectionRef },
  );

  return (
    <section ref={sectionRef} id="showcase" className="relative bg-parchment">
      <div className="mx-auto max-w-7xl px-6 py-24 md:px-12 md:py-36">
        <SectionHeading kicker="Selected work">
          Spaces that earn
          <br />
          their keep.
        </SectionHeading>
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <HoverCard key={project.slug} project={project} />
          ))}
        </div>
      </div>
    </section>
  );
}
