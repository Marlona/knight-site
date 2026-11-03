import assert from 'node:assert/strict';
export async function run({ SequenceLoader, sequenceMemoryStats, FRAME_BUDGET }) {
  const originalFetch = globalThis.fetch;
  const originalDecode = globalThis.createImageBitmap;
  let alive = 0, peak = 0, requests = 0, failed = false;
  let pendingDecode;
  const wait = () => new Promise(resolve => setTimeout(resolve, 5));
  const bitmap = options => {
    alive++;
    let closed = false;
    return { width: options.resizeWidth, height: options.resizeHeight, close() { assert.equal(closed, false); closed = true; alive--; } };
  };
  globalThis.fetch = async () => { requests++; return { ok: !failed, blob: async () => new Blob() }; };
  globalThis.createImageBitmap = async (_, options) => {
    peak = Math.max(peak, sequenceMemoryStats().bytes);
    assert.ok(sequenceMemoryStats().jobs <= 2);
    assert.ok(sequenceMemoryStats().bytes <= FRAME_BUDGET);
    if (pendingDecode) await pendingDecode;
    return bitmap(options);
  };
  const manifest = { frameCount: 97, variants: { mobile: { width: 900, height: 1600, frameCount: 193, path: 'mobile/frame-{i}.webp' } } };
  const loaders = Array.from({ length: 4 }, () => new SequenceLoader('test', manifest, 'mobile'));
  try {
    for (const loader of loaders) loader.start();
    await wait();
    assert.ok(requests < 20, 'must not fetch all frames');
    assert.ok(alive > 0);
    for (const progress of [1, 0, .8, .1, .5, 1]) {
      for (const loader of loaders) loader.setProgress(progress);
      await wait();
      assert.ok(sequenceMemoryStats().bytes <= FRAME_BUDGET);
      assert.ok(loaders.every(loader => loader.nearest(progress * 192)), 'each visible section keeps a frame');
    }
    assert.ok(peak > 0);
    for (const loader of loaders) loader.pause();
    await wait();
    assert.equal(alive, 0);
    assert.equal(sequenceMemoryStats().bytes, 0);

    let release;
    pendingDecode = new Promise(resolve => { release = resolve; });
    loaders[0].start();
    await wait();
    loaders[0].pause();
    assert.ok(sequenceMemoryStats().bytes > 0, 'in-flight decodes remain reserved after pause');
    loaders[0].dispose();
    release();
    await wait();
    assert.equal(alive, 0, 'late decoded results must be closed');
    assert.equal(sequenceMemoryStats().bytes, 0);
    assert.equal(sequenceMemoryStats().jobs, 0);
    pendingDecode = null;

    failed = true;
    const before = requests;
    loaders[1].start();
    await wait(); await wait();
    assert.ok(requests - before <= 3, 'failed frames must not retry in a loop');
    assert.equal(sequenceMemoryStats().bytes, 0);
    console.log(`  decoded-frame peak: ${(peak / 1024 / 1024).toFixed(2)} MiB / 48 MiB; late decode cleanup verified`);
  } finally {
    loaders.forEach(loader => loader.dispose());
    globalThis.fetch = originalFetch;
    globalThis.createImageBitmap = originalDecode;
  }
}
