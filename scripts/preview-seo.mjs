// Local preview of the production page handler, including HTTP redirects and errors.
import { createServer as httpServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { createServer } from 'vite';
try { process.loadEnvFile('.env'); } catch { /* CI */ }
const vite = await createServer({ server: { middlewareMode: true, hmr: false }, logLevel: 'error' });
const { default: page } = await vite.ssrLoadModule('/api/page.ts');
const { default: sitemap } = await vite.ssrLoadModule('/api/sitemap-hacks.ts');
const { default: feed } = await vite.ssrLoadModule('/api/feed.ts');
const { default: notify } = await vite.ssrLoadModule('/api/notify-discovery.ts');
const root = path.resolve('dist');
const types = { '.js': 'text/javascript', '.css': 'text/css', '.xml': 'application/xml', '.txt': 'text/plain', '.jpeg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml' };
httpServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  if (url.pathname === '/sitemap-hacks.xml') return sitemap(req, res);
  if (url.pathname === '/feed.xml') return feed(req, res);
  if (url.pathname === '/api/notify-discovery') return notify(req, res);
  const file = path.resolve(root, '.' + decodeURIComponent(url.pathname));
  if (file.startsWith(root + path.sep) && path.extname(file)) {
    try { const data = await readFile(file); res.setHeader('Content-Type', types[path.extname(file)] || 'application/octet-stream'); return res.end(data); }
    catch { res.writeHead(404); return res.end('Not found'); }
  }
  await page(req, res);
}).listen(4175, '127.0.0.1', () => console.log('SEO preview: http://127.0.0.1:4175'));
