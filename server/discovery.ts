import { buildSlugIndex } from '../src/lib/slug.js';

export const SITE_ORIGIN = 'https://www.pokesmith.com';
export const FEED_URL = `${SITE_ORIGIN}/feed.xml`;
export const HUB_URL = 'https://pubsubhubbub.appspot.com/';

type FeedGame = { id: string; title: string | null; description: string | null; created_at: string | null };

const xml = (value: string) => value
  // eslint-disable-next-line no-control-regex -- XML 1.0 forbids these characters, even in escaped text.
  .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\ufffe\uffff]/g, '')
  .replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[char]!);

export function renderFeed(games: FeedGame[]) {
  const index = buildSlugIndex(games.map(game => ({ id: String(game.id), title: game.title, createdAt: game.created_at })));
  const items = [...games].reverse().map(game => {
    const url = `${SITE_ORIGIN}/hacks/${index.get(String(game.id))}`;
    const published = game.created_at && Number.isFinite(Date.parse(game.created_at))
      ? `<pubDate>${new Date(game.created_at).toUTCString()}</pubDate>` : '';
    return `<item><title>${xml(game.title || 'Untitled game')}</title><link>${xml(url)}</link>` +
      `<guid isPermaLink="false">pokesmith:game:${xml(String(game.id))}</guid>` +
      `<description>${xml(game.description || '')}</description>${published}</item>`;
  });
  // No fabricated update dates: the schema currently only records created_at.
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel>
<title>PokeSmith game catalogue</title><link>${SITE_ORIGIN}/hacks</link>
<description>Published games, release information and player guides from PokeSmith.</description><language>en</language>
<atom:link href="${FEED_URL}" rel="self" type="application/rss+xml" />
<atom:link href="${HUB_URL}" rel="hub" />
${items.join('\n')}
</channel></rss>\n`;
}

// This broadcasts a changed public feed. Hub acceptance is NOT an indexing
// request or proof that Google Search subscribed, crawled or indexed a URL.
export async function publishDiscovery(fetchImpl = fetch) {
  const response = await fetchImpl(HUB_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ 'hub.mode': 'publish', 'hub.url': FEED_URL }),
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) throw new Error(`Discovery hub returned HTTP ${response.status}`);
}
