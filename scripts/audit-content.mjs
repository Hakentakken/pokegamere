import { createServer } from 'vite';
try { process.loadEnvFile('.env'); } catch { /* CI uses environment variables. */ }
const vite = await createServer({ server: { middlewareMode: true, hmr: false }, logLevel: 'error' });
try {
  const { fetchCatalogue } = await vite.ssrLoadModule('/server/catalogue.ts');
  const { parseImageList, parseTextList } = await vite.ssrLoadModule('/src/lib/imageList.ts');
  const rows = await fetchCatalogue();
  const issues = rows.map(h => ({
    title: h.title,
    words: (h.description || '').trim().split(/\s+/).filter(Boolean).length,
    screenshots: parseImageList(h.screenshots).length,
    features: parseTextList(h.features).length,
    author: Boolean(h.author?.trim()),
    sourceHost: (() => { try { return new URL(h.download_link).hostname; } catch { return null; } })(),
  }));
  console.log(JSON.stringify({ total: rows.length, shortDescriptions: issues.filter(h => h.words < 100).length, missingScreenshots: issues.filter(h => !h.screenshots).length, missingFeatures: issues.filter(h => !h.features).length, examples: issues.filter(h => h.words < 100 || !h.screenshots).slice(0, 12) }, null, 2));
} finally { await vite.close(); }
