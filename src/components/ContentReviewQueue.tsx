import { useState } from 'react';

type Entry = { id: string; title: string; description?: string | null; author?: string | null; platform?: string | null; status?: string | null };
type Props<T extends Entry> = { entries: T[]; onEdit: (entry: T) => void };

/** Editorial triage only: this is not a Google quality score or approval test. */
export default function ContentReviewQueue<T extends Entry>({ entries, onEdit }: Props<T>) {
  const [expanded, setExpanded] = useState(false);
  const descriptions = new Map<string, number>();
  const normalize = (text: string) => text.trim().toLowerCase().replace(/\s+/g, ' ');
  for (const entry of entries) {
    const text = normalize(entry.description || '');
    if (text) descriptions.set(text, (descriptions.get(text) || 0) + 1);
  }
  const queue = entries.map(entry => {
    const text = normalize(entry.description || '');
    const words = text.split(/\s+/).filter(Boolean).length;
    const reasons = [
      !text ? 'Missing description' : words < 100 ? `Brief description (${words} words)` : '',
      (descriptions.get(text) || 0) > 1 ? 'Description reused on another listing' : '',
      !entry.author?.trim() ? 'Missing creator credit' : '',
      !entry.platform?.trim() ? 'Missing platform' : '',
      !entry.status?.trim() ? 'Missing release status' : '',
    ].filter(Boolean);
    return { entry, reasons, words };
  }).filter(row => row.reasons.length).sort((a, b) => b.reasons.length - a.reasons.length || a.words - b.words);

  return <section className="mb-8 rounded-xl border border-white/10 bg-white/[0.03] p-5 sm:p-6" aria-labelledby="content-review-heading">
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div><p className="type-overline text-brand-400">Editorial workbench</p><h2 id="content-review-heading" className="mt-2 font-display text-xl font-semibold text-white">{queue.length} listings to review</h2></div>
      {!!queue.length && <button className="btn-ghost" onClick={() => setExpanded(!expanded)} aria-expanded={expanded} aria-controls="content-review-list">{expanded ? 'Show fewer' : 'Show all listings'}</button>}
    </div>
    <p className="mt-3 max-w-3xl text-sm leading-relaxed text-neutral-400">Start with missing or repeated information. For short descriptions, check whether the reader can understand the setting, what changes, release progress and known limitations. Add source-checked detail in your own words; do not pad the page to reach a word count.</p>
    <p className="mt-2 text-xs leading-relaxed text-neutral-500">The 100-word flag is a local review aid, not an AdSense requirement. Passing these checks does not verify originality, file permissions, or approval.</p>
    <ul id="content-review-list" className="mt-5 divide-y divide-white/10">
      {(expanded ? queue : queue.slice(0, 5)).map(({ entry, reasons }) => <li key={entry.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0"><h3 className="font-semibold text-neutral-200">{entry.title || 'Untitled listing'}</h3><p className="mt-1 text-sm text-neutral-400">{reasons.join(' · ')}</p></div>
        <button onClick={() => onEdit(entry)} className="btn-ghost shrink-0 self-start" aria-label={`Edit ${entry.title || 'untitled listing'}`}>Improve listing</button>
      </li>)}
    </ul>
    {!queue.length && <p className="mt-3 text-sm text-neutral-400">No automated flags. Continue checking the accuracy, originality and sources of each release.</p>}
  </section>;
}
