type Props = { title: string; description: string; author: string; baseGame: string; platform: string; features: string[] };
export default function PublishingChecklist({ title, description, author, baseGame, platform, features }: Props) {
  const words = description.trim().split(/\s+/).filter(Boolean).length;
  return <aside className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-neutral-400">
    <h3 className="font-semibold text-white">Before publishing</h3>
    <p className="mt-2">Use a clear game title and an original description: explain the setting, the changes from the base game, release progress and any known limitations. Credit the creator and check the download source. State whether the release is a patch, a standalone game or a patched ROM. Check redistribution permissions for the actual file, including any original game data it contains.</p>
    <p className="mt-2">Description: {words} words. There is no Google word-count requirement; useful, accurate detail matters more than length.</p>
    <ul className="mt-2 list-disc space-y-1 pl-5">
      <li>{title.trim() ? 'Game title entered' : 'Add the game title'}</li>
      <li>{author.trim() && baseGame.trim() && platform.trim() ? 'Creator, base game and platform entered' : 'Add the creator, base game and platform'}</li>
      <li>{features.some(f => f.trim()) ? 'Feature list entered — verify it against the release' : 'Add specific, verified features'}</li>
    </ul>
    <p className="mt-3">After publishing, the live sitemap and page HTML update automatically within the cache window (up to five minutes). Google chooses when to crawl and index the page. Keep the title stable after publication to preserve its URL.</p>
  </aside>;
}
