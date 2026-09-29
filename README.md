# PokeSmith (pokegamere)

React 19 + TypeScript + Vite + Tailwind CSS single-page app, backed by **Supabase** (auth, database, storage).

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
