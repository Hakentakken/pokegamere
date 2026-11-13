// Local test harness for api/sitemap-hacks.ts (NOT deployed).
// Usage: node scripts/test-sitemap-endpoint.mjs
// Verifies: valid XML, slug parity with site logic, all accessible hacks
// included, minimum fields only, error path returns 500 text (not fake XML).
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { register } from 'node:module'

const here = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(here, '..')

// Load local .env for the test only (never committed, never printed).
const envVals = {}
try {
  for (const line of readFileSync(path.join(root, '.env'), 'utf8').split(/\r?\n/)) {
    if (!line.includes('=') || line.trim().startsWith('#')) continue
    const i = line.indexOf('=')
    envVals[line.slice(0, i).trim()] = line.slice(i + 1).trim()
  }
} catch { /* no .env — rely on process.env */ }
process.env.VITE_SUPABASE_URL ||= envVals.VITE_SUPABASE_URL || ''
process.env.VITE_SUPABASE_ANON_KEY ||= envVals.VITE_SUPABASE_ANON_KEY || ''

let pass = 0
let fail = 0
const check = (label, ok, detail = '') => {
  if (ok) pass++
  else fail++
  console.log(`   ${ok ? 'PASS' : 'FAIL'} - ${label}${detail ? ' - ' + detail : ''}`)
}

const makeRes = () => ({
  statusCode: 200,
  headers: {},
  body: '',
  setHeader(k, v) { this.headers[k] = v },
  end(b) { this.body = b },
})

// Strip TS types using the project's own TypeScript compiler (robust,
// no fragile regexes), then load the handler as plain JS.
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const ts = require('typescript')
const rawSrc = readFileSync(path.join(root, 'api', 'sitemap-hacks.ts'), 'utf8')
const jsSrc = ts.transpileModule(rawSrc, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 },
}).outputText
const src = jsSrc.replace(/export default async function handler/g, 'async function __handler')
const modUrl = 'data:text/javascript;base64,' + Buffer.from(src + '\nexport default __handler;').toString('base64')
const handler = (await import(modUrl)).default

// --- Test 1: happy path — valid XML, real data ---
const res = makeRes()
await handler({}, res)
check('endpoint returns HTTP 200', res.statusCode === 200, 'got ' + res.statusCode)
check(
  'Content-Type is application/xml',
  String(res.headers['Content-Type'] || '').startsWith('application/xml'),
  String(res.headers['Content-Type'])
)
check('body is an XML urlset', res.body.includes('<?xml') && res.body.includes('<urlset'))
const locs = [...res.body.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1])
check('all locs are canonical /hacks/:slug URLs', locs.length > 0 && locs.every((l) => l.startsWith('https://www.pokesmith.com/hacks/')), locs.length + ' urls')
check('no /admin, /login, /hack/ (legacy) locs', !locs.some((l) => /\/(admin|login)/.test(l) || /\/hack\//.test(l)))
const lastmods = [...res.body.matchAll(/<lastmod>([^<]+)<\/lastmod>/g)].map((m) => m[1])
check(
  'every url has a real-date lastmod',
  lastmods.length === locs.length && lastmods.every((d) => /^\d{4}-\d{2}-\d{2}$/.test(d)),
  lastmods.length + '/' + locs.length
)
check('minimum fields only (no changefreq/priority/image tags)', !/changefreq|priority|<image:/.test(res.body))
check(
  'Cache-Control present (edge caching)',
  /max-age=300/.test(String(res.headers['Cache-Control'] || '')),
  String(res.headers['Cache-Control'])
)

// --- Test 2: parity with the site's slug logic + full coverage ---
const SB_URL = process.env.VITE_SUPABASE_URL
const SB_KEY = process.env.VITE_SUPABASE_ANON_KEY
const dbRows = await fetch(SB_URL + '/rest/v1/hacks?select=id,title,created_at&order=created_at.asc', {
  headers: { apikey: SB_KEY, Authorization: 'Bearer ' + SB_KEY },
}).then((r) => r.json())
check('endpoint covers every accessible hack row', locs.length === dbRows.length, locs.length + ' vs ' + dbRows.length + ' rows')

// Compare against the static sitemap built from the same DB (same slug code).
const staticHacks = readFileSync(path.join(root, 'public', 'sitemap-hacks.xml'), 'utf8')
const staticLocs = new Set([...staticHacks.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]))
const dynLocs = new Set(locs)
const missing = [...staticLocs].filter((l) => !dynLocs.has(l))
const extra = [...dynLocs].filter((l) => !staticLocs.has(l))
check('slug parity with build-sitemap output', missing.length === 0 && extra.length === 0, 'missing=' + missing.length + ' extra=' + extra.length)

// --- Test 3: failure path — missing env must be loud 500 text, not fake XML ---
const savedUrl = process.env.VITE_SUPABASE_URL
const savedKey = process.env.VITE_SUPABASE_ANON_KEY
const savedSrvUrl = process.env.SUPABASE_URL
const savedSrvKey = process.env.SUPABASE_ANON_KEY
delete process.env.VITE_SUPABASE_URL
delete process.env.VITE_SUPABASE_ANON_KEY
delete process.env.SUPABASE_URL
delete process.env.SUPABASE_ANON_KEY
const errRes = makeRes()
await handler({}, errRes)
process.env.VITE_SUPABASE_URL = savedUrl
process.env.VITE_SUPABASE_ANON_KEY = savedKey
if (savedSrvUrl !== undefined) process.env.SUPABASE_URL = savedSrvUrl
if (savedSrvKey !== undefined) process.env.SUPABASE_ANON_KEY = savedSrvKey
check('missing env returns HTTP 500', errRes.statusCode === 500, 'got ' + errRes.statusCode)
check('error body is NOT valid sitemap XML', !errRes.body.includes('<urlset'))
check('error names the missing variables (safe — names only)', /SUPABASE_URL/.test(errRes.body))

console.log('')
console.log(fail === 0 ? `ALL ENDPOINT CHECKS PASSED (${pass})` : `${fail} ENDPOINT CHECK(S) FAILED`)
process.exit(fail === 0 ? 0 : 1)
