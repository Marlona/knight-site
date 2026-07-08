/**
 * Procedural placeholder media, elegant enough to ship:
 *  - 4 scroll-scrub sequences (96 frames × desktop/mobile WebP + poster + manifest)
 *    with drifting architectural line-art over warm gradient fields
 *  - project showcase stills (+ "before" variants) and the before/after pair
 *
 * Real AI-generated media overwrites these same paths; components never know
 * the difference (they read manifest.json / content.ts paths only).
 *
 * Usage: node scripts/make-placeholders.mjs
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const ROOT = path.resolve(import.meta.dirname, "..");
const FRAME_COUNT = 96;
const FPS = 12;
const DESKTOP = { width: 1536, height: 864 };
const MOBILE = { width: 768, height: 432 };

/** Per-sequence art direction: gradient stops, line color, glow behavior. */
const SEQUENCES = {
  visionary: {
    label: "The Visionary",
    index: "01",
    bg: ["#f5f0e6", "#e6ddc9", "#d8cbb2"],
    line: "#a67c52",
    text: "#17130f",
    glow: { color: "#ffe8c2", from: 0.25, to: 0.85 }, // sunlight warming up
  },
  designer: {
    label: "The Designer",
    index: "02",
    bg: ["#efe9db", "#ded4bf", "#c9bda3"],
    line: "#8a6a44",
    text: "#17130f",
    glow: { color: "#fff3d9", from: 0.2, to: 0.6 },
    blueprint: true, // denser drafting grid that "assembles"
  },
  host: {
    label: "The Host",
    index: "03",
    bg: ["#2b241c", "#3a2f23", "#211c16"],
    line: "#c9a87c",
    text: "#faf7f1",
    glow: { color: "#b45e2d", from: 0.1, to: 0.9 }, // lights switching on
  },
  operator: {
    label: "The Operator",
    index: "04",
    bg: ["#17130f", "#211c16", "#17130f"],
    line: "#b3a68e",
    text: "#faf7f1",
    glow: { color: "#c9a87c", from: 0.15, to: 0.5 },
    bars: true, // faint data columns
  },
};

