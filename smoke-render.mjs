// UI smoke harness — renders the REAL components (via Vite's SSR loader) to
// HTML with the REAL database rows. No mocks: anything that crashes at runtime
// or chokes on a real record fails here.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { createServer } from "vite";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { createClient } from "@supabase/supabase-js";

const env = Object.fromEntries(
  readFileSync(new URL("./.env", import.meta.url), "utf8")
    .split(/\r?\n/)
    .filter((l) => l.includes("=") && !l.trim().startsWith("#"))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    })
);

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY, {
  global: { fetch: (i, init = {}) => fetch(i, { ...init, signal: AbortSignal.timeout(15_000) }) },
});

const out = [];
const log = (s) => {
  out.push(s);
  console.log(s);
  writeFileSync(new URL("./verify-ui.txt", import.meta.url), out.join("\n"), "utf8");
};
let failures = 0;
const check = (label, ok, detail = "") => {
  if (!ok) failures++;
  log(`   ${ok ? "PASS" : "FAIL"} · ${label}${detail ? ` — ${detail}` : ""}`);
};

// No fake `window`/`document` here on purpose: framer-motion then takes its
// real server-rendering path instead of trying to attach DOM listeners. The
// components only touch browser APIs inside useEffect, which never runs here.

const server = await createServer({ server: { middlewareMode: true }, logLevel: "error" });
const load = (p) => server.ssrLoadModule(p);

const M = {};
for (const n of ["Home", "Hacks", "HackDetail", "Cheats", "Emulators", "QA", "About", "Contact", "Privacy", "Terms", "Patcher", "NotFound", "Login", "Admin"]) {
  M[n] = (await load(`/src/pages/${n}.tsx`)).default;
}
for (const [k, n] of Object.entries({
  Navbar: "Navbar", Footer: "Footer", HackCard: "HackCard",
  FeaturedHack: "FeaturedHack", Gallery: "ScreenshotGallery",
})) {
  M[k] = (await load(`/src/components/${n}.tsx`)).default;
}
const { parseImageList } = await load("/src/lib/imageList.ts");

const { data: rows, error } = await supabase.from("hacks").select("*");
check("database reachable", !error, error ? error.message : `${(rows || []).length} real rows`);

const real = (rows || []).map((h) => ({
  id: String(h.id),
  title: h.title,
  author: h.author,
  rating: h.rating || 0,
  baseGame: h.base_game || "",
  platform: h.platform || "",
  status: h.status || "",
  coverImage: h.cover_image || "",
  description: h.description || "",
}));

const html = (el, path = "/") =>
  renderToString(createElement(MemoryRouter, { initialEntries: [path] }, el));

const render = (label, el, expect, path) => {
  try {
    const markup = html(el, path);
    check(label, expect ? expect.test(markup) : markup.length > 200, `${markup.length} bytes`);
    return markup;
  } catch (err) {
    check(label, false, `threw: ${err.message}`);
    return "";
  }
};

const route = (path, Page, expect, extra) =>
  render(
    `route ${path}`,
    createElement(
      Routes,
      null,
      createElement(Route, { path, element: createElement(Page, extra) })
    ),
    expect,
    path
  );

log("=== 1. APP SHELL ===");
render("Navbar", createElement(M.Navbar), /Pok/);
render("Footer", createElement(M.Footer), /ROM Hacks/);

log("=== 2. EVERY ROUTE RENDERS ===");
for (const [name, path, expect] of [
  ["Home", "/", /Pok/],
  ["Hacks", "/hacks", /ROM Hacks/],
  ["Cheats", "/cheats", /Cheat/],
  ["Emulators", "/emulators", /Emulator/],
  ["QA", "/qa", /Q|A/],
  ["About", "/about", /About/],
  ["Contact", "/contact", /Contact/],
  ["Privacy", "/privacy", /Privacy/],
  ["Terms", "/terms", /Terms/],
  ["Patcher", "/patcher", /Patcher/],
  ["Login", "/login", /Admin Login/],
  ["Admin", "/admin", /Loading admin/i],
]) route(path, M[name], expect);

// MemoryRouter cannot start at "*" — start somewhere unmatched instead.
route("/no-such-page", M.NotFound, /404/);

// The detail page fetches in an effect (never runs while rendering), so this
// exercises its loading branch; the data branch is covered in section 3.
if (real[0]) route(`/hack/${real[0].id}`, M.HackDetail, /Loading hack/i, { params: { id: real[0].id } });

log("=== 3. REAL RECORDS THROUGH THE NEW COMPONENTS ===");
for (const hack of real.slice(0, 3)) render(`HackCard — ${hack.title}`, createElement(M.HackCard, hack));
if (real[0]) render("FeaturedHack — real row", createElement(M.FeaturedHack, { hack: real[0] }), /Featured/);

