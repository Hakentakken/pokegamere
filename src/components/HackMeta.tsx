/**
 * Shared metadata atoms for a game record — used by the card, the featured
 * moment and the detail page so a hack's identity always looks the same.
 */

export function Stars({ rating, size = 13 }: { rating: number; size?: number }) {
  const stars = Math.round(rating || 0);
  return (
    <div className="flex items-center gap-0.5 text-gold-400" aria-label={`Rating ${rating || 0} out of 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <svg key={n} width={size} height={size} viewBox="0 0 24 24" fill={n <= stars ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
          <path d="M12 3.6l2.6 5.3 5.8.8-4.2 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.2-4.1 5.8-.8L12 3.6z" />
        </svg>
      ))}
      <span className="ml-1.5 text-xs text-neutral-500">({rating || 0})</span>
    </div>
  );
}

export function MetaChips({ baseGame, platform }: { baseGame: string; platform: string }) {
  return (
    <div className="flex flex-wrap gap-2 text-xs">
      {baseGame && <span className="rounded-full border border-brand/30 bg-brand/10 px-3 py-1 font-medium text-brand-300">{baseGame}</span>}
      {platform && <span className="rounded-full border border-sky-400/25 bg-sky-400/10 px-3 py-1 font-medium text-sky-300">{platform}</span>}
    </div>
  );
}

/** Term / value row used in editorial metadata rails. */
export function MetaRow({ term, value }: { term: string; value: string }) {
  return (
    <div>
      <dt className="type-overline text-neutral-600">{term}</dt>
      <dd className="mt-1.5 font-display text-sm font-medium text-white">{value}</dd>
    </div>
  );
}