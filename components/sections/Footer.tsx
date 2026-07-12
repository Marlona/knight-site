import Link from "next/link";
import { footer, site } from "@/lib/content";

export default function Footer() {
  return (
    <footer className="bg-ink text-ivory">
      <div className="mx-auto max-w-7xl px-6 py-16 md:px-12 md:py-20">
        <div className="flex flex-col gap-12 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="font-display text-3xl font-light">{site.studio}</p>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-ivory/60">
              {footer.mission}
            </p>
          </div>

          <nav aria-label="Social links">
            <p className="mono-caps mb-5 text-ivory/50">Follow</p>
            <ul className="space-y-3">
              {footer.socials.map((social) => (
                <li key={social.label}>
                  <a
                    href={social.href}
                    className="text-sm text-ivory/80 transition-colors hover:text-ember"
                  >
                    {social.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <p className="mono-caps mb-5 text-ivory/50">Contact</p>
            <ul className="space-y-3 text-sm">
              <li>
                <Link
                  href="/inquiry"
                  className="text-ivory transition-colors hover:text-ember"
                >
                  Start an inquiry →
                </Link>
              </li>
              <li>
                <a
                  href={`mailto:${footer.email}`}
                  className="text-ivory/80 transition-colors hover:text-ember"
                >
                  {footer.email}
                </a>
              </li>
              <li>
                <a
                  href={`tel:${footer.phone.replace(/[^+\d]/g, "")}`}
                  className="text-ivory/80 transition-colors hover:text-ember"
                >
                  {footer.phone}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-16 flex flex-col gap-3 border-t border-ivory/10 pt-8 md:flex-row md:items-center md:justify-between">
          <p className="text-xs text-ivory/45">{footer.copyright}</p>
          <p className="mono-caps text-ivory/45">
            {site.person} · Interior Design & Hospitality
          </p>
        </div>
      </div>
    </footer>
  );
}
