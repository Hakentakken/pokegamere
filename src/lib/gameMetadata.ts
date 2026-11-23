import type { PublicHack } from './catalogue';
import { normalizeImageUrl } from './imageUrl';
import { SITE_URL, type SeoOptions } from './seo';

const httpUrl = (value: string | null | undefined) => {
  try {
    const url = new URL(value || '');
    return ['https:', 'http:'].includes(url.protocol) ? url.href : undefined;
  } catch { return undefined; }
};

/** Metadata comes from the same record shown to readers; never infer versions,
 * release dates, ratings or file formats from a download host. */
export function gameMetadata(game: PublicHack, slug: string | null): SeoOptions {
  const platform = game.platform?.match(/\b(GBA|GBC|NDS|GB)\b/i)?.[1].toUpperCase();
  const titlePlatform = platform && !new RegExp(`\\b${platform}\\b`, 'i').test(game.title) ? ` (${platform})` : '';
  const description = (game.description || '').replace(/\s+/g, ' ').trim();
  const short = description.slice(0, 157);
  const summary = description.length <= 160 ? description : `${short.slice(0, short.lastIndexOf(' ') > 0 ? short.lastIndexOf(' ') : short.length)}…`;
  const canonicalPath = slug ? `/hacks/${slug}` : undefined;
  const url = canonicalPath ? `${SITE_URL}${canonicalPath}` : undefined;
  const image = httpUrl(normalizeImageUrl(game.cover_image));
  return {
    title: `${game.title}${titlePlatform} — ${httpUrl(game.download_link) ? 'Download & Details' : 'Game Details'}`,
    description: summary || undefined,
    canonicalPath,
    image,
    imageAlt: image ? `${game.title} cover artwork` : undefined,
    jsonLd: [
      {
        '@context': 'https://schema.org', '@type': 'VideoGame',
        name: game.title,
        author: game.author ? { '@type': 'Person', name: game.author } : undefined,
        description: game.description || undefined,
        gamePlatform: game.platform || undefined,
        url, image,
      },
      ...(url ? [{
        '@context': 'https://schema.org', '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/` },
          { '@type': 'ListItem', position: 2, name: 'Hacks', item: `${SITE_URL}/hacks` },
          { '@type': 'ListItem', position: 3, name: game.title, item: url },
        ],
      }] : []),
    ],
  };
}
