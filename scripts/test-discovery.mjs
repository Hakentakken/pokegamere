import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';

const sandbox = await mkdtemp(path.join(tmpdir(), 'pokesmith-discovery-'));
const savedFetch = globalThis.fetch;
const savedEnv = { ...process.env };
try {
  await writeFile(path.join(sandbox, 'package.json'), '{"type":"module"}');
  for (const source of ['src/lib/slug.ts', 'src/lib/notifyDiscovery.ts', 'src/data/catalogueDescriptions.ts', 'src/lib/catalogueContent.ts', 'server/catalogue.ts', 'server/discovery.ts', 'api/feed.ts', 'api/notify-discovery.ts']) {
    const target = path.join(sandbox, source.replace(/\.ts$/, '.js'));
    await mkdir(path.dirname(target), { recursive: true });
    const { outputText } = ts.transpileModule(await readFile(source, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
    });
    await writeFile(target, outputText);
  }
  const load = source => import(pathToFileURL(path.join(sandbox, source)).href);
  const { default: feed } = await load('api/feed.js');
  const { default: notify } = await load('api/notify-discovery.js');
  const { notifyDiscovery } = await load('src/lib/notifyDiscovery.js');
  process.env.SUPABASE_URL = 'https://example.invalid';
  process.env.SUPABASE_ANON_KEY = 'public-key';
  const response = () => ({
    statusCode: 200, headers: {}, body: '',
    setHeader(k, v) { this.headers[k] = v; },
    writeHead(status, headers) { this.statusCode = status; Object.assign(this.headers, headers); },
    end(body) { this.body = body || ''; },
  });
  const calls = [];
  let rows = Array.from({ length: 1001 }, (_, i) => ({
    id: String(i).padStart(8, '0'), title: i < 2 ? 'Pokémon & Test' : `Game ${i}`,
    description: 'Description with <markup> & "quotes"\u0001',
    created_at: i === 2 ? null : '2026-01-01T00:00:00Z',
  }));
  let authStatus = 200, hubStatus = 204, dbStatus = 200;
  globalThis.fetch = async (input, options = {}) => {
    const url = new URL(input); calls.push({ url: url.href, options });
    if (url.hostname === 'example.invalid' && url.pathname === '/auth/v1/user') {
      assert.equal(options.headers.Authorization, 'Bearer user-token');
      return new Response(JSON.stringify({ id: 'editor' }), { status: authStatus });
    }
    if (url.hostname === 'example.invalid') {
      assert.equal(options.headers.Authorization, 'Bearer public-key', 'Feed reads use public RLS, not user credentials');
      assert.equal(url.searchParams.get('select'), 'id,title,description,created_at');
      const offset = Number(url.searchParams.get('offset'));
      return new Response(JSON.stringify(rows.slice(offset, offset + 500)), { status: dbStatus });
    }
    assert.equal(url.href, 'https://pubsubhubbub.appspot.com/');
    assert.equal(options.headers.Authorization, undefined, 'Never forward Supabase credentials to the hub');
    assert.equal(options.method, 'POST');
    assert.equal(options.body.get('hub.mode'), 'publish');
    assert.equal(options.body.get('hub.url'), 'https://www.pokesmith.com/feed.xml');
    return new Response(null, { status: hubStatus });
  };
  const initial = response(); await feed({ method: 'GET' }, initial);
  assert.equal(initial.statusCode, 200);
  assert.equal(initial.headers['Cache-Control'], 'no-store');
  assert.match(initial.headers.Link, /rel="hub"/);
  assert.equal([...initial.body.matchAll(/<item>/g)].length, 1001);
  assert(initial.body.includes('/hacks/pokemon-test</link>'));
  assert(initial.body.includes('/hacks/pokemon-test-00000001</link>'));
  assert(initial.body.includes('Pokémon &amp; Test'));
  assert(initial.body.includes('&lt;markup&gt; &amp; &quot;quotes&quot;'));
  assert(!initial.body.includes('\u0001'));
  assert(!initial.body.includes('Invalid Date'));
  assert.equal([...initial.body.matchAll(/<pubDate>/g)].length, 1000);
  assert.deepEqual(calls.map(call => new URL(call.url).searchParams.get('offset')), ['0', '500', '1000']);
  rows = [...rows, { id: 'new-game', title: 'New Game', description: 'Newly published', created_at: '2026-11-18T00:00:00Z' }];
  const updated = response(); await feed({ method: 'GET' }, updated);
  assert(updated.body.includes('/hacks/new-game'));
  assert(!initial.body.includes('/hacks/new-game'));
  const head = response(); await feed({ method: 'HEAD' }, head);
  assert.equal(head.body, '');
  const wrongMethod = response(); await feed({ method: 'POST' }, wrongMethod);
  assert.equal(wrongMethod.statusCode, 405);
  calls.length = 0;
  for (const req of [{ method: 'GET', headers: {} }, { method: 'POST', headers: {} }]) {
    const result = response(); await notify(req, result);
    assert([401, 405].includes(result.statusCode));
  }
  assert.equal(calls.length, 0, 'Reject unauthenticated requests before external calls');
  const req = { method: 'POST', headers: { authorization: 'Bearer user-token' }, body: { url: 'https://attacker.invalid/' } };
  authStatus = 401;
  const denied = response(); await notify(req, denied);
  assert.equal(denied.statusCode, 401);
  assert.equal(calls.filter(call => call.url.includes('pubsubhubbub')).length, 0);
  authStatus = 200;
  const accepted = response(); await notify(req, accepted);
  assert.equal(accepted.statusCode, 202);
  assert.deepEqual(JSON.parse(accepted.body), { notified: true, feedUrl: 'https://www.pokesmith.com/feed.xml' });
  assert(!accepted.body.includes('user-token'));
  hubStatus = 503;
  const failed = response(); await notify(req, failed);
  assert.equal(failed.statusCode, 502);
  assert.match(failed.body, /remains published/);
  dbStatus = 503;
  const unavailable = response(); await feed({ method: 'GET' }, unavailable);
  assert.equal(unavailable.statusCode, 503);
  assert.equal(unavailable.headers['Cache-Control'], 'no-store');
  assert(!unavailable.body.includes('<rss'));

  globalThis.fetch = async (url, options) => {
    assert.equal(url, '/api/notify-discovery');
    assert.equal(options.headers.Authorization, 'Bearer user-token');
    return new Response('{"notified":true}', { status: 202 });
  };
  assert.match(await notifyDiscovery('user-token'), /Google decides/);
  globalThis.fetch = async () => { throw new Error('Offline'); };
  assert.match(await notifyDiscovery('user-token'), /Game saved.*do not need to upload it again/);
  assert.match(await notifyDiscovery(undefined), /Game saved/);
  console.log('PASS: paginated live feed, canonical slugs, XML escaping, no stale cache, verified auth, fixed notification target, failure isolation and client save messaging.');
} finally {
  globalThis.fetch = savedFetch;
  for (const key of ['SUPABASE_URL', 'SUPABASE_ANON_KEY']) {
    if (savedEnv[key] === undefined) delete process.env[key]; else process.env[key] = savedEnv[key];
  }
  assert(path.dirname(sandbox) === path.resolve(tmpdir()) && path.basename(sandbox).startsWith('pokesmith-discovery-'));
  await rm(sandbox, { recursive: true, force: true });
}
