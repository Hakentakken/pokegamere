import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Static routes live in public/sitemap.xml, generated from the real database
// at build time by scripts/build-sitemap.mjs. No sitemap plugin — the plugin
// was overwriting that file with fabricated lastmod values on every build.

export default defineConfig({
  plugins: [
    react(),
  ],
  preview: {
    port: 4173,
    strictPort: true,
  },
})
