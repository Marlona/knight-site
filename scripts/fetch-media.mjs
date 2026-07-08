/**
 * Fetch generated media listed in media/request.json and place it where the
 * site expects it. Runs in GitHub Actions (the CI runner has open egress;
 * the Claude Code container does not).
 *
 * media/request.json shape:
 * {
 *   "videos": { "<sequence-name>": "https://..." },              // → media/source/<name>.mp4
 *   "images": { "public/images/projects/x.webp": { "url": "https://...", "width": 1280, "height": 960 } }
 * }
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const ROOT = path.resolve(import.meta.dirname, "..");
const request = JSON.parse(await readFile(path.join(ROOT, "media", "request.json"), "utf8"));

async function fetchBuffer(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} fetching ${url}`);
  return Buffer.from(await res.arrayBuffer());
}

for (const [name, url] of Object.entries(request.videos ?? {})) {
  const out = path.join(ROOT, "media", "source", `${name}.mp4`);
  await mkdir(path.dirname(out), { recursive: true });
  await writeFile(out, await fetchBuffer(url));
  console.log(`video: ${name}.mp4`);
}

for (const [rel, spec] of Object.entries(request.images ?? {})) {
  const out = path.join(ROOT, rel);
  await mkdir(path.dirname(out), { recursive: true });
  await sharp(await fetchBuffer(spec.url))
    .resize(spec.width, spec.height, { fit: "cover" })
    .webp({ quality: spec.quality ?? 68 })
    .toFile(out);
  console.log(`image: ${rel}`);
}
console.log("fetch-media done");
