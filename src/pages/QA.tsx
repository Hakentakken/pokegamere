import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import faqsData from "../data/faqs";
import PageWrapper from "../components/PageWrapper";
import PageHero from "../components/PageHero";
import CtaBand from "../components/CtaBand";
import { DUR, EASE, stagger } from "../lib/motion";

const CATEGORIES = ["All", "Getting Started", "Patching", "Emulators", "Cheats"];

export default function QA() {
  const [activeId, setActiveId] = useState<number | null>(null);
  const [category, setCategory] = useState("All");
  const reduceMotion = useReducedMotion();

  const toggle = (id: number) => {
    setActiveId(activeId === id ? null : id);
  };

  const filtered = faqsData.filter((faq) =>
    category === "All" ? true : faq.category === category
  );

  return (
    <PageWrapper>
      <PageHero
        eyebrow="Support"
        title="Q&A"
        lede="Getting started, patching, emulators and cheats — everything you need to know."
      >
        {/* Categories */}
        <div className="flex flex-wrap gap-2" role="group" aria-label="FAQ categories">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              aria-pressed={category === cat}
              className={`relative rounded-full px-4 py-2 text-sm font-medium transition-colors duration-300 ${
                category === cat
                  ? "text-white"
                  : "border border-white/10 bg-white/5 text-neutral-300 hover:border-white/25 hover:text-white"
              }`}
            >
              {category === cat && (
                <motion.span
                  layoutId="qa-category-pill"
                  aria-hidden="true"
                  className="absolute inset-0 -z-10 rounded-full bg-brand shadow-glow-sm"
                  transition={{ type: "spring", stiffness: 320, damping: 32 }}
                />
              )}
              {cat}
            </button>
          ))}
        </div>
      </PageHero>

      <div className="shell band-tight">
        <div className="mx-auto max-w-3xl space-y-3">
          <AnimatePresence mode="popLayout" initial={false}>
            {filtered.map((faq, i) => (
              <motion.div
                key={faq.id}
                layout
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: DUR.component, delay: stagger(i, 0.04), ease: EASE.out }}
                className="glass edge-lit relative overflow-hidden rounded-xl transition-[border-color] duration-300 hover:border-white/20"
              >
                <button
                  onClick={() => toggle(faq.id)}
                  aria-expanded={activeId === faq.id}
                  className="flex w-full items-center justify-between gap-4 p-4 text-left font-semibold text-white transition-colors duration-300 hover:text-brand-300"
                >
                  <span>{faq.question}</span>
                  <span
                    aria-hidden="true"
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-base leading-none transition-[transform,border-color,background-color,color] duration-500 ease-cinematic ${
                      activeId === faq.id
                        ? "rotate-45 border-brand/50 bg-brand/15 text-brand-300"
                        : "border-white/15 text-neutral-400"
                    }`}
                  >
                    +
                  </span>
                </button>

                <AnimatePresence initial={false}>
                  {activeId === faq.id && (
                    <motion.div
                      key="answer"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: reduceMotion ? 0 : 0.35, ease: EASE.out }}
                      className="overflow-hidden"
                    >
                      <p className="border-t border-white/10 p-4 text-sm leading-relaxed text-neutral-400">
                        {faq.answer}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      <CtaBand
        eyebrow="Still stuck?"
        title="Watch it done once"
        lede="The channel walks through patching and setup end to end, which answers most follow-up questions."
        primary={{ label: "Visit the channel", to: "https://www.youtube.com/@InvincibleGreninjaIsHere" }}
        secondary={{ label: "Get an emulator", to: "/emulators" }}
      />
    </PageWrapper>
  );
}