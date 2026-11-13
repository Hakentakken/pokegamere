// Build-time script: fetch real hack titles from Supabase, slugify them with
// the SAME logic as the browser (src/lib/slug.ts, inlined here because the
// build script runs under plain Node), and write sitemap.xml (static routes) +
// sitemap-hacks.xml (live hacks) into public/.
// This guarantees every <loc> is crawlable with real data and no fabricated
// lastmod: static routes carry no lastmod at all, hack routes carry the row's
// real created_at.
//
// Env loading: read VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY from
// process.env first (Vercel dashboard / CI), falling back to a local `.env`
// file for workstation builds. A missing `.env` file must NOT crash the
// script — on Vercel there is intentionally no `.env` file (gitignored).
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const here = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(here, '..')

function loadLocalEnvFile() {
  const envPath = path.join(root, '.env')
  if (!existsSync(envPath)) return {}
  try {
    return Object.fromEntries(
      readFileSync(envPath, 'utf8')
        .split(/\r?\n/)
        .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
        .map((l) => {
          const i = l.indexOf('=')
          return [l.slice(0, i).trim(), l.slice(i + 1).trim()]
        })
    )
  } catch {
    return {}
  }
}

const fileEnv = loadLocalEnvFile()

const SB_URL = process.env.VITE_SUPABASE_URL || fileEnv.VITE_SUPABASE_URL
const SB_KEY = process.env.VITE_SUPABASE_ANON_KEY || fileEnv.VITE_SUPABASE_ANON_KEY

// --- slug logic: mirror of src/lib/slug.ts (keep in sync) ---
function shortId(id) {
  return String(id).replace(/-/g, '').slice(0, 8)
}

function slugify(title) {
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

function buildSlugIndex(rows) {
  const sorted = [...rows].sort((a, b) => {
    const ta = Date.parse(a.created_at ?? '') || 0
    const tb = Date.parse(b.created_at ?? '') || 0
    return ta - tb || String(a.id).localeCompare(String(b.id))
  })
  const index = new Map()
  const used = new Set()
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

async function fetchJson(url, headers) {
  const res = await fetch(url, { headers })
  if (!res.ok) throw new Error('fetch ' + url + ' -> ' + res.status)
  return res.json()
}

function xmlEscape(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

async function main() {
  if (!SB_URL || !SB_KEY) {
    const missing = [
      !SB_URL ? 'VITE_SUPABASE_URL' : null,
      !SB_KEY ? 'VITE_SUPABASE_ANON_KEY' : null,
    ]
      .filter(Boolean)
      .join(', ')
    throw new Error(
      'build-sitemap: missing required environment variable(s): ' +
        missing +
        '. Configure them in Vercel → Project Settings → Environment Variables ' +
        '(Production), or add them to a local `.env` file (see `.env.example`). ' +
        'No credentials are logged. Refusing to reuse stale sitemap files.'
    )
  }

  const commonHeaders = { apikey: SB_KEY, Authorization: 'Bearer ' + SB_KEY }

  const hacks = []
  for (let offset = 0; ; offset += 500) {
    const batch = await fetchJson(SB_URL + '/rest/v1/hacks?select=id,title,created_at&order=created_at.asc,id.asc&limit=500&offset=' + offset, commonHeaders)
    hacks.push(...batch)
    if (batch.length < 500) break
  }
  const index = buildSlugIndex(hacks || [])

  const staticRoutes = [
    '/',
    '/hacks',
    '/cheats',
    '/emulators',
    '/editorial',
    '/guides',
    '/qa',
    '/about',
    '/privacy',
    '/terms',
    '/contact',
  ]

  const hackRoutes = (hacks || []).map((h) => ({
    loc: '/hacks/' + index.get(String(h.id)),
    lastmod: h.created_at ? new Date(h.created_at).toISOString().slice(0, 10) : undefined,
  }))

  const writeSitemap = (routes, outFile) => {
    const rows = routes.map((r) => {
      const lastmod = r.lastmod ? `<lastmod>${xmlEscape(r.lastmod)}</lastmod>` : ''
      return `  <url><loc>https://pokesmith.com${xmlEscape(r.loc)}</loc>${lastmod}</url>`
    }).join('\n')
    writeFileSync(path.join(root, 'public', outFile), '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + rows + '\n</urlset>\n')
  }

  writeSitemap(staticRoutes.map((loc) => ({ loc })), 'sitemap.xml')
  writeSitemap(hackRoutes, 'sitemap-hacks.xml')
  console.log('wrote public/sitemap.xml (' + staticRoutes.length + ' routes)')
  console.log('wrote public/sitemap-hacks.xml (' + hackRoutes.length + ' routes)')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

