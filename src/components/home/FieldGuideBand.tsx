import { Link } from 'react-router-dom';

const chapters = [
  { number: '01', title: 'Find your kind of adventure', text: 'Compare story progress, changes to the base game and the platform before starting a new save.', anchor: 'choose' },
  { number: '02', title: 'Know what you are downloading', text: 'A patch, a standalone fan game and a patched ROM have different requirements. Check the release format first.', anchor: 'formats' },
  { number: '03', title: 'Keep your progress', text: 'Read update notes, keep a copy of your save and check compatibility before switching versions.', anchor: 'saves' },
];

export default function FieldGuideBand() {
  return <section className="border-y border-white/10 bg-ink-900/30" aria-labelledby="field-guide-heading">
    <div className="shell grid gap-12 py-16 sm:py-24 lg:grid-cols-[0.9fr_1.2fr] lg:gap-20">
      <div>
        <p className="eyebrow">The PokéSmith field guide</p>
        <h2 id="field-guide-heading" className="mt-5 max-w-md font-display text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl">A better adventure starts with a little homework.</h2>
        <p className="type-lede mt-6 max-w-md">Screenshots catch your eye. Release details tell you whether a game fits your time, your device and the way you like to play.</p>
        <Link to="/guides" className="btn-hero-ghost mt-8">Read the player guide <span aria-hidden="true">↗</span></Link>
      </div>
      <div className="divide-y divide-white/10 border-t border-white/10">
        {chapters.map(chapter => <Link key={chapter.number} to={`/guides#${chapter.anchor}`} className="group grid grid-cols-[2rem_1fr_auto] gap-4 py-7 transition-colors hover:bg-white/[0.02] focus-visible:outline focus-visible:outline-brand sm:gap-6">
          <span className="pt-1 font-mono text-xs text-brand-400">{chapter.number}</span>
          <div><h3 className="font-display text-xl font-semibold text-white group-hover:text-brand-400">{chapter.title}</h3><p className="mt-3 max-w-lg text-sm leading-relaxed text-neutral-400">{chapter.text}</p></div>
          <span aria-hidden="true" className="text-xl text-neutral-500 transition-transform group-hover:translate-x-1">↗</span>
        </Link>)}
      </div>
    </div>
  </section>;
}