log("=== 4. GALLERY WITH REAL SCREENSHOTS ===");
const shotRow = (rows || []).find((h) => parseImageList(h.screenshots).length > 1);
if (shotRow) {
  const shots = parseImageList(shotRow.screenshots);
  render(`Gallery — ${shots.length} real shots`, createElement(M.Gallery, { images: shots, title: shotRow.title }), /Expand/);
} else {
  check("a record with 2+ screenshots exists", false, "none found");
}

log("=== 5. EDGE CASES (bad data must not crash) ===");
const base = real[0] || { id: "0", title: "x", author: "", rating: 0, baseGame: "", platform: "", status: "", coverImage: "", description: "" };
const edge = [
  { ...base, title: "", author: "", baseGame: "", platform: "", status: "", description: "", coverImage: "" },
  { ...base, title: "A".repeat(300) },
  { ...base, title: "<script>alert(1)</script>" },
  { ...base, coverImage: "https://example.com/nope.png" },
  { ...base, coverImage: undefined },
];
for (const [i, data] of edge.entries()) {
  try {
    check(`HackCard survives edge case ${i + 1}`, html(createElement(M.HackCard, data)).length > 0);
  } catch (err) {
    check(`HackCard survives edge case ${i + 1}`, false, err.message);
  }
}

const one = "https://lh3.googleusercontent.com/d/1W9xaMbzESxiKgCKChmfo1qrqIbGMlEen=w1000";
check("gallery with 0 images renders empty", html(createElement(M.Gallery, { images: [], title: "x" })).length < 200);
check("gallery with 1 image hides the rail", !/role="region"/.test(html(createElement(M.Gallery, { images: [one], title: "x" }))));

log("=== 6. THEME, ROUTE TRANSITION AND RAIL GUARDRAILS ===");
const read = (p) => readFileSync(new URL(p, import.meta.url), "utf8");

// -- Theme: every colour token must exist in BOTH palettes, or one theme paints
//    an undefined colour (transparent / inherited) somewhere.
const css = read("./src/index.css");
/** The body of the first rule whose *selector* (line start) matches. */
const block = (selector) => {
  const at = css.search(new RegExp(`^${selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*\\{`, "m"));
  if (at < 0) return "";
  const start = css.indexOf("{", at);
  return css.slice(start + 1, css.indexOf("}", start));
};
const tokensIn = (body) => new Set([...body.matchAll(/(--c-[\w-]+)\s*:/g)].map((m) => m[1]));
const darkTokens = [...tokensIn(block(":root"))];
const lightTokens = tokensIn(block("html.light"));
const missing = darkTokens.filter((t) => !lightTokens.has(t));
check("day palette defines every dark token", missing.length === 0, missing.join(", ") || `${darkTokens.length} tokens`);
check("dark is the default palette (:root)", /--c-ink-950:\s*5 5 7/.test(block(":root")));
check("day palette is inverted (light page)", /--c-ink-950:\s*248 250 252/.test(block("html.light")));
check("theme is applied before first paint", /pokesmith-theme/.test(read("./index.html")));

// -- Theme control: labelled, stateful, and wired to the shared hook.
const navbar = html(createElement(M.Navbar));
check("header renders the theme switch", /aria-pressed=/.test(navbar) && /Switch to (light|dark) theme/.test(navbar));
check("no component forces the dark class", !/classList\.add\("dark"\)/.test(read("./src/components/Navbar.tsx")));
check("text on filled controls never flips", /\.btn \{[^}]*text-oncolor/.test(css));

// -- Route change: nothing may cover the page, and the scroll reset must not animate.
const app = read("./src/App.tsx");
check("no full-screen veil between routes", !/RouteVeil/.test(app));
check("route veil component is gone", !existsSync(new URL("./src/components/RouteVeil.tsx", import.meta.url)));
check("page entrance never covers the viewport", !/fixed inset-0/.test(read("./src/components/PageWrapper.tsx")));
check("scroll reset is instant, not animated", /behavior:\s*"instant"/.test(read("./src/components/ScrollToTop.tsx")));
check("scroll reset keeps rendering un gated", /return null/.test(read("./src/components/ScrollToTop.tsx")));

// -- Showcase rail: real arrows on the element that scrolls, with edge states.
const FeaturedBand = (await load("/src/components/home/FeaturedBand.tsx")).default;
const band = render("FeaturedBand — real rows", createElement(FeaturedBand, { hacks: real.slice(0, 4), loading: false }), /featured-rail/);
check("rail arrows target the scroll container", /aria-controls="featured-rail"/.test(band));
check("rail arrows are labelled both ways", /aria-label="Previous hacks"/.test(band) && /aria-label="Next hacks"/.test(band));
check("rail arrows start disabled at the beginning", /aria-label="Previous hacks"[^>]*disabled|disabled[^>]*aria-label="Previous hacks"/.test(band));
check("rail snap cannot trap the scroll", !/scroll-snap-type: x mandatory/.test(css));

log("");
log(failures === 0 ? "ALL UI SMOKE CHECKS PASSED" : `${failures} UI SMOKE CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
//__MORE__