const ease = (t) => t * t * (3 - 2 * t);
const lerp = (a, b, t) => a + (b - a) * t;
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function sequenceSvg(name, cfg, t, { width, height }) {
  const w = width;
  const h = height;
  const drift = ease(t);

  // Drifting vertical architectural rules
  const verticals = Array.from({ length: 9 }, (_, i) => {
    const base = (i + 0.5) / 9;
    const x = (base + Math.sin((t + i * 0.35) * Math.PI * 2) * 0.012) * w;
    const opacity = 0.10 + 0.08 * Math.sin((t * 2 + i * 0.7) * Math.PI);
    return `<line x1="${x.toFixed(1)}" y1="0" x2="${x.toFixed(1)}" y2="${h}" stroke="${cfg.line}" stroke-width="1" opacity="${Math.max(0.04, opacity).toFixed(3)}"/>`;
  }).join("");

  // Perspective floor lines converging as the "room takes shape"
  const horizon = h * 0.52;
  const floorLines = Array.from({ length: 6 }, (_, i) => {
    const p = (i + 1) / 6;
    const y = lerp(horizon, h, p * p);
    const inset = lerp(w * 0.5, 0, p) * (1 - 0.6 * drift);
    return `<line x1="${inset.toFixed(1)}" y1="${y.toFixed(1)}" x2="${(w - inset).toFixed(1)}" y2="${y.toFixed(1)}" stroke="${cfg.line}" stroke-width="1" opacity="${(0.05 + 0.1 * drift * (1 - p)).toFixed(3)}"/>`;
  }).join("");

  const blueprint = cfg.blueprint
    ? Array.from({ length: 12 }, (_, i) => {
        const y = ((i + 0.5) / 12) * h;
        const reveal = Math.min(1, Math.max(0, drift * 2.2 - i / 12));
        return `<line x1="0" y1="${y.toFixed(1)}" x2="${(w * reveal).toFixed(1)}" y2="${y.toFixed(1)}" stroke="${cfg.line}" stroke-width="0.6" opacity="0.07"/>`;
      }).join("")
    : "";

  const bars = cfg.bars
    ? Array.from({ length: 14 }, (_, i) => {
        const bw = w / 24;
        const x = ((i + 0.6) / 14) * w;
        const bh = h * (0.06 + 0.22 * Math.abs(Math.sin(i * 1.7 + t * Math.PI * 2)) * drift);
        return `<rect x="${(x - bw / 2).toFixed(1)}" y="${(h * 0.78 - bh).toFixed(1)}" width="${bw.toFixed(1)}" height="${bh.toFixed(1)}" fill="${cfg.line}" opacity="0.08"/>`;
      }).join("")
    : "";

  const glowStrength = lerp(cfg.glow.from, cfg.glow.to, drift);
  const glowX = lerp(0.3, 0.68, drift) * w;

  const wordX = lerp(0.06, 0.1, drift) * w;
  const wordSize = h * 0.16;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0.9" y2="1">
      <stop offset="0" stop-color="${cfg.bg[0]}"/>
      <stop offset="0.55" stop-color="${cfg.bg[1]}"/>
      <stop offset="1" stop-color="${cfg.bg[2]}"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="${cfg.glow.color}" stop-opacity="${glowStrength.toFixed(3)}"/>
      <stop offset="1" stop-color="${cfg.glow.color}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="vignette" cx="0.5" cy="0.5" r="0.72">
      <stop offset="0.62" stop-color="#000" stop-opacity="0"/>
      <stop offset="1" stop-color="#000" stop-opacity="0.22"/>
    </radialGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#bg)"/>
  <ellipse cx="${glowX.toFixed(1)}" cy="${(h * 0.42).toFixed(1)}" rx="${(w * 0.42).toFixed(1)}" ry="${(h * 0.5).toFixed(1)}" fill="url(#glow)"/>
  ${verticals}
  ${floorLines}
  ${blueprint}
  ${bars}
  <text x="${wordX.toFixed(1)}" y="${(h * 0.5).toFixed(1)}" font-family="Georgia, serif" font-size="${wordSize.toFixed(0)}" fill="${cfg.text}" opacity="0.09" letter-spacing="2">${cfg.label.toUpperCase()}</text>
  <text x="${wordX.toFixed(1)}" y="${(h * 0.5 + wordSize * 0.9).toFixed(1)}" font-family="Georgia, serif" font-size="${(wordSize * 0.45).toFixed(0)}" fill="${cfg.text}" opacity="0.07">CHAPTER ${cfg.index}</text>
  <rect width="${w}" height="${h}" fill="url(#vignette)"/>
</svg>`;
}

async function buildSequence(name, cfg) {
  const base = path.join(ROOT, "public", "sequences", name);
  await mkdir(path.join(base, "desktop"), { recursive: true });
  await mkdir(path.join(base, "mobile"), { recursive: true });

  for (let i = 0; i < FRAME_COUNT; i++) {
    const t = i / (FRAME_COUNT - 1);
    const svg = Buffer.from(sequenceSvg(name, cfg, t, DESKTOP));
    const num = String(i + 1).padStart(3, "0");
    const desktop = sharp(svg).webp({ quality: 58 });
    await desktop.clone().toFile(path.join(base, "desktop", `frame-${num}.webp`));
    await sharp(svg)
      .resize(MOBILE.width, MOBILE.height)
      .webp({ quality: 55 })
      .toFile(path.join(base, "mobile", `frame-${num}.webp`));
    if (i === 0) {
      await sharp(svg).webp({ quality: 70 }).toFile(path.join(base, "poster.webp"));
    }
  }

  const manifest = {
    name,
    frameCount: FRAME_COUNT,
    fps: FPS,
    poster: "poster.webp",
    variants: {
      desktop: { ...DESKTOP, path: "desktop/frame-{i}.webp" },
      mobile: { ...MOBILE, path: "mobile/frame-{i}.webp" },
    },
  };
  await writeFile(path.join(base, "manifest.json"), JSON.stringify(manifest, null, 2));
  console.log(`sequence: ${name} (${FRAME_COUNT} frames × 2 variants)`);
}

function stillSvg({ w, h, palette, label, sub, muted = false }) {
  const [c0, c1, c2] = palette;
  const lines = Array.from({ length: 7 }, (_, i) => {
    const x = ((i + 0.5) / 7) * w;
    return `<line x1="${x}" y1="0" x2="${x}" y2="${h}" stroke="#a67c52" stroke-width="1" opacity="${muted ? 0.05 : 0.1}"/>`;
  }).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0.8" y2="1">
      <stop offset="0" stop-color="${c0}"/>
      <stop offset="0.6" stop-color="${c1}"/>
      <stop offset="1" stop-color="${c2}"/>
    </linearGradient>
    <radialGradient id="vignette" cx="0.5" cy="0.45" r="0.75">
      <stop offset="0.6" stop-color="#000" stop-opacity="0"/>
      <stop offset="1" stop-color="#000" stop-opacity="0.25"/>
    </radialGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#bg)"/>
  ${lines}
  <line x1="0" y1="${h * 0.62}" x2="${w}" y2="${h * 0.62}" stroke="#a67c52" stroke-width="1" opacity="${muted ? 0.08 : 0.16}"/>
  <text x="${w * 0.07}" y="${h * 0.5}" font-family="Georgia, serif" font-size="${h * 0.09}" fill="${muted ? "#5c554a" : "#17130f"}" opacity="0.5">${esc(label)}</text>
  <text x="${w * 0.07}" y="${h * 0.5 + h * 0.075}" font-family="Georgia, serif" font-size="${h * 0.035}" fill="${muted ? "#5c554a" : "#17130f"}" opacity="0.4" letter-spacing="4">${esc(sub.toUpperCase())}</text>
  <rect width="${w}" height="${h}" fill="url(#vignette)"/>
</svg>`;
}

