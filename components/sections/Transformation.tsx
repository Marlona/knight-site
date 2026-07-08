import BeforeAfterSlider from "@/components/ui/BeforeAfterSlider";
import SectionHeading from "@/components/ui/SectionHeading";
import { transformation } from "@/lib/content";

export default function Transformation() {
  return (
    <section className="relative bg-ivory">
      <div className="mx-auto max-w-7xl px-6 py-24 md:px-12 md:py-36">
        <SectionHeading kicker={transformation.kicker}>
          {transformation.headline}
        </SectionHeading>
        <BeforeAfterSlider before={transformation.before} after={transformation.after} />
      </div>
    </section>
  );
}
