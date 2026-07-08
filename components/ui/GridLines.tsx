/** Thin architectural column rules behind a section's content. */
export default function GridLines({ dark = false }: { dark?: boolean }) {
  const rule = dark ? "border-ivory/8" : "border-ink/6";
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      <div className="mx-auto grid h-full max-w-6xl grid-cols-3 px-6 md:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className={`border-l ${rule} last:border-r ${i > 2 ? "hidden md:block" : ""}`}
          />
        ))}
      </div>
    </div>
  );
}
