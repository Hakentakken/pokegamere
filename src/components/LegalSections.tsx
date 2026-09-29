import type { ReactNode } from "react";
import Reveal from "./Reveal";

export type LegalSection = {
  heading: string;
  body: ReactNode;
};

/**
 * Shared body layout for the plain-language pages (About / Privacy / Terms /
 * Contact) so every one of them reads as part of the same publication.
 *
 * Each section is a left rule that draws in beside the heading, and the whole
 * document is a readable measure rather than full-width paragraphs.
 */
export default function LegalSections({ sections }: { sections: LegalSection[] }) {
  return (
    <div className="mt-14 grid gap-10 lg:grid-cols-[minmax(0,1fr)_16rem] lg:gap-16">
      <div className="max-w-2xl space-y-10">
        {sections.map((section, i) => (
          <Reveal as="left" key={section.heading} index={i}>
            <section className="border-l-2 border-brand/50 pl-5 transition-colors duration-500 hover:border-brand">
              <h2 className="font-display text-xl font-semibold text-white">{section.heading}</h2>
              <div className="mt-2.5 space-y-3 leading-relaxed break-words text-neutral-400">
                {section.body}
              </div>
            </section>
          </Reveal>
        ))}
      </div>

      {/* Quiet contents rail — helps on long documents */}
      <nav aria-label="On this page" className="hidden lg:block">
        <h3 className="type-overline text-neutral-600">On this page</h3>
        <ul className="mt-4 space-y-2.5 border-l border-white/10 pl-4">
          {sections.map((section, i) => (
            <Reveal as="fade" key={section.heading} index={i} step={0.05}>
              <li>
                <span className="text-sm text-neutral-500 transition-colors duration-300 hover:text-neutral-300">
                  {section.heading}
                </span>
              </li>
            </Reveal>
          ))}
        </ul>
      </nav>
    </div>
  );
}