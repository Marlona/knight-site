"use client";

import Image from "next/image";
import { useState } from "react";
import { motion } from "motion/react";
import type { Project } from "@/lib/content";

/**
 * Premium project card: image zooms on hover with a spring, info panel lifts,
 * and projects with "before" photography get a crossfading Before/After pill.
 */
export default function HoverCard({ project }: { project: Project }) {
  const [showBefore, setShowBefore] = useState(false);
  const hasBefore = Boolean(project.imageBefore);

  return (
    <motion.article
      className="showcase-card group relative overflow-hidden rounded-2xl bg-stone-100"
      whileHover="hover"
      initial="rest"
      animate="rest"
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <motion.div
          className="absolute inset-0"
          variants={{ rest: { scale: 1 }, hover: { scale: 1.05 } }}
          transition={{ type: "spring", stiffness: 120, damping: 18 }}
        >
          <Image
            src={project.image}
            alt={`${project.name} — ${project.type}`}
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
            className={`object-cover transition-opacity duration-500 ${
              showBefore ? "opacity-0" : "opacity-100"
            }`}
          />
          {hasBefore && (
            <Image
              src={project.imageBefore!}
              alt={`${project.name} — before`}
              fill
              sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
              className={`object-cover transition-opacity duration-500 ${
                showBefore ? "opacity-100" : "opacity-0"
              }`}
            />
          )}
        </motion.div>

        {hasBefore && (
          <div className="glass-dark absolute left-4 top-4 z-10 flex rounded-full p-1 text-[0.625rem]">
            {(["After", "Before"] as const).map((label) => {
              const isActive = (label === "Before") === showBefore;
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => setShowBefore(label === "Before")}
                  className={`mono-caps rounded-full px-3 py-1.5 transition-colors ${
                    isActive ? "bg-ivory text-ink" : "text-ivory/75 hover:text-ivory"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <motion.div
        className="p-6"
        variants={{ rest: { y: 0 }, hover: { y: -4 } }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
      >
        <p className="mono-caps flex items-center justify-between text-ink/65">
          <span>{project.location}</span>
          <span>{project.type}</span>
        </p>
        <h3 className="font-display mt-3 text-2xl font-light text-ink">{project.name}</h3>
        <p className="mt-2 text-sm leading-relaxed text-ink/65">{project.description}</p>
        <p className="mono-caps mt-4 text-ember">{project.result}</p>
      </motion.div>
    </motion.article>
  );
}
