import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import SectionHeader from "../SectionHeader";
import Skeleton from "../Skeleton";
import Atmosphere from "../Atmosphere";
import { DUR, EASE, stagger } from "../../lib/motion";

export type Category = { name: string; count: number };

type Props = {
  categories: Category[];
  loading: boolean;
};

/**
 * "Choose your adventure" — the discovery chapter, driven by the base games
 * that actually exist in the catalogue rather than a hard-coded list.
 *
 * Large display type drifts slower than the panels (they are siblings in the
 * same band, not nested layers, so each panel takes its own drift), and the
 * hero-sized background word sits behind everything as pure texture.
 */
export default function CategoryBand({ categories, loading }: Props) {
  const navigate = useNavigate();

  return (
    <section className="relative isolate overflow-hidden border-t border-white/10">
      <Atmosphere tone="band" grid={false} />

      <div className="shell relative band">
        <SectionHeader
          index="02 —"
          eyebrow="By base game"
          title="Choose your adventure"
          lede="Every hack starts life as an existing game. Pick the one you already love and see where it can go."
        />

        {loading ? (
          <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-48 w-full rounded-3xl" />
            ))}
          </div>
        ) : categories.length === 0 ? (
          <div className="panel mt-14 px-6 py-16 text-center">
            <p className="text-neutral-400">No categories yet — check back soon.</p>
          </div>
        ) : (
          <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((category, i) => (
              <motion.button
                key={category.name}
                onClick={() => navigate(`/hacks?base=${encodeURIComponent(category.name)}`)}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "0px 0px -10% 0px" }}
                transition={{ duration: DUR.section, delay: stagger(i, 0.1), ease: EASE.out }}
                className="group edge-lit relative flex min-h-48 flex-col justify-between overflow-hidden rounded-3xl border border-white/10 bg-ink-850/40 p-6 text-left transition-[transform,border-color,background-color] duration-500 ease-cinematic hover:-translate-y-1.5 hover:border-white/20 hover:bg-ink-850/70"
              >
                {/* Oversized ghost numeral behind the label */}
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute -right-3 -bottom-10 font-display text-[7rem] leading-none font-bold text-white/[0.04] transition-transform duration-700 ease-cinematic group-hover:scale-110"
                >
                  {String(i + 1).padStart(2, "0")}
                </span>

                <span className="type-overline text-neutral-500">
                  {category.count} {category.count === 1 ? "entry" : "entries"}
                </span>

                <span className="mt-6 flex items-end justify-between gap-4">
                  <span className="font-display text-2xl leading-tight font-bold text-white transition-colors duration-300 group-hover:text-brand-400">
                    {category.name}
                  </span>
                  <span
                    aria-hidden="true"
                    className="flex h-9 w-9 shrink-0 translate-x-2 items-center justify-center rounded-full border border-white/15 text-white opacity-0 transition-[opacity,transform,background-color] duration-500 ease-cinematic group-hover:translate-x-0 group-hover:border-brand/50 group-hover:bg-brand/20 group-hover:opacity-100"
                  >
                    <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                      <path d="M2 7h10M8.5 3.5 12 7l-3.5 3.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                </span>
              </motion.button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}