import { useState } from "react";
import faqs from "../data/faqs";
import PageWrapper from "../components/PageWrapper";
import PageHero from "../components/PageHero";
import CtaBand from "../components/CtaBand";
import { useSeo } from "../lib/seo";

const CATEGORIES = ["All", "Getting Started", "Patching", "Emulators", "Cheats"];
export default function QA() {
  const [category, setCategory] = useState("All");
  useSeo({ title: "Game setup, patching & save-file questions", description: "Practical help with choosing a ROM hack, checking patch compatibility, preserving saves and using cheat codes carefully.", canonicalPath: "/qa" });
  return <PageWrapper>
    <PageHero eyebrow="Player handbook" title="Before you start playing" lede="Choose a release, check compatibility and protect your progress. These are the details to get right before starting a new adventure.">
      <div className="flex flex-wrap gap-2" role="group" aria-label="FAQ categories">
        {CATEGORIES.map(item => <button key={item} onClick={() => setCategory(item)} aria-pressed={category === item} className={`rounded-full border px-4 py-2 text-sm ${category === item ? 'border-brand bg-brand text-white' : 'border-white/10 text-neutral-300 hover:border-white/30'}`}>{item}</button>)}
      </div>
    </PageHero>
    <section className="shell band-tight" aria-label="Questions and answers">
      <div className="mx-auto max-w-3xl space-y-3">
        {faqs.filter(item => category === 'All' || item.category === category).map(item => <details key={item.id} open={item.id === 1} className="group rounded-xl border border-white/10 bg-white/[0.03]">
          <summary className="cursor-pointer p-5 font-display font-semibold text-white focus-visible:outline focus-visible:outline-brand">{item.question}</summary>
          <p className="border-t border-white/10 p-5 leading-relaxed text-neutral-400">{item.answer}</p>
        </details>)}
      </div>
    </section>
    <CtaBand eyebrow="Need a hand?" title="Ask about your setup" lede="Send the game title, release version and device details so we can understand the problem." primary={{ label: "Contact PokeSmith", to: "/contact" }} secondary={{ label: "Browse games", to: "/hacks" }} />
  </PageWrapper>;
}
