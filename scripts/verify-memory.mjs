import assert from 'node:assert/strict';
import { webkit } from 'playwright';
const base = process.argv[2] ?? 'http://localhost:8787';
const baseline = process.argv.includes('--baseline');
const browser = await webkit.launch();
try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, deviceScaleFactor: 3 });
  await page.addInitScript(() => {
    const original = window.createImageBitmap.bind(window);
    window.frameStats = { live: 0, peak: 0, pending: 0, peakPending: 0, decoded: 0 };
    window.createImageBitmap = async (...args) => {
      const stats = window.frameStats;
      stats.pending++;
      stats.peakPending = Math.max(stats.peakPending, stats.pending);
      try {
        const result = await original(...args);
        const bytes = result.width * result.height * 4;
        stats.live += bytes;
        stats.peak = Math.max(stats.peak, stats.live);
        stats.decoded++;
        const close = result.close.bind(result);
        let closed = false;
        result.close = () => { if (!closed) { stats.live -= bytes; closed = true; } close(); };
        return result;
      } finally { stats.pending--; }
    };
  });
  let requests = 0;
  await page.route('**/sequences/**/frame-*.webp', route => {
    requests++;
    // Cap production baseline sampling to avoid intentionally exhausting RAM.
    return baseline && requests > 20 ? route.abort() : route.continue();
  });
  await page.goto(base, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  const initial = await page.evaluate(() => window.frameStats);
  if (baseline) {
    console.log(JSON.stringify({ mode: 'production baseline (20 frames maximum)', requests, ...initial }));
  } else {
    assert.equal(await page.locator('canvas[data-sequence="visionary"]').getAttribute('data-painted'), 'true');
    for (const fraction of [0.5, 0.1, 0.9, 0.25, 0.75, 0, 1, 0]) {
      await page.evaluate(f => {
        const y = (document.documentElement.scrollHeight - innerHeight) * f;
        if (window.__lenis) window.__lenis.scrollTo(y, { immediate: true, force: true }); else scrollTo(0, y);
      }, fraction);
      await page.waitForTimeout(400);
    }
    await page.setViewportSize({ width: 844, height: 390 });
    await page.waitForTimeout(800);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(800);
    const stats = await page.evaluate(() => window.frameStats);
    assert.ok(stats.peak <= 48 * 1024 * 1024);
    assert.ok(stats.peakPending <= 2);
    await page.evaluate(() => {
      Object.defineProperty(document, 'hidden', { configurable: true, value: true });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await page.waitForTimeout(500);
    assert.equal((await page.evaluate(() => window.frameStats)).live, 0);
    await page.evaluate(() => {
      delete document.hidden;
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await page.waitForTimeout(500);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.waitForTimeout(500);
    assert.equal((await page.evaluate(() => window.frameStats)).live, 0);
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.waitForTimeout(700);
    assert.ok((await page.evaluate(() => window.frameStats)).live > 0);
    console.log(JSON.stringify({ mode: 'fixed mobile WebKit', requests, initial, ...stats }));
    await page.screenshot({ path: 'verify-output/mobile-memory.png' });
    await page.route('**/manifest.json', route => route.abort());
    await page.reload({ waitUntil: 'networkidle' });
    assert.equal(await page.locator('canvas[data-sequence="visionary"]').getAttribute('data-painted'), 'false');
    assert.ok(await page.locator('img[src="/sequences/visionary/poster.webp"]').evaluate(image => image.complete && image.naturalWidth > 0));
    console.log('PASS manifest failure poster fallback');
  }
} finally { await browser.close(); }
