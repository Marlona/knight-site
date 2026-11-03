import assert from 'node:assert/strict';
export async function run({ withMaintenance }) {
  const request = (path = '/', method = 'GET', extra = {}) => new Request('https://example.com' + path, { method, headers: { accept: 'text/html', ...extra } });
  const fail = async () => { throw new Error('simulated failure'); };
  for (const next of [fail, async () => new Response('bad', { status: 500 })]) {
    const response = await withMaintenance(request(), false, next);
    assert.equal(response.status, 503);
    assert.equal(response.headers.get('cache-control'), 'no-store, max-age=0');
    assert.equal(response.headers.get('retry-after'), '300');
    const html = await response.text();
    assert.ok(html.includes('We’re making room'));
    assert.ok(!html.includes('<script'));
    assert.ok(html.includes('mailto:hello@knightandember.com'));
  }
  assert.equal((await withMaintenance(request(), true, fail)).status, 503);
  assert.equal(await (await withMaintenance(request('/', 'HEAD'), true, fail)).text(), '');
  for (const req of [request('/api/inquiry'), request('/_next/test'), request('/', 'POST'), request('/', 'GET', { rsc: '1' })]) {
    assert.equal((await withMaintenance(req, true, async () => new Response('original', { status: 500 }))).status, 500);
    await assert.rejects(withMaintenance(req, false, fail));
  }
  for (const status of [200, 404, 302]) {
    const response = new Response('unchanged', { status });
    assert.equal(await withMaintenance(request(), false, async () => response), response);
  }
}
