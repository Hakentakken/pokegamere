# PokeSmith (pokegamere)

React 19 + TypeScript + Vite + Tailwind CSS, backed by **Supabase** (auth, database, storage). Public pages use server-rendered HTML on Vercel and React hydration for navigation and interaction.

## Search visibility and publishing

The canonical host is `https://www.pokesmith.com`, matching the existing Vercel Domains redirect from the apex host. Do not add a reverse `www` → apex rule in `vercel.json`: it creates a redirect loop on deep links. The hosting-level domain configuration owns hostname redirects; application redirects only normalize game paths on the same host.

`npm run build` produces the browser assets in `dist/` and the server renderer in `server-dist/`. Deploy both through the included Vercel configuration: a static-only upload of `dist/` does **not** provide server rendering or the live sitemap. No database migration is required. Server functions use the public, RLS-filtered Supabase key, never a service-role key.

The server renderer bundles its dependencies (`ssr.noExternal: true`). The page function loads that renderer dynamically, so relying on function tracing to discover external React/router dependencies caused production `ERR_MODULE_NOT_FOUND` failures. `scripts/test-deployment.mjs` runs the built handlers in a temporary directory without `node_modules` to catch this before deployment.

Vercel uses explicit ordered `routes` so `/` and `/sitemap-hacks.xml` reach their functions **before** the filesystem phase. Ordinary rewrites lose to `dist/index.html` and the build-time sitemap, leaving the homepage without server-rendered content and the public game sitemap stale. Other static assets are served after these two overrides. Do not mix `routes` with top-level `rewrites`, `headers`, or `redirects`.

