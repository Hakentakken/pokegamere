export async function notifyDiscovery(accessToken: string | undefined): Promise<string> {
  try {
    if (!accessToken) throw new Error('No session');
    const response = await fetch('/api/notify-discovery', {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
      signal: AbortSignal.timeout(25000),
    });
    if (!response.ok || !(await response.json()).notified) throw new Error('Notification not accepted');
    return 'Game saved. Discovery notification sent. Google decides when to crawl and index it.';
  } catch {
    // A notification failure must never turn a successful save into an upload
    // failure (which could encourage the editor to create a duplicate game).
    return 'Game saved. Discovery notification could not be sent; the automatic sitemap still includes your game. You do not need to upload it again.';
  }
}
