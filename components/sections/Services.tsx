"use client";

import dynamic from "next/dynamic";
import { useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import GridLines from "@/components/ui/GridLines";
import { services } from "@/lib/content";

const BlueprintRoom = dynamic(() => import("@/components/canvas/BlueprintRoom"), {
  ssr: false,
});

/**
 * Pinned split layout: the left column holds the oversized service index and
 * the wireframe room assembling with scroll; the right column scrolls the four
 * service groups. Stacks plainly on mobile.
 */
export default function Services() {
  const sectionRef = useRef<HTMLElement>(null);
  const progressRef = useRef(0);
  const [active, setActive] = useState(0);
  const [roomMounted, setRoomMounted] = useState(false);

  useGSAP(
    () => {
      ScrollTrigger.create({
        trigger: sectionRef.current,
        start: "top 80%",
        once: true,
        onEnter: () => setRoomMounted(true),
      });

      ScrollTrigger.create({
        trigger: sectionRef.current,
        start: "top top",
        end: "bottom bottom",
        onUpdate: (self) => {
          progressRef.current = self.progress;
        },
      });

      gsap.utils.toArray<HTMLElement>(".service-group").forEach((el, i) => {
        ScrollTrigger.create({
          trigger: el,
          start: "top 55%",
          end: "bottom 55%",
          onEnter: () => setActive(i),
          onEnterBack: () => setActive(i),
        });

        gsap.fromTo(
          el,
          { opacity: 0, y: 32 },
          {
            opacity: 1,
            y: 0,
            duration: 0.7,
            ease: "power2.out",
            scrollTrigger: { trigger: el, start: "top 75%", toggleActions: "play none none reverse" },
          },
        );
      });
    },
    { scope: sectionRef },
  );

  return (
    <section ref={sectionRef} className="relative bg-ivory">
      <GridLines />
      <div className="relative mx-auto max-w-7xl gap-12 px-6 md:grid md:grid-cols-2 md:px-12">
        {/* Left: pinned index + blueprint room (desktop only) */}
        <div className="hidden md:block">
          <div className="sticky top-0 flex h-screen flex-col justify-center">
            <p className="mono-caps mb-4 text-ink/65">Services</p>
            <AnimatePresence mode="wait">
              <motion.div
                key={active}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -24 }}
                transition={{ duration: 0.35, ease: [0.65, 0.05, 0, 1] }}
              >
                <span aria-hidden className="font-display block text-[7rem] font-light leading-none text-oak">
                  {services[active].index}
                </span>
                <h2 className="font-display text-editorial mt-2 text-4xl font-light text-ink">
                  {services[active].title}
                </h2>
              </motion.div>
            </AnimatePresence>
            <div className="mt-8 h-[340px] w-full">
              {roomMounted && <BlueprintRoom progressRef={progressRef} />}
            </div>
          </div>
        </div>

        {/* Right: scrolling service groups */}
        <div className="py-24 md:py-[38vh]">
          <p className="mono-caps mb-10 text-ink/65 md:hidden">Services</p>
          <div className="space-y-24 md:space-y-[32vh]">
            {services.map((service) => (
              <article key={service.index} className="service-group">
                <span aria-hidden className="font-display text-6xl font-light text-oak md:hidden">
                  {service.index}
                </span>
                <h3 className="font-display text-editorial mt-2 text-3xl font-light text-ink md:text-4xl">
                  {service.title}
                </h3>
                <p className="mt-4 max-w-md text-ink/70">{service.intro}</p>
                <ul className="hairline-t mt-8">
                  {service.items.map((item) => (
                    <li
                      key={item}
                      className="hairline-b flex items-center justify-between py-3.5 text-sm text-ink/80"
                    >
                      {item}
                      <span aria-hidden className="text-ember/70">—</span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
