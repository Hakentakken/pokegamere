import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createServer } from 'vite';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
try { process.loadEnvFile('.env'); } catch { /* CI */ }
const vite = await createServer({ server: { middlewareMode: true, hmr: false }, ssr: { external: ['react', 'react/jsx-runtime'] }, logLevel: 'error' });
try {
  const { fetchCatalogue } = await vite.ssrLoadModule('/server/catalogue.ts');
  const { buildSlugIndex, findIdBySlug, LEGACY_HACK_SLUGS } = await vite.ssrLoadModule('/src/lib/slug.ts');
  const { gameMetadata } = await vite.ssrLoadModule('/src/lib/gameMetadata.ts');
  const { render } = await import('../server-dist/entry-server.js');
  const rows = await fetchCatalogue();
  assert(rows.length > 0);
  const metadata = gameMetadata({ ...rows[0], title: 'Example Adventure', platform: 'GBA / ROM Hack', cover_image: 'javascript:alert(1)', download_link: '' }, 'example-adventure');
  assert.equal(metadata.title, 'Example Adventure (GBA) — Game Details');
  assert.equal(metadata.image, undefined, 'Unsafe image schemes are excluded from metadata');
  assert(!gameMetadata({ ...rows[0], title: 'Example GBA', platform: 'GBA' }, 'example-gba').title.includes('(GBA)'), 'Do not repeat a platform already in the title');
  assert(!gameMetadata({ ...rows[0], title: 'Example PC Game', platform: 'RPGXP' }, 'example-pc').title.includes('GBA'), 'Do not mislabel standalone games');
  const index = buildSlugIndex(rows.map(row => ({ ...row, createdAt: row.created_at })));
  for (const h of rows) {
    const canonical = `/hacks/${index.get(h.id)}`;
    const result = render(canonical, rows);
    assert.equal(result.status, 200, canonical);
    assert.match(result.head, /name="robots" content="index, follow"/);
    assert(result.head.includes(`href="https://www.pokesmith.com${canonical}"`));
    const heading = result.html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/);
    const escapedTitle = renderToStaticMarkup(createElement('span', null, h.title)).slice(6, -7);
    assert.equal(heading?.[1], escapedTitle, 'Full title must render as visible text, without hidden word masks: ' + h.title);
    assert(result.html.indexOf('id="screenshots"') < result.html.indexOf('id="downloads"'));
    assert(!result.html.includes('href="/patcher"'));
    const data = result.head.match(/type="application\/ld\+json">([\s\S]*?)<\/script>/);
    assert(data);
    const structured = JSON.parse(data[1]);
    const game = structured.find(item => item['@type'] === 'VideoGame');
    const breadcrumb = structured.find(item => item['@type'] === 'BreadcrumbList');
    assert.equal(game.name, h.title);
    assert.equal(game.description, h.description, 'Structured data uses the reviewed description');
    assert.equal(game.url, 'https://www.pokesmith.com' + canonical);
    assert.deepEqual(breadcrumb.itemListElement.map(item => item.position), [1, 2, 3]);
    assert.equal(breadcrumb.itemListElement[2].item, game.url);
    assert.equal(breadcrumb.itemListElement[2].name, h.title);
    assert(result.html.includes('aria-label="Breadcrumb"'));
    if (game.image) {
      assert(result.head.includes('property="og:image"'));
      assert(result.head.includes('name="twitter:image"'));
    }
    const escapedDescription = renderToStaticMarkup(createElement('span', null, h.description)).slice(6, -7);
    assert(result.html.includes(escapedDescription), 'Visible page includes the full reviewed description: ' + h.title);
    assert.deepEqual(render(`/hack/${h.id}`, rows), { status: 301, location: canonical });
  }
  for (const [oldSlug, id] of Object.entries(LEGACY_HACK_SLUGS)) {
    assert(index.has(id), 'Verified alias target must still exist: ' + oldSlug);
    assert.deepEqual(render('/hacks/' + oldSlug, rows), { status: 301, location: '/hacks/' + index.get(id) });
    // Redirects follow the record even after another title edit.
    const renamed = [{ id, title: 'Renamed game', createdAt: '2026-01-01' }];
    assert.equal(findIdBySlug(buildSlugIndex(renamed), renamed, oldSlug), id);
    assert.equal(findIdBySlug(new Map(), [], oldSlug), null, 'Removed alias targets stay missing');
  }
  for (const removed of ['pokemon-unbound-v2-1-1-1', 'pokemon-heartgold-retiled-expansion-v6-12-1']) {
    assert.equal(render('/hacks/' + removed, rows).status, 404, 'Intentionally removed games stay removed');
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
  const emulatorGuide = render('/emulators', null);
  assert(emulatorGuide.html.includes('Choose by game format first'));
  assert(emulatorGuide.html.includes('https://mgba.io/'));
  assert(!emulatorGuide.html.includes('Coming Soon'));
  assert(render('/cheats', null).html.includes('Check compatibility before enabling a code'));
  assert.equal(config.routes[0].dest, '/api/sitemap-hacks');
  // Production already redirects the apex domain to www in Vercel Domains.
  // A repository rule redirecting www back to apex caused an HTTP 307/308 loop.
  for (const rule of config.redirects || []) {
    const targetsApex = /^https:\/\/pokesmith\.com(?:\/|$)/.test(rule.destination);
    assert(!targetsApex, 'Do not redirect to apex: the hosting domain redirects apex back to www');
  }
  console.log(`PASS: ${rows.length} server-rendered games, canonical redirects, catalogue links, metadata, screenshots before downloads, 404s and injection escaping.`);
} finally { await vite.close(); }
