// Exercise the shipped renderer/handlers outside the repository: local
// node_modules must not hide missing production dependencies.
import assert from 'node:assert/strict';
import { cp, mkdtemp, mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import ts from 'typescript';

const root = fileURLToPath(new URL('../', import.meta.url));
const sandbox = await mkdtemp(path.join(tmpdir(), 'pokesmith-deployment-'));
try {
  await cp(path.join(root, 'server-dist'), path.join(sandbox, 'server-dist'), { recursive: true });
  await mkdir(path.join(sandbox, 'dist'));
  await cp(path.join(root, 'dist/index.html'), path.join(sandbox, 'dist/index.html'));
  await writeFile(path.join(sandbox, 'package.json'), '{"type":"module"}');
  for (const source of ['api/page.ts', 'api/sitemap-hacks.ts', 'server/catalogue.ts']) {
    const target = path.join(sandbox, source.replace(/\.ts$/, '.js'));
    await mkdir(path.dirname(target), { recursive: true });
    const { outputText } = ts.transpileModule(await readFile(path.join(root, source), 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
    });
    await writeFile(target, outputText);
  }
  await writeFile(path.join(sandbox, 'verify.mjs'), `
import assert from 'node:assert/strict';
import page from './api/page.js';
import sitemap from './api/sitemap-hacks.js';
process.env.SUPABASE_URL = 'https://example.invalid';
process.env.SUPABASE_ANON_KEY = 'test-public-key';
const game = {
  id: '11111111-1111-4111-8111-111111111111', title: 'Deployment Test Game',
  created_at: '2026-01-01T00:00:00Z', author: 'Test author',
  description: 'A unique adventure used to verify the complete server response.',
  base_game: 'Emerald', platform: 'GBA', status: 'completed', rating: 4,
  cover_image: '', download_link: '', screenshots: [], features: ['A new region'],
};
let rows = [game];
let upstreamFails = false;
globalThis.fetch = async () => ({ ok: !upstreamFails, status: upstreamFails ? 503 : 200, json: async () => rows });
const response = () => ({
  statusCode: 200, headers: {}, body: '',
  writeHead(status, headers) { this.statusCode = status; Object.assign(this.headers, headers); },
  setHeader(key, value) { this.headers[key] = value; },
  end(body) { this.body = body || ''; },
});
async function get(url, method = 'GET') {
  const res = response(); await page({ url, method }, res); return res;
}
for (const url of ['/', '/hacks', '/hacks/deployment-test-game', '/about', '/qa', '/privacy']) {
  const res = await get(url);
  assert.equal(res.statusCode, 200, url + ': ' + res.body);
  assert.match(res.body, /<h1/);
  assert.match(res.body, /name="robots" content="index, follow"/);
  assert.equal([...res.body.matchAll(/rel="canonical"/g)].length, 1);
  assert(!res.body.includes('<div id="root"></div>'));
  assert(res.body.includes('href="https://www.pokesmith.com' + url + '"'));
  if (url.includes('deployment-test-game')) {
    assert(res.body.includes(game.description));
    assert.match(res.body, /"@type":"VideoGame"/);
    assert.match(res.body, /name="robots" content="index, follow"/);
  }
}
const legacy = await get('/hack/' + game.id);
assert.equal(legacy.statusCode, 301);
assert.equal(legacy.headers.Location, '/hacks/deployment-test-game');
const missing = await get('/hacks/not-a-real-game');
assert.equal(missing.statusCode, 404);
assert.match(missing.body, /noindex/);
const head = await get('/hacks/deployment-test-game', 'HEAD');
assert.equal(head.statusCode, 200);
assert.equal(head.body, '');
assert.equal((await get('/hacks', 'POST')).statusCode, 405);
const first = response(); await sitemap({}, first);
assert.equal(first.statusCode, 200);
rows = [...rows, { ...game, id: '22222222-2222-4222-8222-222222222222', title: 'Newly Published Game' }];
const updated = response(); await sitemap({}, updated);
assert(updated.body.includes('/hacks/newly-published-game'));
assert(!first.body.includes('/hacks/newly-published-game'));
upstreamFails = true;
const savedError = console.error; console.error = () => {};
const failure = await get('/hacks/deployment-test-game');
console.error = savedError;
const retired = await get('/patcher');
assert.equal(retired.statusCode, 404, 'Retired patcher must not become a 5xx even during database outages');
assert.match(retired.body, /noindex/);
let attempts = 0;
globalThis.fetch = async () => (++attempts === 1 ? { ok: false, status: 503 } : { ok: true, json: async () => rows });
assert.equal((await get('/hacks')).statusCode, 200, 'The reported catalogue page recovers from a transient database failure');
assert.equal(attempts, 2);
assert.equal(failure.statusCode, 503);
assert.equal(failure.headers['Cache-Control'], 'no-store');
assert.equal((await get('/about')).statusCode, 200, 'Static pages do not depend on database availability');
console.log('PASS: isolated production handlers render HTML without node_modules; metadata, redirects, 404, HEAD, 405, live sitemap updates and upstream failure handling.');
`);
  const result = spawnSync(process.execPath, ['verify.mjs'], {
    cwd: sandbox, encoding: 'utf8', env: { ...process.env, NODE_ENV: 'production', NODE_PATH: '' },
  });
  process.stdout.write(result.stdout || '');
  process.stderr.write(result.stderr || '');
  assert.equal(result.status, 0, 'Isolated production bundle must work without repository node_modules');

  const config = JSON.parse(await readFile(path.join(root, 'vercel.json'), 'utf8'));
  assert(!config.rewrites && !config.headers, 'Do not mix routes with rewrites/headers');
  // Model the filesystem phase with colliding build artifacts present. Both
  // dynamic routes must win before those static files can be served.
  const files = new Set(['/', '/index.html', '/sitemap-hacks.xml', '/robots.txt', '/assets/app.js', '/ads.txt']);
  function resolve(url) {
    for (const route of config.routes) {
      if (route.handle === 'filesystem') {
        if (files.has(url)) return 'static:' + url;
      } else if (new RegExp('^(?:' + route.src + ')$').test(url) && route.dest) {
        return route.dest;
      }
    }
    return null;
  }
  assert.equal(resolve('/'), '/api/page');
  assert.equal(resolve('/sitemap-hacks.xml'), '/api/sitemap-hacks');
  assert.equal(resolve('/feed.xml'), '/api/feed');
  assert.equal(resolve('/hacks/deployment-test-game'), '/api/page');
  assert.equal(resolve('/about'), '/api/page');
  assert.equal(resolve('/robots.txt'), 'static:/robots.txt');
  assert.equal(resolve('/assets/app.js'), 'static:/assets/app.js');
  assert.equal(resolve('/ads.txt'), 'static:/ads.txt');
  assert.equal(resolve('/api/unknown'), null);
  assert.equal(resolve('/assets/missing.js'), null);
  console.log('PASS: homepage and live sitemap take priority over static files; assets and API paths stay separate.');
} finally {
  // mkdtemp creates this dedicated directory; never delete outside it.
  assert(path.dirname(sandbox) === path.resolve(tmpdir()) && path.basename(sandbox).startsWith('pokesmith-deployment-'));
  await rm(sandbox, { recursive: true, force: true });
}
