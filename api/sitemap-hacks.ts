import { fetchCatalogue } from '../server/catalogue.js'
// GET /sitemap-hacks.xml — dynamic hack sitemap (Vercel Serverless Function).
//
// Why this exists: static hosting cannot regenerate public/*.xml at runtime,
// so a newly published hack would otherwise wait for the next full production
// build before appearing in the sitemap. This endpoint queries Supabase at
// request time and returns fresh XML within seconds of publishing.
//
// Reached via the `/sitemap-hacks.xml -> /api/sitemap-hacks` rewrite in
// vercel.json, which MUST stay above the SPA catch-all rewrite.
//
// Slug logic is an exact mirror of src/lib/slug.ts (keep in sync). Only the
// anon key is used — never a service-role key. Minimum public fields only:
// <loc> + <lastmod> (real created_at dates, no fabricated values).
// Env vars (server-side, never VITE_-prefixed in the browser bundle):
//   SUPABASE_URL / SUPABASE_ANON_KEY (preferred), falling back to the
//   existing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY so the endpoint also
//   works before dedicated server names are configured.
// Configuration errors return 500; exhausted upstream retries return 503.
// Never serve an empty or partial sitemap as a successful response.
export default async function handler(req: any, res: any): Promise<void> {
  const SITE_URL = 'https://www.pokesmith.com'
  const SB_URL =
    process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || ''
  const SB_KEY =
    process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || ''

  if (!SB_URL || !SB_KEY) {
    console.error(
      'sitemap-hacks: missing environment variables. Set SUPABASE_URL and ' +
        'SUPABASE_ANON_KEY in Vercel → Project Settings → Environment Variables.'
    )
    res.statusCode = 500
    res.setHeader('Cache-Control', 'no-store')
    res.setHeader('Content-Type', 'text/plain; charset=utf-8')
    res.end(
      'sitemap-hacks: server misconfigured (missing SUPABASE_URL / SUPABASE_ANON_KEY).'
    )
    return
  }

  try {
    const hacks = await fetchCatalogue('id,title,created_at')

    const index = buildSlugIndex(
      (hacks || []).map((h) => ({
        id: String(h.id),
        title: h.title,
        createdAt: h.created_at,
      }))
    )

    const rows = (hacks || [])
      .map((h) => {
        const slug = index.get(String(h.id))
        if (!slug) return null
        const lastmod = h.created_at && Number.isFinite(Date.parse(h.created_at))
          ? new Date(h.created_at).toISOString().slice(0, 10)
          : null
        return (
          '  <url><loc>' +
          SITE_URL +
          '/hacks/' +
          xmlEscape(slug) +
          '</loc>' +
          (lastmod ? '<lastmod>' + lastmod + '</lastmod>' : '') +
          '</url>'
        )
      })
      .filter((r): r is string => r !== null)

    const xml =
      '<?xml version="1.0" encoding="UTF-8"?>\n' +
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
      rows.join('\n') +
      '\n</urlset>\n'

    res.statusCode = 200
    res.setHeader('Content-Type', 'application/xml; charset=utf-8')
    // Fresh within minutes, cheap on the edge and the database.
    res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=300')
    res.end(xml)
  } catch (err) {
    console.error('sitemap-hacks: failed to generate sitemap:', err instanceof Error ? err.message : 'unknown error')
    res.statusCode = 503
    res.setHeader('Retry-After', '300')
    res.setHeader('Cache-Control', 'no-store')
    res.setHeader('Content-Type', 'text/plain; charset=utf-8')
    res.end('sitemap-hacks: temporarily unavailable (database or configuration error).')
  }
}

// --- slug logic: exact mirror of src/lib/slug.ts (keep in sync) ---
function shortId(id: string): string {
  return String(id).replace(/-/g, '').slice(0, 8)
}

function slugify(title: string | null | undefined): string {
  return (title ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
    .replace(/-+$/, '')
}

type SlugRow = { id: string; title: string | null | undefined; createdAt?: string | null }

function buildSlugIndex(rows: SlugRow[]): Map<string, string> {
  const sorted = [...rows].sort((a, b) => {
    const ta = Date.parse(a.createdAt ?? '') || 0
    const tb = Date.parse(b.createdAt ?? '') || 0
    return ta - tb || String(a.id).localeCompare(String(b.id))
  })
  const index = new Map<string, string>()
  const used = new Set<string>()
  for (const row of sorted) {
    const id = String(row.id)
    const base = slugify(row.title) || `hack-${shortId(id)}`
    let slug = base
    if (used.has(slug)) slug = `${base}-${shortId(id)}`
    let n = 2
    while (used.has(slug)) slug = `${base}-${shortId(id)}-${n++}`
    used.add(slug)
    index.set(id, slug)
  }
  return index
}
// --- end slug mirror ---

function xmlEscape(s: string): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
