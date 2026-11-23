import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';

const live = process.argv.includes('--live');
if (live) { try { process.loadEnvFile('.env'); } catch { /* CI supplies env. */ } }
const vite = await createServer({
  server: { middlewareMode: true, hmr: false }, logLevel: 'error',
  ssr: { external: ['react', 'react/jsx-runtime'] },
});
const originalFetch = globalThis.fetch;
try {
  const { catalogueDescriptionRevisions: revisions } = await vite.ssrLoadModule('/src/data/catalogueDescriptions.ts');
  const { withReviewedContent } = await vite.ssrLoadModule('/src/lib/catalogueContent.ts');
  const { default: ReviewQueue } = await vite.ssrLoadModule('/src/components/ContentReviewQueue.tsx');
  const { fetchCatalogue } = await vite.ssrLoadModule('/server/catalogue.ts');
  const queue = entries => renderToStaticMarkup(createElement(ReviewQueue, { entries, onEdit() {} }));
  const words = text => text.trim().split(/\s+/).filter(Boolean).length;
  assert.equal(revisions.length, 53);
  assert.equal(new Set(revisions.map(row => row.id)).size, 53);
  assert.equal(new Set(revisions.map(row => row.description.trim().toLowerCase().replace(/\s+/g, ' '))).size, 53);
  const originals = revisions.map(revision => {
    assert(words(revision.description) >= 100, revision.title);
    assert(words(revision.previousDescription) < 100, revision.title);
    assert(revision.sources.length > 0, revision.title);
    for (const source of revision.sources) assert.equal(new URL(source).protocol, 'https:');
    assert(!revision.description.includes('\uFFFD'), 'No replacement characters');
    return Object.freeze({
      id: revision.id, title: revision.title, description: revision.previousDescription,
      status: revision.previousStatus || 'completed', author: 'Creator', platform: 'GBA',
      cover_image: 'https://example.test/cover.png', screenshots: ['https://example.test/screen.png'],
      download_link: 'https://drive.google.com/file/d/preserved/view',
      features: ['Original feature'], rating: 4.5, created_at: '2026-01-01T00:00:00Z',
      additional_metadata: { preserve: true },
    });
  });
  const reviewed = originals.map(withReviewedContent);
  assert.match(queue(originals), /53 listings to review/);
  assert.match(queue(reviewed), /0 listings to review/);
  for (let i = 0; i < revisions.length; i++) {
    const before = originals[i], after = reviewed[i], revision = revisions[i];
    assert.equal(after.description, revision.description);
    assert.equal(after.status, revision.status || before.status);
    for (const key of Object.keys(before).filter(key => !['description', 'status'].includes(key))) {
      assert.strictEqual(after[key], before[key], `${revision.title}: preserve ${key}`);
    }
    assert.strictEqual(withReviewedContent(after), after, 'Idempotent');
    for (const newer of [
      { ...before, description: 'Newer admin-authored description' },
      { ...before, title: 'Renamed by an editor' },
      { ...before, id: 'unrelated-row' },
      { id: before.id, title: before.title },
    ]) assert.strictEqual(withReviewedContent(newer), newer, 'Respect subsequent edits and partial projections');
    assert.equal(withReviewedContent({ ...before, status: 'upcoming' }).status, 'upcoming', 'Preserve a newer status');
  }
  assert.equal(revisions.filter(row => row.status).length, 2);

  if (live) {
    const origin = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const key = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
    assert(origin && key, 'Public Supabase configuration required for --live');
    const raw = [];
    for (let offset = 0; ; offset += 500) {
      const url = new URL('/rest/v1/hacks', origin);
      url.search = new URLSearchParams({ select: '*', order: 'created_at.asc,id.asc', offset: String(offset), limit: '500' });
      const response = await fetch(url, { headers: { apikey: key, Authorization: `Bearer ${key}` } });
      assert(response.ok, `Public catalogue HTTP ${response.status}`);
      const batch = await response.json(); raw.push(...batch);
      if (batch.length < 500) break;
    }
    const result = raw.map(withReviewedContent);
    let changed = 0;
    for (let i = 0; i < raw.length; i++) {
      if (raw[i].description !== result[i].description) changed++;
      for (const key of Object.keys(raw[i]).filter(key => !['description', 'status'].includes(key))) {
        assert.deepEqual(result[i][key], raw[i][key], `${raw[i].title}: preserve ${key}`);
      }
    }
    assert.match(queue(result), /0 listings to review/, 'Real catalogue must clear unchanged review rules');
    const served = await fetchCatalogue();
    assert.equal(served.length, raw.length);
    for (const row of served) {
      const expected = result.find(item => item.id === row.id);
      assert.equal(row.description, expected.description, 'Server/client copy matches');
      assert.equal(row.status, expected.status, 'Server/client status matches');
    }
    console.log(`PASS live read-only audit: ${raw.length} listings, ${changed} descriptions revised, zero review flags; all other fields preserved except the two documented status corrections.`);
  } else {
    process.env.SUPABASE_URL = 'https://example.invalid';
    process.env.SUPABASE_ANON_KEY = 'test-public-key';
    globalThis.fetch = async () => new Response(JSON.stringify(originals));
    assert.deepEqual(await fetchCatalogue(), reviewed, 'Server catalogue applies the same content');
  }
  console.log('PASS: 53 unique researched descriptions, actual admin review rules, media/link preservation, subsequent editor changes, partial projections and server integration.');
} finally {
  globalThis.fetch = originalFetch;
  await vite.close();
}
