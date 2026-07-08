/**
 * Scroll-and-screenshot verification harness.
 *
 * Loads the production site in headless Chromium at desktop + mobile
 * viewports, fails on any console error / page error, scrolls through every
 * section at enter/mid/exit offsets via the Lenis test hook, screenshots each
 * state to verify-output/, and asserts the hero canvas actually painted frames
 * and the stats reached their final values.
 *
 * Usage: node scripts/verify.mjs [baseUrl]   (default http://localhost:3000)
 */
import { mkdir, rm } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const BASE_URL = process.argv[2] ?? "http://localhost:3000";
const OUT = path.resolve(import.meta.dirname, "..", "verify-output");

const VIEWPORTS = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "mobile", width: 390, height: 844 },
];

/** [label, docHeightFraction] — enter/mid/exit passes through every section. */
const STOPS = [
  ["hero-top", 0],
  ["hero-mid", 0.06],
  ["hero-end", 0.13],
  ["stats", 0.17],
  ["about-start", 0.22],
  ["about-mid", 0.28],
  ["about-end", 0.34],
  ["services-start", 0.4],
  ["services-mid", 0.46],
  ["services-end", 0.52],
  ["host-start", 0.56],
  ["host-mid", 0.61],
  ["showcase", 0.68],
  ["transformation", 0.76],
  ["testimonials", 0.82],
  ["cta-start", 0.88],
  ["cta-mid", 0.93],
  ["footer", 1],
];

const failures = [];

async function run(viewport) {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport });

  const consoleErrors = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });
  page.on("pageerror", (err) => consoleErrors.push(`pageerror: ${err.message}`));

  await page.goto(BASE_URL, { waitUntil: "networkidle" });
  await page.waitForTimeout(800);

  for (const [label, fraction] of STOPS) {
    await page.evaluate((f) => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const y = Math.round(max * f);
      if (window.__lenis) window.__lenis.scrollTo(y, { immediate: true, force: true });
      else window.scrollTo(0, y);
    }, fraction);
    await page.waitForTimeout(450);
    await page.screenshot({
      path: path.join(OUT, `${viewport.name}-${label}.png`),
    });
  }

  // Assert: hero sequence canvas painted at least one frame.
  const heroPainted = await page.evaluate(() => {
    const canvas = document.querySelector('canvas[data-sequence="visionary"]');
    return canvas?.getAttribute("data-painted") === "true";
  });
  if (!heroPainted) failures.push(`[${viewport.name}] hero canvas never painted a frame`);

  // Assert: stats reached final values (we scrolled past them).
  const statsOk = await page.evaluate(() => {
    const text = Array.from(document.querySelectorAll(".tabular")).map(
      (el) => el.textContent ?? "",
    );
    return (
      text.some((t) => t.includes("1,000+")) &&
      text.some((t) => t.includes("4.95★")) &&
      text.some((t) => t.includes("94%"))
    );
  });
  if (!statsOk) failures.push(`[${viewport.name}] stats did not reach final values`);

  if (consoleErrors.length > 0) {
    failures.push(
      `[${viewport.name}] ${consoleErrors.length} console error(s):\n  ${[...new Set(consoleErrors)].slice(0, 10).join("\n  ")}`,
    );
  }

  await browser.close();
  console.log(`✓ ${viewport.name}: ${STOPS.length} scroll stops captured`);
}

await rm(OUT, { recursive: true, force: true });
await mkdir(OUT, { recursive: true });

for (const viewport of VIEWPORTS) {
  await run(viewport);
}

if (failures.length > 0) {
  console.error(`\nFAILURES:\n${failures.join("\n")}`);
  process.exit(1);
}
console.log("\nAll verification checks passed.");
