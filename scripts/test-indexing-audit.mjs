import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { auditIndexing } from './audit-indexing.mjs';

const temporary = await mkdtemp(path.join(tmpdir(), 'pokesmith-index-audit-'));
const outputPath = path.join(temporary, 'report.json');
const origin = 'https://www.pokesmith.com';
const calls = [];
let failInspection = false;
let badSitemap = false;
const response = (status, body) => ({ ok: status === 200, status, text: async () => body, json: async () => body });
const fetchImpl = async (url, options) => {
  calls.push({ url, options });
  if (url.endsWith('/sitemap-hacks.xml')) {
    if (badSitemap) return response(200, '<html>Unavailable</html>');
    return response(200, `<urlset><url><loc>${origin}/hacks/one</loc></url><url><loc>${origin}/hacks/two</loc></url></urlset>`);
  }
  if (url.endsWith('/sitemap.xml')) return response(200, `<urlset><url><loc>${origin}/</loc></url></urlset>`);
  if (url.endsWith('/hacks')) return response(200, '<a href="/hacks/one">One</a>');
  assert.equal(url, 'https://searchconsole.googleapis.com/v1/urlInspection/index:inspect');
  const { inspectionUrl } = JSON.parse(options.body);
  if (failInspection) return response(429, {});
  return response(200, { inspectionResult: { indexStatusResult: {
    verdict: inspectionUrl.endsWith('/two') ? 'NEUTRAL' : 'PASS',
    coverageState: inspectionUrl.endsWith('/two') ? 'URL is unknown to Google' : 'Submitted and indexed',
    // Indexed URLs can have no recorded sitemap association.
  } } });
};
try {
  const report = await auditIndexing('test-token', 'sc-domain:pokesmith.com', { fetchImpl, outputPath, log: () => {} });
  assert.equal(report.summary.games.total, 2);
  assert.equal(report.summary.games.indexed, 1);
  assert.equal(report.summary.pages.indexed, 1);
  assert.equal(report.results[0].linkedFromCatalogue, true);
  assert.equal(report.results[1].linkedFromCatalogue, false);
  assert.deepEqual(report.results[0].recordedSitemaps, []);
  assert(report.results[0].currentSitemap.endsWith('/sitemap-hacks.xml'));
  const json = await readFile(outputPath, 'utf8');
  assert(!json.includes('test-token'));
  assert(calls.filter(call => call.options?.headers?.Authorization).every(call => call.url.startsWith('https://searchconsole.googleapis.com/')));
  failInspection = true;
  await assert.rejects(auditIndexing('test-token', 'sc-domain:pokesmith.com', { fetchImpl, outputPath, log: () => {} }), /Some inspections failed/);
  const errors = JSON.parse(await readFile(outputPath, 'utf8'));
  assert.equal(errors.summary.games.inspectionErrors, 2);
  assert(!('URL is unknown to Google' in errors.summary.games.coverage));
  badSitemap = true;
  await assert.rejects(auditIndexing('test-token', 'sc-domain:pokesmith.com', { fetchImpl, outputPath, log: () => {} }), /Invalid sitemap/);
  console.log('PASS: audit separates indexing, sitemap membership and discovery links; preserves inspection errors; keeps credentials out of reports.');
} finally {
  assert(path.dirname(temporary) === path.resolve(tmpdir()) && path.basename(temporary).startsWith('pokesmith-index-audit-'));
  await rm(temporary, { recursive: true, force: true });
}
