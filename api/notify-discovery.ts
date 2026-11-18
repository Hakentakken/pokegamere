import type { IncomingMessage, ServerResponse } from 'node:http';
import { FEED_URL, publishDiscovery } from '../server/discovery.js';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  res.setHeader('Cache-Control', 'no-store');
  const respond = (status: number, body: object) => {
    res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(body));
  };
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST'); return respond(405, { error: 'Use POST.' });
  }
  const authorization = req.headers.authorization;
  if (!authorization?.startsWith('Bearer ')) return respond(401, { error: 'Sign in to notify discovery services.' });
  const origin = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  if (!origin || !key) return respond(503, { error: 'Discovery notification is unavailable.' });
  try {
    // Verify the token server-side. No service role, Google token, arbitrary URL,
    // or user-supplied request body is used. This endpoint cannot change data.
    const auth = await fetch(new URL('/auth/v1/user', origin), {
      headers: { apikey: key, Authorization: authorization },
      signal: AbortSignal.timeout(10000),
    });
    if ([401, 403].includes(auth.status)) return respond(401, { error: 'Please sign in again.' });
    if (!auth.ok) return respond(503, { error: 'Could not verify your session.' });
    const user = await auth.json();
    if (!user?.id || user.is_anonymous) return respond(401, { error: 'Please sign in again.' });
    await publishDiscovery();
    respond(202, { notified: true, feedUrl: FEED_URL });
  } catch (error) {
    console.error('Discovery notification failed:', error instanceof Error ? error.message : 'unknown error');
    respond(502, { error: 'Notification failed. The game remains published and available in the sitemap.' });
  }
}
