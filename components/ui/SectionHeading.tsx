/** Oversized editorial section heading with an eyebrow kicker. */
export default function SectionHeading({
  kicker,
  children,
  dark = false,
}: {
  kicker: string;
  children: React.ReactNode;
  dark?: boolean;
}) {
  return (
    <header className="mb-14 md:mb-20">
      <p className={`mono-caps mb-5 ${dark ? "text-ivory/70" : "text-ink/65"}`}>{kicker}</p>
      <h2
        className={`font-display text-editorial text-[clamp(2.5rem,7vw,5.5rem)] font-light ${
          dark ? "text-ivory" : "text-ink"
        }`}
      >
        {children}
      </h2>
    </header>
  );
}
