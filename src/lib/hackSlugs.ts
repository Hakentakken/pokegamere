import { supabase } from "./supabase";
import { buildSlugIndex, findIdBySlug, type SlugRow } from "./slug";

/**
 * The slug - record bridge.
 *
 * The database keeps its UUIDs as the internal identifier - no migration, no
 * new column. Public URLs use slugs derived from `title` via `src/lib/slug.ts`,
 * and this module resolves them at runtime against a tiny `id, title,
 * created_at` index of the whole catalogue (69 rows approx a few KB).
 *
 * The index is fetched once per full page load and cached module-wide, so
 * navigating between hack pages never re-fetches it. `resolveHackSlug` is the
 * single entry point the detail page uses; `getHackSlugIndex` is exported for
 * the listing/home pages that build card links.
 */

let cache: Promise<Map<string, string>> | null = null;
let cachedAt = 0;

/** All hack rows the index needs (lightweight - never screenshots/features). */
async function fetchRows(): Promise<SlugRow[]> {
  const rows: SlugRow[] = [];
  for (let offset = 0; ; offset += 500) {
    const { data, error } = await supabase.from('hacks').select('id, title, created_at')
      .order('created_at').order('id').range(offset, offset + 499);
    if (error) throw error;
    rows.push(...(data || []).map(row => ({ id: String(row.id), title: row.title, createdAt: row.created_at })));
    if (!data || data.length < 500) return rows;
  }
}

export function getHackSlugIndex(): Promise<Map<string, string>> {
  if (Date.now() - cachedAt > 300000) cache = null;
  if (!cache) cachedAt = Date.now();
  cache ??= fetchRows().then(buildSlugIndex).catch(error => { cache = null; throw error; });
  return cache;
}

export async function resolveHackSlug(param: string | null | undefined): Promise<string | null> {
  const rows = await fetchRows();
  return findIdBySlug(buildSlugIndex(rows), rows, param);
}

export async function slugForId(id: string, title?: string | null): Promise<string> {
  try {
    const index = await getHackSlugIndex();
    return index.get(String(id)) ?? buildSlugIndex([{ id, title }]).get(String(id))!;
  } catch {
    return buildSlugIndex([{ id, title }]).get(String(id))!;
  }
}