- `api/page.ts` serves the page content, unique title, description, canonical and JSON-LD in the initial response. Game and catalogue pages read current public records. It returns permanent redirects for legacy UUID URLs, 404 for missing games, and a non-cacheable 503 for upstream failures.
- `/sitemap-hacks.xml` reads current public records with pagination. Both the sitemap and page HTML have a five-minute edge cache. Newly published games become discoverable without a rebuild; Google still decides when to crawl and index them. Keep published titles stable: slugs are derived from titles, and a title edit changes the URL.
- The patcher implementation and assets are retained, but its public route is removed. `/patcher` returns a noindexed 404, including for direct visits; navigation and sitemaps do not link to it.
- Local `npm run dev` and ordinary `npm run preview` are client-only. To exercise the production HTML and HTTP behavior, run `npm run build`, then `npm run preview:seo` (http://127.0.0.1:4175).
- Run `npm run check:seo`, then `npm run check:seo-server`. `node scripts/test-sitemap-endpoint.mjs` checks the real live database against the sitemap; `npm run audit:content` identifies catalogue entries needing editorial attention.

### Search Console from this workspace

The VS Code Google Search Console MCP extension stores credentials outside this repository. The local fallback utility reads its ADC file without printing tokens:

```bash
npm run search-console -- sites
npm run search-console -- sitemaps sc-domain:pokesmith.com
npm run search-console -- performance sc-domain:pokesmith.com
npm run search-console -- inspect sc-domain:pokesmith.com https://www.pokesmith.com/hacks/pokemon-z-english
```

Set `GSC_CREDENTIALS_PATH` to the extension's ADC file if your storage location differs. Reauthenticate through the extension if Google revokes or expires its refresh token. The utility never uses Google's restricted Indexing API for ordinary game pages.

After deployment has been verified, submit the two existing sitemap URLs using Search Console or the utility's `submit` command. Do not repeatedly resubmit unchanged sitemaps. Do not commit credentials or deploy the local admin utility as a public API.

### Editorial and launch checks

The admin game tab includes an editorial review queue for brief or repeated descriptions and missing creator/platform/status information. It opens the existing edit form; it does not rewrite or publish records automatically. The review flag is not a Google policy threshold. Game pages show a short excerpt near the title, with the full overview, features and screenshots above downloads.

Before requesting an AdSense review, verify the actual account rejection details and every public section, not only the homepage. Remaining checks include source-checked original game descriptions, distribution rights for linked files, accurate credits, and the account's Privacy & messaging configuration. Google requires a certified CMP for personalized ads to users in the EEA, UK and Switzerland; a privacy-policy page alone does not implement that requirement. Also review Auto ads page exclusions for admin, login, error and other non-content pages. These account settings have not been verified or changed locally. No AdSense approval is implied by successful build or SEO tests.

The homepage now links to `/guides`, an original player guide covering release selection, patch/standalone/patched-ROM formats, source checks and save backups. The public policies disclose the catalogue's mixed external download formats. Download panels display the actual destination hostname without claiming it is a verified creator source. Per-game format and redistribution permissions remain an editorial check; they are not inferred from a file-hosting domain.

Public contact: **pokesmithoriginal@gmail.com**. Ratings are administrator-entered catalogue ratings, not verified player-review averages. The privacy page describes existing Analytics, AdSense, embeds, storage and contact handling; it is not a substitute for configuring any consent requirements applicable to actual visitors.

The November 13, 2026 audit found 81 public games and 55 descriptions shorter than 100 words. This is an editorial review indicator, not a Google word-count rule. Add original, source-checked information and verify linked file rights before requesting another AdSense review; layout and metadata changes alone cannot guarantee approval.

No paid service, billing activation, quota purchase or scheduled indexing job is needed by this implementation. Hosting requests still consume the existing plan's resources. Verify that plan and its spending controls before production deployment; do not upgrade or enable overages to deploy this change.

## Local setup

```bash
npm install        # install dependencies
npm run dev        # start dev server → http://localhost:5173
npm run build      # type-check (tsc -b) + production build to dist/
npm run preview    # serve the production build
npm run lint       # eslint
npm run check:db   # verify Supabase connection + tables/columns/storage (reads .env, prints no keys)
npm run check:images # verify screenshot/Drive URL helpers against the live DB + real HTTP fetches
npm run check:ui    # render every page + component to HTML with real DB rows (crash/edge-case check)
```

## Environment variables

Copy `.env.example` to `.env` and fill in your Supabase project values
(Supabase Dashboard → **Project Settings → API**):

| Variable | Description |
| --- | --- |
| `VITE_SUPABASE_URL` | e.g. `https://<project-ref>.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | the public `anon` API key (safe for the browser) |

`.env` is git-ignored — never commit real keys. Only `VITE_*` variables are exposed to the client bundle, so only use the **anon** key (protected by RLS), never the `service_role` key.

The Supabase client is created in `src/lib/supabase.ts`.

### Supabase resources used by the app

- **Tables:** `hacks`, `cheats`, `emulators`
- **Auth:** email/password login for the `/admin` dashboard (`/login` page)
- **Storage bucket:** `hacks` (public) — cover images uploaded under `covers/`

### Screenshots & Google Drive images

`hacks.screenshots` is a **`text`** column holding a JSON array of image URLs
(`["https://…","https://…"]`). Rows written by older admin versions also contain
Postgres array literals (`{url1,url2}`) and double-encoded JSON, so every read
and write goes through one shared codec — no database migration was needed:

- `src/lib/imageList.ts` — reads every legacy encoding, writes canonical JSON.
- `src/lib/imageUrl.ts` — converts public **Google Drive share links**
  (`/file/d/<ID>/view`, `open?id=`, `uc?id=`, `thumbnail?id=`, …) into renderable
  image URLs (`https://lh3.googleusercontent.com/d/<ID>=w1000`) and leaves
  Supabase Storage and plain external URLs untouched.
- `src/components/Screenshot.tsx` — shared renderer used by the public game page
  **and** the admin previews; lazy-loads, keeps its aspect ratio and degrades to
  a tidy "Screenshot unavailable" tile (never a broken image icon).

A Google Drive image therefore only needs the file to be shared with
**"Anyone with the link"**. ROM/patch **download** links are never converted —
they stay exactly the Google Drive / MediaFire / hackdex URL the admin entered.

Run `npm run check:images` to verify the helpers against the live database and
fetch every stored screenshot for real.

---

## Motion system

All timing lives in one place so the site speaks with a single voice.

| Where | What |
| --- | --- |
| `src/lib/motion.ts` | `EASE`, `DUR`, `STEP`, `stagger()`, `SPRING`, `VIEWPORT`, and the `useMotionPrefs()` gate |
| `src/index.css` | `:root` custom properties (`--ease-*`, `--dur-*`, `--stagger*`, `--shell`) + keyframes |

Duration bands: **micro** 150–250ms · **component** 300–700ms · **section**
600–1200ms · **cinematic** 1000ms+.

Reusable pieces (all reduced-motion aware):

| Component | Role |
| --- | --- |
| `Atmosphere` | layered ambient light field (drift, HUD grid, sweep, vignette, grain) |
| `Parallax` | scroll-linked travel + optional pointer depth, nested so nothing reflows |
| `Reveal` | in-view entrance with patterns: `up` `down` `left` `right` `scale` `mask` `fade` |
| `SplitHeading` | masked word-by-word headline reveal (`sub` line as a second beat) |
| `SectionHeader` | one editorial chapter header (eyebrow, index, display title, lede, action) |
| `PageHero` | shared cinematic opening for every inner page |
| `FeaturedHack` | the "key art" moment — one hack, two depth planes |
| `ScreenshotGallery` + `Lightbox` | large stage, thumbnail rail, accessible full-screen view |
| `ProcessSteps`, `CtaBand`, `Marquee`, `Skeleton`, `RouteVeil` | story rail, closing beat, ticker, loading placeholders, route wipe |

Rules of the system: transform/opacity/clip-path only (never width/height/top/left),
ambient loops are pure CSS, and `prefers-reduced-motion` disables every non-essential
animation (including the CSS loops).

---

# React + TypeScript + Vite


This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
