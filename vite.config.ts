import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Static routes live in public/sitemap.xml, generated from the real database
// at build time by scripts/build-sitemap.mjs. No sitemap plugin — the plugin
// was overwriting that file with fabricated lastmod values on every build.

export default defineConfig({
  plugins: [
    react(),
  ],
  // api/page loads this generated renderer by a runtime path. Bundle its
  // dependencies here so Vercel's function tracer cannot omit them.
  ssr: {
    noExternal: true,
  },
  preview: {
    port: 4173,
    strictPort: true,
  },
})
