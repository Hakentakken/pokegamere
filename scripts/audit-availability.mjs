import { mkdir, writeFile } from 'node:fs/promises';
const origin = 'https://www.pokesmith.com';
const results = [];
const urls = new Set();
for (const path of ['/sitemap.xml', '/sitemap-hacks.xml']) {
  const r = await fetch(origin + path, { signal: AbortSignal.timeout(20000) });
  if (!r.ok) throw Error(`${path}: HTTP ${r.status}`);
  const xml = await r.text();
  for (const [, url] of xml.matchAll(/<loc>([^<]+)<\/loc>/g)) {
    if (new URL(url).origin !== origin) throw Error('Unexpected sitemap origin');
    urls.add(url);
  }
}
const queue = [...urls];
await Promise.all(Array.from({ length: 3 }, async () => {
  while (queue.length) {
    const url = queue.shift(); const start = Date.now();
    try {
      const r = await fetch(url, { headers: { 'User-Agent': 'PokeSmith-Availability-Audit/1.0' }, signal: AbortSignal.timeout(20000) });
      const html = await r.text();
      const canonicals = [...html.matchAll(/<link\b[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)/gi)].map(match => match[1]);
      const robots = [...html.matchAll(/<meta\b[^>]*name=["'](?:robots|googlebot)["'][^>]*content=["']([^"']+)/gi)].map(match => match[1]).join(',') + ',' + (r.headers.get('x-robots-tag') || '');
      const issues = [];
      if (r.redirected) issues.push('Sitemap URL redirects');
      if (canonicals.length !== 1 || canonicals[0] !== url) issues.push('Missing, duplicate or mismatched canonical');
      if (/\b(noindex|none)\b/i.test(robots)) issues.push('Indexing blocked by robots directive');
      results.push({ url, status: r.status, ms: Date.now() - start, hasContent: /<h1/.test(html), canonical: canonicals[0], robots, issues, cache: r.headers.get('x-vercel-cache') });
    } catch (e) { results.push({ url, error: e.message }); }
  }
}));
await mkdir('reports.local', { recursive: true });
await writeFile('reports.local/availability-audit.json', JSON.stringify({ checkedAt: new Date().toISOString(), results }, null, 2));
const failed = results.filter(r => r.status !== 200 || !r.hasContent || r.issues?.length);
console.log(JSON.stringify({ checked: results.length, failed, maxMs: Math.max(...results.map(r => r.ms || 0)) }, null, 2));
if (failed.length) process.exitCode = 1;
