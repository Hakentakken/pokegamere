// Public, RLS-filtered reads only. Never use a service-role key for page rendering.
export const HACK_FIELDS = 'id,title,created_at,author,description,base_game,platform,status,rating,cover_image,download_link,screenshots,features';
export async function fetchCatalogue(fields = HACK_FIELDS) {
  const origin = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  if (!origin || !key) throw new Error('Missing SUPABASE_URL / SUPABASE_ANON_KEY');
  const rows = [];
  // Paginate explicitly: Supabase caps a response at 1,000 records by default.
  for (let offset = 0; ; offset += 500) {
    const url = new URL('/rest/v1/hacks', origin);
    url.search = new URLSearchParams({ select: fields, order: 'created_at.asc,id.asc', offset: String(offset), limit: '500' }).toString();
    const response = await fetch(url, {
      headers: { apikey: key, Authorization: `Bearer ${key}` }, signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) throw new Error(`Public catalogue returned HTTP ${response.status}`);
    const batch = await response.json();
    if (!Array.isArray(batch)) throw new Error('Invalid catalogue response');
    rows.push(...batch);
    if (batch.length < 500) return rows;
  }
}
