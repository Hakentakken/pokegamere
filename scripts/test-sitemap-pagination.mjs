import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
const code = ts.transpileModule(readFileSync('api/sitemap-hacks.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
const { default: handler } = await import('data:text/javascript;base64,' + Buffer.from(code).toString('base64'));
const original = globalThis.fetch;
const saved = { ...process.env };
process.env.SUPABASE_URL = 'https://example.invalid';
process.env.SUPABASE_ANON_KEY = 'test-public-key';
const offsets = [];
const response = () => ({ headers: {}, statusCode: 0, body: '', setHeader(k, v) { this.headers[k] = v; }, end(value) { this.body = value; } });
try {
  globalThis.fetch = async input => {
    const offset = Number(new URL(input).searchParams.get('offset')); offsets.push(offset);
    return { ok: true, json: async () => Array.from({ length: Math.min(500, 1001 - offset) }, (_, i) => ({ id: `record-${i + offset}`, title: `Game ${i + offset}`, created_at: '2026-01-01T00:00:00Z' })) };
  };
  const res = response(); await handler({}, res);
  assert.equal(res.statusCode, 200);
  assert.deepEqual(offsets, [0, 500, 1000]);
  assert.equal([...res.body.matchAll(/<loc>/g)].length, 1001);
  globalThis.fetch = async () => ({ ok: false, status: 503 });
  const failure = response(); await handler({}, failure);
  assert.equal(failure.statusCode, 500);
  assert.equal(failure.headers['Cache-Control'], 'no-store');
  assert(!failure.body.includes('<urlset'));
  console.log('PASS: sitemap pagination covers 1,001 records; upstream failure is not cached or served as valid XML.');
} finally {
  globalThis.fetch = original;
  for (const name of ['SUPABASE_URL', 'SUPABASE_ANON_KEY']) {
    if (saved[name] === undefined) delete process.env[name]; else process.env[name] = saved[name];
  }
}
