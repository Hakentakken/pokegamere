// Part 1/3: sitemap + robots source checks.
import { readFileSync, existsSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
const here = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(here, '..')
let failures = 0
export const check = (label, ok, detail = '') => {
  if (!ok) failures++
  console.log(`   ${ok ? 'PASS' : 'FAIL'} - ${label}${detail ? ' - ' + detail : ''}`)
}
export const failCount = () => failures
const r = spawnSync(process.execPath, [path.join(root, 'scripts', 'build-sitemap.mjs')], { stdio: 'inherit' })
check('sitemap builder exits 0', r.status === 0)
export const sitemapXml = existsSync(path.join(root, 'public', 'sitemap.xml')) ? readFileSync(path.join(root, 'public', 'sitemap.xml'), 'utf8') : ''
export const hacksSitemap = existsSync(path.join(root, 'public', 'sitemap-hacks.xml')) ? readFileSync(path.join(root, 'public', 'sitemap-hacks.xml'), 'utf8') : ''
check('public/sitemap.xml exists', sitemapXml.includes('<?xml'))
check('public/sitemap-hacks.xml exists', hacksSitemap.includes('<?xml'))
const urlCount = (s) => (s.match(/<url>/g) || []).length
const locs = (s) => (s.match(/<loc>([^<]+)<\/loc>/g) || []).map((m) => m.slice(5, -6))
export const staticLocs = locs(sitemapXml)
export const hackLocs = locs(hacksSitemap)
check('sitemap.xml has 10 static routes', urlCount(sitemapXml) === 10, 'found ' + urlCount(sitemapXml))
check('sitemap-hacks.xml is non-empty', urlCount(hacksSitemap) > 0, 'found ' + urlCount(hacksSitemap))
check('sitemap.xml has no fabricated lastmod', !/<lastmod>/.test(sitemapXml))
const hackLastmods = (hacksSitemap.match(/<lastmod>([^<]+)<\/lastmod>/g) || []).map((m) => m.slice(9, -10))
check('hack lastmod values are real dates', hackLastmods.length === urlCount(hacksSitemap) && hackLastmods.every((d) => /^\d{4}-\d{2}-\d{2}$/.test(d)), hackLastmods.length + '/' + urlCount(hacksSitemap))
const slugLocs = hackLocs.filter((l) => l.startsWith('https://pokesmith.com/hacks/'))
check('all hack loc are /hacks/:slug', slugLocs.length === hackLocs.length, slugLocs.length + '/' + hackLocs.length)
const bad = staticLocs.concat(hackLocs).filter((l) => /\/admin|\/login/.test(l))
check('sitemaps contain no /admin or /login', bad.length === 0)
const robotsSrc = existsSync(path.join(root, 'public', 'robots.txt')) ? readFileSync(path.join(root, 'public', 'robots.txt'), 'utf8') : ''
check('public/robots.txt exists', robotsSrc.length > 0)
check('robots.txt disallows /admin', /Disallow:\s*\/admin/.test(robotsSrc))
check('robots.txt disallows /login', /Disallow:\s*\/login/.test(robotsSrc))
check('robots.txt allows public routes', /Allow:\s*\//.test(robotsSrc))
check('robots.txt references both sitemaps', /sitemap\.xml/.test(robotsSrc) && /sitemap-hacks\.xml/.test(robotsSrc))
