// Local admin utility. Credentials stay in the extension's private storage.
import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import path from 'node:path';

const file = process.env.GSC_CREDENTIALS_PATH || path.join(homedir(), 'AppData/Roaming/Code/User/globalStorage/mercurial.google-search-console-mcp/credentials/adc.json');
async function main() {
  const credentials = JSON.parse(readFileSync(file, 'utf8'));
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST', signal: AbortSignal.timeout(20000),
    body: new URLSearchParams({ client_id: credentials.client_id, client_secret: credentials.client_secret, refresh_token: credentials.refresh_token, grant_type: 'refresh_token' }),
  });
  const token = await response.json();
  if (!response.ok) throw Error(`Google authorization: ${token.error}. Reconnect in the VS Code extension.`);
  const [command = 'sites', site = 'sc-domain:pokesmith.com', arg] = process.argv.slice(2);
  if (command === 'audit') {
    const { auditIndexing } = await import('./audit-indexing.mjs');
    await auditIndexing(token.access_token, site);
    return;
  }
  const base = `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(site)}`;
  let url, body, method = 'GET';
  if (command === 'sites') url = 'https://www.googleapis.com/webmasters/v3/sites';
  else if (command === 'sitemaps') url = `${base}/sitemaps`;
  else if (command === 'inspect' && arg) {
    url = 'https://searchconsole.googleapis.com/v1/urlInspection/index:inspect';
    method = 'POST'; body = { inspectionUrl: arg, siteUrl: site, languageCode: 'en-US' };
  } else if (command === 'submit' && arg) {
    url = `${base}/sitemaps/${encodeURIComponent(arg)}`; method = 'PUT';
  } else if (command === 'performance') {
    url = `${base}/searchAnalytics/query`; method = 'POST';
    const end = new Date(Date.now() - 3 * 86400000), start = new Date(end.getTime() - 27 * 86400000);
    body = { startDate: start.toISOString().slice(0, 10), endDate: end.toISOString().slice(0, 10), dimensions: ['page'], rowLimit: 50 };
  } else throw Error('Usage: node scripts/search-console.mjs sites|sitemaps|performance|inspect|submit|audit [property] [URL]');
  const result = await fetch(url, { method, headers: { Authorization: `Bearer ${token.access_token}`, 'Content-Type': 'application/json' }, body: body && JSON.stringify(body), signal: AbortSignal.timeout(30000) });
  const value = await result.text();
  if (!result.ok) throw Error(`Search Console HTTP ${result.status}: ${value}`);
  console.log(value || JSON.stringify({ ok: true, command }));
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
