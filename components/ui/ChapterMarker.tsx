import type { Chapter } from "@/lib/content";

/** "CHAPTER 01 · THE VISIONARY" eyebrow used at the top of each cinematic section. */
export default function ChapterMarker({
  chapter,
  dark = false,
}: {
  chapter: Chapter;
  dark?: boolean;
}) {
  return (
    <p className={`mono-caps flex items-center gap-3 ${dark ? "text-ivory/70" : "text-ink/60"}`}>
      <span className={`inline-block h-px w-10 ${dark ? "bg-ivory/40" : "bg-ink/30"}`} />
      Chapter {chapter.index} · {chapter.title}
    </p>
  );
}
