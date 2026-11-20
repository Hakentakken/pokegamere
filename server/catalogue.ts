// Public, RLS-filtered reads only. Never use a service-role key for page rendering.
export const HACK_FIELDS = 'id,title,created_at,author,description,base_game,platform,status,rating,cover_image,download_link,screenshots,features';
const inFlight = new Map<string, ReturnType<typeof readCatalogue>>();
const transientStatuses = new Set([408, 429, 500, 502, 503, 504]);

export async function fetchCatalogue(fields = HACK_FIELDS) {
  const origin = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  if (!origin || !key) throw new Error('Missing SUPABASE_URL / SUPABASE_ANON_KEY');
  // Share only overlapping reads with identical public credentials/projections.
  // Settled results are removed so edits and publication remain immediately visible.
  const identity = JSON.stringify([origin, key, fields]);
  const pending = inFlight.get(identity);
  if (pending) return pending;
  const request = readCatalogue(origin, key, fields);
  inFlight.set(identity, request);
  try { return await request; }
  finally { inFlight.delete(identity); }
}

async function readCatalogue(origin: string, key: string, fields: string) {
  const rows = [];
  // One budget covers every page, retry and response body, below function duration.
  const budget = AbortSignal.timeout(8000);
  for (let offset = 0; ; offset += 500) {
    const url = new URL('/rest/v1/hacks', origin);
    url.search = new URLSearchParams({ select: fields, order: 'created_at.asc,id.asc', offset: String(offset), limit: '500' }).toString();
    let batch;
    for (let attempt = 0; attempt < 2; attempt++) {
      budget.throwIfAborted();
      let response;
      try {
        response = await fetch(url, {
          headers: { apikey: key, Authorization: `Bearer ${key}` },
          signal: AbortSignal.any([budget, AbortSignal.timeout(3000)]),
        });
        if (response.ok) { batch = await response.json(); break; }
      } catch (error) {
        // Retry transport/timeouts only; malformed JSON is not a transient outage.
        if (attempt || budget.aborted || (error instanceof SyntaxError)) throw error;
        response = undefined;
      }
      if (response) {
        await response.body?.cancel();
        if (attempt || !transientStatuses.has(response.status)) {
          throw new Error(`Public catalogue returned HTTP ${response.status}`);
        }
        // Do not retry earlier than the upstream's requested backoff.
        const retryAfter = response.headers?.get('retry-after');
        if (retryAfter && (Number(retryAfter) > 0 || Date.parse(retryAfter) > Date.now())) {
          throw new Error(`Public catalogue requested backoff (HTTP ${response.status})`);
        }
      }
      await new Promise(resolve => setTimeout(resolve, 150));
    }
    if (!Array.isArray(batch)) throw new Error('Invalid catalogue response');
    rows.push(...batch);
    if (batch.length < 500) return rows;
  }
}
