// Read-only Google index audit. Inspection does NOT request indexing.
// Kept local: never ship OAuth credentials to the browser or a public API.
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

export async function auditIndexing(accessToken, site, {
  fetchImpl = fetch,
  outputPath = 'reports.local/indexing-audit.json',
  log = console.log,
} = {}) {
  const origin = 'https://www.pokesmith.com';
  const maps = ['/sitemap-hacks.xml', '/sitemap.xml'];
  const entries = new Map();
  for (const pathname of maps) {
    const response = await fetchImpl(origin + pathname, { signal: AbortSignal.timeout(30000) });
    if (!response.ok) throw Error(`Sitemap ${pathname}: HTTP ${response.status}`);
    const xml = await response.text();
    if (!xml.includes('<urlset')) throw Error(`Invalid sitemap: ${pathname}`);
    const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1]);
    if (!urls.length) throw Error(`Empty sitemap: ${pathname}`);
    for (const url of urls) {
      const parsed = new URL(url);
      if (parsed.origin !== origin || parsed.search || parsed.hash) throw Error(`Unexpected canonical URL: ${url}`);
      entries.set(url, { url, currentSitemap: origin + pathname, kind: parsed.pathname.startsWith('/hacks/') ? 'game' : 'page' });
    }
  }

  const catalogue = await fetchImpl(origin + '/hacks', { signal: AbortSignal.timeout(30000) });
  if (!catalogue.ok) throw Error(`Catalogue: HTTP ${catalogue.status}`);
  const html = await catalogue.text();
  const urls = [...entries.values()];
  const results = new Array(urls.length);
  let next = 0;
  let completed = 0;
  let stop = false;
  // Limit concurrent inspections. Abort remaining work on auth/quota failure
  // instead of sending repeated requests.
  await Promise.all(Array.from({ length: 3 }, async () => {
    while (!stop && next < urls.length) {
      const index = next++;
      const entry = urls[index];
      try {
        const response = await fetchImpl('https://searchconsole.googleapis.com/v1/urlInspection/index:inspect', {
          method: 'POST',
          headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ inspectionUrl: entry.url, siteUrl: site, languageCode: 'en-US' }),
          signal: AbortSignal.timeout(30000),
        });
        if (!response.ok) {
          if ([401, 403, 429].includes(response.status)) stop = true;
          throw Error(`Inspection HTTP ${response.status}`);
        }
        const { inspectionResult } = await response.json();
        if (!inspectionResult?.indexStatusResult) throw Error('Missing index inspection result');
        const status = inspectionResult.indexStatusResult;
        results[index] = {
          ...entry,
          linkedFromCatalogue: entry.kind === 'game' ? html.includes(`href="${new URL(entry.url).pathname}"`) : null,
          verdict: status.verdict,
          coverageState: status.coverageState,
          lastCrawlTime: status.lastCrawlTime || null,
          pageFetchState: status.pageFetchState,
          indexingState: status.indexingState,
          googleCanonical: status.googleCanonical || null,
          userCanonical: status.userCanonical || null,
          recordedSitemaps: status.sitemap || [],
          inspectionLink: inspectionResult.inspectionResultLink,
        };
      } catch (error) {
        results[index] = { ...entry, error: error.message };
      }
      completed++;
      if (completed % 10 === 0 || completed === urls.length) log(`Inspected ${completed}/${urls.length}`);
    }
  }));
  for (let index = 0; index < urls.length; index++) {
    results[index] ||= { ...urls[index], error: 'Not inspected: stopped after authentication or quota error' };
  }
  const summarize = rows => ({
    total: rows.length,
    indexed: rows.filter(row => row.verdict === 'PASS').length,
    inspectionErrors: rows.filter(row => row.error).length,
    coverage: rows.reduce((counts, row) => {
      const key = row.error ? 'Inspection error' : row.coverageState;
      counts[key] = (counts[key] || 0) + 1;
      return counts;
    }, {}),
  });
  const report = {
    checkedAt: new Date().toISOString(), site,
    note: 'Read-only historical index inspection, not a live Google crawl or indexing request. Sitemap presence is checked separately from Google’s recorded sitemap associations.',
    summary: { games: summarize(results.filter(row => row.kind === 'game')), pages: summarize(results.filter(row => row.kind === 'page')) },
    results,
  };
  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, JSON.stringify(report, null, 2) + '\n');
  log(JSON.stringify({ ...report.summary, report: outputPath }, null, 2));
  if (results.some(row => row.error)) throw Error(`Some inspections failed; see ${outputPath}. Successful results were preserved.`);
  return report;
}
