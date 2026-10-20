// Part 3/3: per-page useSeo source contract + final verdict.
import { readFileSync, existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { check, failCount } from './seo-a.mjs'
import './seo-b.mjs'
const here = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(here, '..')
const pagesDir = path.join(root, 'src', 'pages')
const read = (f) => (existsSync(path.join(pagesDir, f)) ? readFileSync(path.join(pagesDir, f), 'utf8') : '')
const publicPages = [
  ['Home.tsx', '/'], ['Hacks.tsx', '/hacks'], ['Cheats.tsx', '/cheats'],
  ['Emulators.tsx', '/emulators'], ['Patcher.tsx', '/patcher'], ['QA.tsx', '/qa'],
  ['About.tsx', '/about'], ['Contact.tsx', '/contact'], ['Privacy.tsx', '/privacy'],
  ['Terms.tsx', '/terms'],
]
for (const [file, canonical] of publicPages) {
  const src = read(file)
  check('useSeo + canonical ' + canonical + ' — ' + file, src.includes('useSeo(') && src.includes('canonicalPath: "' + canonical + '"'))
}
for (const file of ['Login.tsx', 'Admin.tsx', 'NotFound.tsx']) {
  const src = read(file)
  check('noindex — ' + file, src.includes('useSeo(') && src.includes('noindex, nofollow'))
}
const detail = read('HackDetail.tsx')
check('HackDetail useSeo contract', detail.includes('useSeo(') && detail.includes('canonicalPath') && detail.includes('noindex, nofollow'))
const n = failCount()
console.log('')
console.log(n === 0 ? 'ALL SEO CHECKS PASSED' : n + ' SEO CHECK(S) FAILED')
process.exit(n === 0 ? 0 : 1)
