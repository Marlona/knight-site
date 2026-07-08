import GridLines from "@/components/ui/GridLines";
import StatNumber from "@/components/ui/StatNumber";
import { stats } from "@/lib/content";

export default function Stats() {
  return (
    <section className="relative bg-ivory">
      <GridLines />
      <div className="relative mx-auto max-w-6xl px-6 py-24 md:py-36">
        <p className="mono-caps mb-8 text-ink/65">The record so far</p>
        <div className="hairline-t grid grid-cols-2 md:grid-cols-3">
          {stats.map((stat) => (
            <div key={stat.label} className="hairline-b px-2 md:px-6">
              <StatNumber stat={stat} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
