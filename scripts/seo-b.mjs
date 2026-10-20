// Part 2/3: preview server serves every sitemap route with 200.
import { staticLocs, hackLocs, check } from './seo-a.mjs'
export const PREVIEW = 'http://127.0.0.1:4173'
export const fetchText = async (u) => {
  const r = await fetch(u, { signal: AbortSignal.timeout(5000) })
  return { status: r.status, text: await r.text() }
}
const robots = await fetchText(PREVIEW + '/robots.txt')
check('robots.txt served with 200', robots.status === 200)
const allLocs = staticLocs.map((l) => new URL(l).pathname).concat(hackLocs.map((l) => new URL(l).pathname))
const notOk = []
for (const p of allLocs) {
  const page = await fetchText(PREVIEW + p)
  if (page.status !== 200) notOk.push(p + ' -> ' + page.status)
}
check('all sitemap routes return 200', notOk.length === 0, notOk.slice(0, 3).join('; ') || (allLocs.length + ' routes'))
