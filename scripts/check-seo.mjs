// Lifecycle wrapper: build, start `vite preview`, wait until it answers,
// run the seo-smoke checks, then shut preview down. Works on Windows and
// POSIX shells (no &, no taskkill, no pkill needed).
import { spawn, spawnSync } from 'node:child_process'
import { setTimeout as sleep } from 'node:timers/promises'

const HOST = '127.0.0.1'
const PORT = 4173
const BASE = `http://${HOST}:${PORT}`
const isWin = process.platform === 'win32'

// 1. production build (also runs build-sitemap via prebuild below)
const build = spawnSync(isWin ? 'npm' : 'npm', ['run', 'build'], { stdio: 'inherit', shell: true })
if (build.status !== 0) process.exit(build.status ?? 1)

// 2. start preview in the background
const preview = spawn(isWin ? 'npm' : 'npm', ['run', 'preview', '--', '--host', HOST, '--port', String(PORT), '--strictPort'], {
  stdio: 'ignore',
  detached: false,
  shell: true,
})

// 3. wait until it answers (up to 30s)
let up = false
const deadline = Date.now() + 30000
while (Date.now() < deadline) {
  try {
    const res = await fetch(BASE + '/robots.txt', { signal: AbortSignal.timeout(2000) })
    if (res.ok) { up = true; break }
  } catch { /* retry */ }
  await sleep(500)
}
if (!up) {
  console.error('FAIL - preview server did not start')
  preview.kill()
  process.exit(1)
}
console.log('PASS - preview server is up at ' + BASE)

// 4. run the smoke checks
const smoke = spawnSync(process.execPath, ['scripts/seo-smoke.mjs'], { stdio: 'inherit' })

// 5. shut preview down
preview.kill()
process.exit(smoke.status ?? 1)
