/** @type {import('tailwindcss').Config} */

/**
 * Theme-aware colour helper.
 *
 * Colours resolve to `rgb(var(--token) / <alpha-value>)`, so a single class such
 * as `text-neutral-400` reads whatever value is live *right now*. The tokens live
 * in `src/index.css` — dark values on `:root`, light values on `html.light` —
 * which is what lets one class work in both themes without duplicating markup.
 */
const themed = (token) => `rgb(var(${token}) / <alpha-value>)`;

export default {
  darkMode: "class",
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Brand — anchored to the existing red identity.
        // 300/400 are text tones and flip with the theme so labels stay
        // readable; 500/600/700 are fills and stay constant in both themes.
        brand: {
          DEFAULT: "#ef4444",
          300: themed("--c-brand-300"),
          400: themed("--c-brand-400"),
          500: "#ef4444",
          600: "#dc2626",
          700: "#b91c1c",
        },
        // Cinematic ink surfaces — the core of the theme swap.
        ink: {
          950: themed("--c-ink-950"),
          900: themed("--c-ink-900"),
          850: themed("--c-ink-850"),
          800: themed("--c-ink-800"),
          700: themed("--c-ink-700"),
        },
        // Secondary accent (platform tags).
        // `extend` merges into Tailwind's default scale, so listing only the
        // text-bearing shades leaves every fill shade (sky-400, emerald-400/500,
        // rose-400/500…) exactly as it was.
        sky: { 300: themed("--c-sky-300") },
        emerald: { 300: themed("--c-emerald-300") },
        rose: { 300: themed("--c-rose-300") },
        blue: { 400: themed("--c-blue-400") },
        green: { 400: themed("--c-green-400") },
        yellow: { 500: themed("--c-yellow-500") },
        gold: {
          400: themed("--c-gold-400"),
          500: "#f59e0b",
        },
        // Text tones flip with the theme.
        white: themed("--c-white"),
        gray: {
          300: themed("--c-n-300"),
          400: themed("--c-n-400"),
          500: themed("--c-n-500"),
          600: themed("--c-n-600"),
        },
        neutral: {
          200: themed("--c-n-200"),
          300: themed("--c-n-300"),
          400: themed("--c-n-400"),
          500: themed("--c-n-500"),
          600: themed("--c-n-600"),
        },
        /**
         * Foreground for *filled* controls (brand, emerald, amber buttons).
         * Those backgrounds keep a fixed saturation in both themes, so their
         * text must stay light instead of following `--c-white`.
         */
        oncolor: "#ffffff",
      },
      fontFamily: {
        display: ['"Space Grotesk"', "ui-sans-serif", "system-ui", "sans-serif"],
        sans: ['"Inter"', "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', "ui-monospace", "SFMono-Regular", "monospace"],
      },
      boxShadow: {
        "glow-sm": "0 0 0 1px rgba(239,68,68,0.25), 0 10px 30px -14px rgba(239,68,68,0.55)",
        glow: "0 0 45px -12px rgba(239,68,68,0.55)",
        panel: "0 30px 70px -40px rgba(0,0,0,0.95)",
      },
      transitionTimingFunction: {
        cinematic: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
      keyframes: {
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "0.4" },
          "50%": { opacity: "1" },
        },
      },
      animation: {
        marquee: "marquee 38s linear infinite",
        "pulse-soft": "pulse-soft 2.4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};