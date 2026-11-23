import assert from 'node:assert/strict';
import { catalogueModuleUrl } from './lib/catalogue-test-module.mjs';
const { fetchCatalogue } = await import(catalogueModuleUrl);
process.env.SUPABASE_URL = 'https://example.invalid';
process.env.SUPABASE_ANON_KEY = 'test-public-key';
const game = { id: 'one', title: 'Test' };
const ok = rows => new Response(JSON.stringify(rows));
let calls = 0;
for (const failure of [() => new Response('', { status: 503 }), () => { throw new TypeError('fetch failed'); }, () => { throw new DOMException('timeout', 'TimeoutError'); }]) {
  calls = 0;
  globalThis.fetch = async () => ++calls === 1 ? failure() : ok([game]);
  assert.deepEqual(await fetchCatalogue(), [game]);
  assert.equal(calls, 2);
}
calls = 0;
globalThis.fetch = async () => ++calls === 1 ? { ok: true, json: async () => { throw new TypeError('Body stream interrupted'); } } : ok([game]);
assert.deepEqual(await fetchCatalogue(), [game]);
assert.equal(calls, 2);
for (const status of [400, 401, 403, 404]) {
  calls = 0;
  globalThis.fetch = async () => { calls++; return new Response('', { status }); };
  await assert.rejects(fetchCatalogue(), new RegExp(String(status)));
  assert.equal(calls, 1);
}
calls = 0;
globalThis.fetch = async () => { calls++; return new Response('', { status: 429, headers: { 'Retry-After': '60' } }); };
await assert.rejects(fetchCatalogue(), /backoff/);
assert.equal(calls, 1);
calls = 0;
globalThis.fetch = async () => { calls++; return new Response('', { status: 502 }); };
await assert.rejects(fetchCatalogue(), /502/);
assert.equal(calls, 2, 'Persistent outages have bounded retries');
// A failed second page must never return the successful first page as a complete catalogue.
globalThis.fetch = async url => Number(url.searchParams.get('offset')) === 0 ? ok(Array(500).fill(game)) : new Response('', { status: 503 });
await assert.rejects(fetchCatalogue(), /503/);
calls = 0;
let release;
globalThis.fetch = () => { calls++; return new Promise(resolve => { release = () => resolve(ok([game])); }); };
const concurrent = Array.from({ length: 20 }, () => fetchCatalogue());
assert.equal(calls, 1);
release();
assert((await Promise.all(concurrent)).every(rows => rows[0].id === 'one'));
globalThis.fetch = async () => ok([{ id: 'new' }]);
assert.equal((await fetchCatalogue())[0].id, 'new', 'Settled responses must not hide newly published records');
// Slow upstreams obey cancellation; retry plus timeout stays within the total budget.
calls = 0;
globalThis.fetch = async (_url, { signal }) => {
  calls++;
  return new Promise((_resolve, reject) => signal.addEventListener('abort', () => reject(signal.reason), { once: true }));
};
const start = Date.now();
const keepAlive = setInterval(() => {}, 1000);
try { await assert.rejects(fetchCatalogue(), /timeout/i); }
finally { clearInterval(keepAlive); }
assert.equal(calls, 2);
assert(Date.now() - start < 8500);
console.log('PASS: transient recovery, permanent failures, backoff, bounded outages, complete pagination, concurrent sharing, fresh updates and timeout budget.');
