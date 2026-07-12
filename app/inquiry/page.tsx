import type { Metadata } from "next";
import Link from "next/link";
import InquiryForm from "@/components/inquiry/InquiryForm";
import { site } from "@/lib/content";

export const metadata: Metadata = {
  title: `Start Your Inquiry — ${site.studio}`,
  description:
    "Tell us about your project. Interior design, Airbnb setup, property management, co-hosting, and hospitality coaching inquiries.",
};

export default function InquiryPage() {
  return (
    <main className="relative min-h-screen bg-ivory">
      <div className="mx-auto max-w-3xl px-6 py-16 md:py-24">
        <header className="mb-16 md:mb-20">
          <Link href="/" className="mono-caps text-ink/60 transition-colors hover:text-ember">
            ← {site.studio}
          </Link>
          <p className="mono-caps mt-12 text-oak">Start your project</p>
          <h1 className="font-display text-editorial mt-5 text-[clamp(2.5rem,7vw,4.5rem)] font-light text-ink">
            Let&apos;s talk about
            <br />
            your space.
          </h1>
          <p className="mt-6 max-w-lg leading-relaxed text-ink/65">
            A few questions so we can prepare for a meaningful first conversation. It takes
            about three minutes — the more you share, the better we can help.
          </p>
        </header>

        <InquiryForm />
      </div>
    </main>
  );
}
