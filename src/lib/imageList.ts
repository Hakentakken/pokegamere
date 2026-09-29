import { isRenderableImageRef, stripUrlArtifacts } from "./imageUrl";

/**
 * Decoder for the list-shaped text columns in Supabase (`hacks.screenshots`,
 * `hacks.features`).
 *
 * Real rows in the live database contain *four* different encodings because the
 * admin panel changed over time, so this module reads all of them and never
 * requires a data migration:
 *
 *   1. a real JS array        (Supabase returns text[] columns like this)
 *   2. JSON array text        `["url1","url2"]`
 *   3. double-encoded JSON    `["[\"url1\",\"url2\"]"]`   (legacy corruption)
 *   4. Postgres array literal `{url1,url2}` / `{"url1","url2"}`
 *   5. `[]`                   (empty — must NOT become one bogus entry)
 *   6. newline / comma lists  (manual dashboard edits)
 *
 * Writes use `serializeImageList()` so new rows always have encoding #2 and can
 * never grow another corruption layer.
 */

const MAX_DECODE_DEPTH = 8;
const URL_PATTERN = /https?:\/\/[^\s"'\\<>[\]{}]+/gi;

/** A ready-to-use reference: absolute http(s) or root-relative, no stray artefacts. */
const CLEAN_REF_PATTERN = /^(https?:\/\/|\/)[^\s"'`\\[\]{}]*$/i;

/** `JSON.parse` that returns `undefined` instead of throwing. */
function tryJsonParse(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return undefined;
  }
}

function looksLikeJsonContainer(value: string): boolean {
  const first = value[0];
  const last = value[value.length - 1];
  return (first === "[" && last === "]") || (first === "{" && last === "}") || first === '"';
}

/**
 * Recursively unpacks nested arrays / JSON-encoded strings.
 *
 * `atomic` means "this string is one authoritative list entry" (it came from a
 * real JS array or from decoded JSON), so it must never be split on commas —
 * a feature such as `"Gen 1-9, all regions"` stays a single entry.
 */
function collect(value: unknown, out: string[], depth = 0, atomic = false): void {
  if (value === null || value === undefined || depth > MAX_DECODE_DEPTH) return;

  if (Array.isArray(value)) {
    for (const item of value) collect(item, out, depth + 1, true);
    return;
  }

  if (typeof value !== "string") return;

  const raw = value.trim();
  if (!raw) return;

  // JSON / quoted layers: "[]" → [] , "[\"a\"]" → ["a"] , "\"a\"" → "a"
  if (looksLikeJsonContainer(raw)) {
    const decoded = tryJsonParse(raw);
    if (decoded !== undefined && decoded !== raw) {
      collect(decoded, out, depth + 1, true);
      return;
    }
  }

  if (atomic) {
    // Already a clean reference → keep verbatim (never rewrites admin input).
    if (CLEAN_REF_PATTERN.test(raw)) {
      out.push(raw);
      return;
    }
    // Legacy corruption such as `["https://…` or `https://…"]` → salvage it.
    const cleaned = stripUrlArtifacts(raw);
    if (CLEAN_REF_PATTERN.test(cleaned)) {
      out.push(cleaned);
      return;
    }
    const embedded = raw.match(URL_PATTERN);
    if (embedded) {
      for (const url of embedded) out.push(stripUrlArtifacts(url));
      return;
    }
    // Plain text (e.g. a feature line) — preserved exactly as stored.
    out.push(raw);
    return;
  }

  // Postgres array literal / plain list: {a,b} , a,b , a\nb
  const inner = raw.replace(/^\{/, "").replace(/\}$/, "");
  for (const token of inner.split(/[,\n]/)) {
    const cleaned = stripUrlArtifacts(token);
    if (!cleaned) continue;

    if (isRenderableImageRef(cleaned) || !/https?:\/\//i.test(cleaned)) {
      out.push(cleaned);
      continue;
    }

    // Token still carries leftovers around an embedded URL → salvage it.
    const found = cleaned.match(URL_PATTERN);
    if (found) for (const url of found) out.push(stripUrlArtifacts(url));
  }
}

/**
 * Parses any historical/current list encoding into a clean string array.
 * Never throws; unknown shapes simply yield `[]`.
 */
export function parseTextList(value: unknown): string[] {
  const out: string[] = [];
  collect(value, out);
  return out;
}

/**
 * Image-specific variant of `parseTextList`: every entry must be something an
 * <img> can consume (absolute http(s) URL or root-relative path). Non-URL noise
 * left over from corrupt rows is dropped instead of rendering a broken tile.
 */
export function parseImageList(value: unknown): string[] {
  return parseTextList(value).filter((entry) => isRenderableImageRef(entry));
}

/**
 * Canonical write format: a JSON array string.
 * Deterministic for a `text` column, and readable in the Supabase dashboard.
 * Drive links are stored exactly as the admin typed them (normalisation happens
 * at render time), so nothing the admin entered is ever rewritten behind them.
 */
export function serializeImageList(urls: string[]): string {
  const clean = (urls || [])
    .map((url) => String(url ?? "").trim())
    .filter((url) => url !== "");

  return JSON.stringify(clean);
}

/**
 * Splits admin input into usable and unusable entries so the UI can warn about
 * what was skipped instead of failing silently.
 */
export function splitImageUrlInput(urls: string[]): { valid: string[]; invalid: string[] } {
  const valid: string[] = [];
  const invalid: string[] = [];

  for (const url of urls || []) {
    const trimmed = String(url ?? "").trim();
    if (!trimmed) continue;
    (isRenderableImageRef(trimmed) ? valid : invalid).push(trimmed);
  }

  return { valid, invalid };
}