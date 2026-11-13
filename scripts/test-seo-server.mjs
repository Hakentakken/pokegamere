import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createServer } from 'vite';
try { process.loadEnvFile('.env'); } catch { /* CI */ }
const vite = await createServer({ server: { middlewareMode: true, hmr: false }, logLevel: 'error' });
try {
  const { fetchCatalogue } = await vite.ssrLoadModule('/server/catalogue.ts');
  const { buildSlugIndex } = await vite.ssrLoadModule('/src/lib/slug.ts');
  const { render } = await import('../server-dist/entry-server.js');
  const rows = await fetchCatalogue();
  assert(rows.length > 0);
  const index = buildSlugIndex(rows.map(row => ({ ...row, createdAt: row.created_at })));
  for (const h of rows) {
    const canonical = `/hacks/${index.get(h.id)}`;
    const result = render(canonical, rows);
    assert.equal(result.status, 200, canonical);
    assert.match(result.head, /name="robots" content="index, follow"/);
    assert(result.head.includes(`href="https://www.pokesmith.com${canonical}"`));
    assert.match(result.html, /<h1/);
    assert(result.html.indexOf('id="screenshots"') < result.html.indexOf('id="downloads"'));
    assert(!result.html.includes('href="/patcher"'));
    const data = result.head.match(/type="application\/ld\+json">([\s\S]*?)<\/script>/);
    assert(data && JSON.parse(data[1])['@type'] === 'VideoGame');
    assert.deepEqual(render(`/hack/${h.id}`, rows), { status: 301, location: canonical });
  }
  const missing = render('/hacks/this-game-does-not-exist', rows);
  assert.equal(missing.status, 404);
  assert.match(missing.head, /noindex/);
  assert.equal(render('/not-a-page', rows).status, 404);
  for (const route of ['/', '/hacks', '/about', '/privacy', '/terms', '/contact', '/editorial', '/guides', '/qa']) {
    const result = render(route, rows);
    assert.equal(result.status, 200, route);
    assert(!result.html.includes('href="/patcher"'), route);
    if (route === '/hacks') for (const slug of index.values()) assert(result.html.includes(`href="/hacks/${slug}"`), slug);
  }
  const unsafe = [{ ...rows[0], title: '<script>alert(1)</script>', description: '</script><script>alert(1)</script>' }];
  const unsafeSlug = buildSlugIndex(unsafe.map(row => ({ ...row, createdAt: row.created_at }))).get(rows[0].id);
  const escaped = render(`/hacks/${unsafeSlug}`, unsafe);
  assert(!escaped.data.includes('</script>'));
  assert(!escaped.html.includes('<script>alert(1)'));
  assert(!escaped.head.includes('<script>alert(1)'));
  const config = JSON.parse(readFileSync('vercel.json', 'utf8'));
  assert.equal(config.rewrites[0].destination, '/api/sitemap-hacks');
  // Production already redirects the apex domain to www in Vercel Domains.
  // A repository rule redirecting www back to apex caused an HTTP 307/308 loop.
  for (const rule of config.redirects || []) {
    const targetsApex = /^https:\/\/pokesmith\.com(?:\/|$)/.test(rule.destination);
    assert(!targetsApex, 'Do not redirect to apex: the hosting domain redirects apex back to www');
  }
  console.log(`PASS: ${rows.length} server-rendered games, canonical redirects, catalogue links, metadata, screenshots before downloads, 404s and injection escaping.`);
} finally { await vite.close(); }