const WARM = ["#efe8d9", "#ddd0b8", "#c6b493"];
const MUTED = ["#d9d5cc", "#c7c2b7", "#aaa79e"];

async function buildStills() {
  const projectsDir = path.join(ROOT, "public", "images", "projects");
  const baDir = path.join(ROOT, "public", "images", "before-after");
  await mkdir(projectsDir, { recursive: true });
  await mkdir(baDir, { recursive: true });

  const projects = [
    ["ember-suite", "The Ember Suite", "Atlanta, GA", true],
    ["willow-vine", "Willow & Vine", "Nashville, TN", true],
    ["gathering-house", "The Gathering House", "Charlotte, NC", true],
    ["maison-noir", "Maison Noir", "Savannah, GA", false],
    ["canopy-loft", "The Canopy Loft", "Asheville, NC", true],
    ["hearth-haven", "Hearth & Haven", "Blue Ridge, GA", false],
  ];

  for (const [slug, name, location, hasBefore] of projects) {
    const svg = Buffer.from(stillSvg({ w: 1280, h: 960, palette: WARM, label: name, sub: location }));
    await sharp(svg).webp({ quality: 68 }).toFile(path.join(projectsDir, `${slug}.webp`));
    if (hasBefore) {
      const beforeSvg = Buffer.from(
        stillSvg({ w: 1280, h: 960, palette: MUTED, label: name, sub: "Before", muted: true }),
      );
      await sharp(beforeSvg).webp({ quality: 68 }).toFile(path.join(projectsDir, `${slug}-before.webp`));
    }
  }

  await sharp(
    Buffer.from(stillSvg({ w: 1920, h: 1080, palette: MUTED, label: "Empty shell", sub: "Before", muted: true })),
  )
    .webp({ quality: 70 })
    .toFile(path.join(baDir, "shell.webp"));
  await sharp(
    Buffer.from(stillSvg({ w: 1920, h: 1080, palette: WARM, label: "Fully staged", sub: "After — Knight & Ember" })),
  )
    .webp({ quality: 70 })
    .toFile(path.join(baDir, "staged.webp"));
  console.log("stills: 6 projects (+before variants) + before/after pair");
}

for (const [name, cfg] of Object.entries(SEQUENCES)) {
  await buildSequence(name, cfg);
}
await buildStills();
console.log("placeholders done");
