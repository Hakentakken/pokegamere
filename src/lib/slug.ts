/**
 * URL slugs for ROM hacks — pure functions only (no DOM, no Supabase), so the
 * same logic runs in the browser, in the Vite build config (sitemap) and in
 * `seo-check.mjs` under plain Node.
 *
 * Slug rules:
 *   "Pokémon Añil : Definitive Edition" → "pokemon-anil-definitive-edition"
 *   "Celia's Stupid Romhack"            → "celias-stupid-romhack"
 *   "" / all-punctuation title          → "hack-<id8>" (never empty)
 *
 * Collisions (two hacks whose titles slugify identically) are resolved
 * deterministically: rows are ordered by `created_at` (ties by id), the first
 * keeps the bare slug, every later duplicate gets "-<id8>" appended, where
 * id8 is the first 8 hex chars of the record's UUID. The order never depends
 * on fetch order, so the same record always gets the same slug.
 */

/** First 8 characters of a UUID with its dashes removed. */
export function shortId(id: string): string {
  return String(id).replace(/-/g, "").slice(0, 8);
}

/** Accent-, case- and punctuation-insensitive slug of a hack title. */
export function slugify(title: string | null | undefined): string {
  return (title ?? "")
    .normalize("NFD") // decompose "é" → "e" + combining mark
    .replace(/[\u0300-\u036f]/g, "") // strip the combining marks
    .toLowerCase()
    .replace(/['’]/g, "") // drop apostrophes: "Celia's" → "celias", not "celia-s"
    .replace(/[^a-z0-9]+/g, "-") // everything else becomes one hyphen
    .replace(/^-+|-+$/g, "") // trim leading/trailing hyphens
    .slice(0, 80)
    .replace(/-+$/, ""); // re-trim after slicing
}

/** The minimal row shape slug indexing needs. */
export type SlugRow = {
  id: string;
  title: string | null | undefined;
  /** `created_at` — decides which duplicate owns the bare slug. Unparseable falls back to epoch. */
  createdAt?: string | null;
};

/**
 * id → canonical slug for a full set of hack rows.
 *
 * Deterministic and collision-free:
 *   - rows ordered by created_at asc (id breaks ties),
 *   - first row claiming a base slug keeps it,
 *   - later duplicates become "<base>-<id8>",
 *   - empty titles become "hack-<id8>".
 */
export function buildSlugIndex(rows: SlugRow[]): Map<string, string> {
  const sorted = [...rows].sort((a, b) => {
    const ta = Date.parse(a.createdAt ?? "") || 0;
    const tb = Date.parse(b.createdAt ?? "") || 0;
    return ta - tb || String(a.id).localeCompare(String(b.id));
  });

  const index = new Map<string, string>();
  const used = new Set<string>();

  for (const row of sorted) {
    const id = String(row.id);
    const base = slugify(row.title) || `hack-${shortId(id)}`;
    let slug = base;
    if (used.has(slug)) slug = `${base}-${shortId(id)}`;
    let n = 2;
    while (used.has(slug)) slug = `${base}-${shortId(id)}-${n++}`; // id8 clash — astronomically rare
    used.add(slug);
    index.set(id, slug);
  }

  return index;
}

// Historical URLs observed in Search Console on 2026-11-20. Pin aliases to
// public record IDs so future title edits still redirect to the same game.
// Never infer replacements by fuzzy title matching or redirect removed games.
export const LEGACY_HACK_SLUGS: Readonly<Record<string, string>> = {
  'pokemon-hyper-emerald-lost-artifacts-v5-7': '36ad5e1b-8641-46e6-b557-df0b732a54c2',
  'pokemon-quetzal-v0-9-0': '68e8392b-26db-4663-b63b-863404732d5b',
  'pokemon-soulgold-v1-2': '67e6e781-b815-4e1a-b157-c26f2a808c28',
  'pokemon-world-stadium-v3-5-6': '475e2133-999f-4439-be4e-f6ce1907b044',
};

/**
 * Canonical slug → id lookup, plus tolerant fallbacks so old or hand-edited
 * URLs keep resolving: case differences, and a duplicate's "-<id8>" suffix
 * even when the bare form now belongs to a different record.
 */
export function findIdBySlug(
  index: Map<string, string>,
  rows: SlugRow[],
  param: string | null | undefined
): string | null {
  const raw = (param ?? "").toLowerCase().trim();
  if (!raw) return null;

  // 1. Exact canonical match.
  for (const [id, slug] of index) if (slug === raw) return id;

  // A legacy alias only resolves while its exact public record still exists.
  const legacyId = Object.hasOwn(LEGACY_HACK_SLUGS, raw) ? LEGACY_HACK_SLUGS[raw] : undefined;
  if (legacyId && index.has(legacyId) && rows.some(row => row.id === legacyId)) return legacyId;

  // 2. Tolerant: "<base>" matches "<base>-<id8>" when base is unambiguous.
  const tolerant = rows.filter((r) => {
    const base = slugify(r.title) || `hack-${shortId(r.id)}`;
    return raw === base || raw === `${base}-${shortId(r.id)}`;
  });
  if (tolerant.length === 1) return String(tolerant[0].id);

  return null;
}
