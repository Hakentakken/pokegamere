import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom';
import App from './App';
import { CatalogueContext, catalogueIndex, type PublicHack } from './lib/catalogue';
import { SeoContext, SITE_URL, type SeoOptions } from './lib/seo';
import { findIdBySlug } from './lib/slug';

export const escapeHtml = (s: string) => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
export const safeJson = (value: unknown) => JSON.stringify(value).replace(/</g, '\\u003c');

export function render(url: string, catalogue: PublicHack[] | null) {
  const path = new URL(url, SITE_URL).pathname;
  const rows = catalogue || [];
  const index = catalogueIndex(rows);
  const detail = path.match(/^\/(hacks|hack)\/([^/]+)\/?$/);
  let status = 200;
  if (detail) {
    const param = decodeURIComponent(detail[2]);
    const id = rows.find(h => h.id === param)?.id || findIdBySlug(index, rows, param);
    if (!id) status = 404;
    else if (path !== `/hacks/${index.get(id)}`) return { status: 301, location: `/hacks/${index.get(id)}` };
  } else if (!['/', '/hacks', '/cheats', '/emulators', '/qa', '/about', '/privacy', '/terms', '/contact', '/editorial', '/guides', '/login', '/admin'].includes(path)) status = 404;
  const seo: { current?: SeoOptions } = {};
  const html = renderToString(
    <SeoContext.Provider value={seo}>
      <CatalogueContext.Provider value={catalogue}>
        <StaticRouter location={url}><App /></StaticRouter>
      </CatalogueContext.Provider>
    </SeoContext.Provider>,
  );
  const meta = seo.current || { title: 'PokéSmith' };
  if (path === '/admin' || path === '/login') meta.robots = 'noindex, nofollow';
  const title = meta.title.endsWith('PokéSmith') ? meta.title : `${meta.title} | PokéSmith`;
  const canonical = new URL(meta.canonicalPath || path, SITE_URL).href;
  const head = `<title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(meta.description || '')}">
    <meta name="robots" content="${escapeHtml(meta.robots || 'index, follow')}">
    <link rel="canonical" href="${escapeHtml(canonical)}">
    <meta property="og:title" content="${escapeHtml(title)}">
    <meta property="og:description" content="${escapeHtml(meta.description || '')}">
    <meta property="og:url" content="${escapeHtml(canonical)}">
    <meta property="og:type" content="${escapeHtml(meta.ogType || 'website')}">
    <meta property="og:site_name" content="PokéSmith">
    <meta name="twitter:card" content="${meta.image ? 'summary_large_image' : 'summary'}">
    <meta name="twitter:title" content="${escapeHtml(title)}">
    <meta name="twitter:description" content="${escapeHtml(meta.description || '')}">
    ${meta.image ? `<meta property="og:image" content="${escapeHtml(meta.image)}"><meta name="twitter:image" content="${escapeHtml(meta.image)}">` : ''}
    ${meta.image && meta.imageAlt ? `<meta property="og:image:alt" content="${escapeHtml(meta.imageAlt)}"><meta name="twitter:image:alt" content="${escapeHtml(meta.imageAlt)}">` : ''}
    ${meta.jsonLd ? `<script id="pokesmith-jsonld" type="application/ld+json">${safeJson(meta.jsonLd)}</script>` : ''}`;
  return { status, html, head, data: safeJson(catalogue) };
}
