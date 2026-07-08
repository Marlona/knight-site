/**
 * Real-footage pipeline: media/source/<name>.mp4 → public/sequences/<name>/
 * (desktop + mobile WebP frame rungs, poster, manifest.json).
 *
 * Decode with the npm-packaged ffmpeg (@ffmpeg-installer — the environment has
 * no system ffmpeg and GitHub-hosted binaries are blocked), encode with sharp.
 *
 * Usage: node scripts/extract-frames.mjs [name ...]   (default: every mp4 in media/source)
 */
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { mkdir, mkdtemp, readdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import sharp from "sharp";

const require = createRequire(import.meta.url);
const ffmpegPath = require("@ffmpeg-installer/ffmpeg").path;

const ROOT = path.resolve(import.meta.dirname, "..");
const SOURCE_DIR = path.join(ROOT, "media", "source");
const FPS = 12;
const DESKTOP = { width: 1536, height: 864, quality: 58 };
const MOBILE = { width: 768, height: 432, quality: 55 };

async function extract(name) {
  const input = path.join(SOURCE_DIR, `${name}.mp4`);
  const outBase = path.join(ROOT, "public", "sequences", name);
  const tmp = await mkdtemp(path.join(os.tmpdir(), `frames-${name}-`));

  try {
    execFileSync(
      ffmpegPath,
      [
        "-hide_banner",
        "-loglevel", "error",
        "-i", input,
        "-vf", `fps=${FPS},scale=${DESKTOP.width}:-2`,
        "-qscale:v", "2",
        path.join(tmp, "frame-%03d.jpg"),
      ],
      { stdio: "inherit" },
    );

    const jpgs = (await readdir(tmp)).filter((f) => f.endsWith(".jpg")).sort();
    if (jpgs.length === 0) throw new Error(`No frames decoded from ${input}`);

    await rm(outBase, { recursive: true, force: true });
    await mkdir(path.join(outBase, "desktop"), { recursive: true });
    await mkdir(path.join(outBase, "mobile"), { recursive: true });

    for (let i = 0; i < jpgs.length; i++) {
      const src = path.join(tmp, jpgs[i]);
      const num = String(i + 1).padStart(3, "0");
      await sharp(src)
        .resize(DESKTOP.width, DESKTOP.height, { fit: "cover" })
        .webp({ quality: DESKTOP.quality })
        .toFile(path.join(outBase, "desktop", `frame-${num}.webp`));
      await sharp(src)
        .resize(MOBILE.width, MOBILE.height, { fit: "cover" })
        .webp({ quality: MOBILE.quality })
        .toFile(path.join(outBase, "mobile", `frame-${num}.webp`));
      if (i === 0) {
        await sharp(src)
          .resize(DESKTOP.width, DESKTOP.height, { fit: "cover" })
          .webp({ quality: 70 })
          .toFile(path.join(outBase, "poster.webp"));
      }
    }

    const manifest = {
      name,
      frameCount: jpgs.length,
      fps: FPS,
      poster: "poster.webp",
      variants: {
        desktop: { width: DESKTOP.width, height: DESKTOP.height, path: "desktop/frame-{i}.webp" },
        mobile: { width: MOBILE.width, height: MOBILE.height, path: "mobile/frame-{i}.webp" },
      },
    };
    await writeFile(path.join(outBase, "manifest.json"), JSON.stringify(manifest, null, 2));
    console.log(`extracted: ${name} → ${jpgs.length} frames × 2 variants`);
  } finally {
    await rm(tmp, { recursive: true, force: true });
  }
}

let names = process.argv.slice(2);
if (names.length === 0) {
  names = (await readdir(SOURCE_DIR).catch(() => []))
    .filter((f) => f.endsWith(".mp4"))
    .map((f) => f.replace(/\.mp4$/, ""));
}
if (names.length === 0) {
  console.error(`No inputs. Drop mp4s into ${SOURCE_DIR} or pass names.`);
  process.exit(1);
}
for (const name of names) {
  await extract(name);
}
