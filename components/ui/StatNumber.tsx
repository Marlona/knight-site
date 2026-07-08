"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import type { Stat } from "@/lib/content";

function format(value: number, stat: Stat): string {
  const body =
    stat.decimals != null
      ? value.toFixed(stat.decimals)
      : Math.round(value).toLocaleString("en-US");
  return `${stat.prefix ?? ""}${body}${stat.suffix ?? ""}`;
}

/** One animated stat — counts up once when it enters the viewport. */
export default function StatNumber({ stat }: { stat: Stat }) {
  const ref = useRef<HTMLDivElement>(null);
  const valueRef = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      const el = valueRef.current;
      if (!el) return;

      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        el.textContent = format(stat.value, stat);
        return;
      }

      const counter = { value: 0 };
      gsap.to(counter, {
        value: stat.value,
        duration: 1.6,
        ease: "power2.out",
        scrollTrigger: { trigger: ref.current, start: "top 78%", once: true },
        onUpdate: () => {
          el.textContent = format(counter.value, stat);
        },
      });
    },
    { scope: ref },
  );

  return (
    <div ref={ref} className="py-10 md:py-14">
      <span
        ref={valueRef}
        className="font-display tabular block text-[clamp(2.75rem,6vw,5rem)] font-light leading-none text-ink"
      >
        {format(0, stat)}
      </span>
      <span className="mono-caps mt-3 block text-ink/70">{stat.label}</span>
    </div>
  );
}
