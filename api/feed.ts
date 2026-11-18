import type { IncomingMessage, ServerResponse } from 'node:http';
import { fetchCatalogue } from '../server/catalogue.js';
import { FEED_URL, HUB_URL, renderFeed } from '../server/discovery.js';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  // A publish notification must never cause the hub to fetch stale feed data.
  res.setHeader('Cache-Control', 'no-store');
  if (req.method && !['GET', 'HEAD'].includes(req.method)) {
    res.writeHead(405, { Allow: 'GET, HEAD' }); return res.end();
  }
  try {
    const games = await fetchCatalogue('id,title,description,created_at');
    const xml = renderFeed(games);
    res.writeHead(200, {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      Link: `<${FEED_URL}>; rel="self", <${HUB_URL}>; rel="hub"`,
    });
    res.end(req.method === 'HEAD' ? undefined : xml);
  } catch (error) {
    console.error('Feed unavailable:', error instanceof Error ? error.message : 'unknown error');
    res.writeHead(503, { 'Content-Type': 'text/plain; charset=utf-8', 'Retry-After': '300' });
    res.end(req.method === 'HEAD' ? undefined : 'Game feed temporarily unavailable.');
  }
}
