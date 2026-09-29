import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useReducedMotion } from "framer-motion";
import { EASE } from "../../lib/motion";

type Stats = { hacks: number; cheats: number; emulators: number } | null | undefined;

const STAT_LABELS: { key: keyof NonNullable<Stats>; label: string }[] = [
  { key: "hacks", label: "ROM hacks" },
  { key: "cheats", label: "Cheat codes" },
  { key: "emulators", label: "Emulators" },
];

/**
 * The hero's typographic sequence.
 *
 * Each beat waits for the one before it — eyebrow, wordmark, supporting line,
 * copy, actions, live counts — so the headline lands before anything competes
 * with it. Skipped entirely under reduced motion.
 */
export default function HeroCopy({ stats }: { stats?: Stats }) {
  const navigate = useNavigate();
  const reduced = useReducedMotion();
  const from = (delay: number, distance = 18) =>
    reduced
      ? {}
      : {
          initial: { opacity: 0, y: distance },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.8, delay, ease: EASE.out },
        };

  return (
    <div className="max-w-2xl">
      <motion.p {...from(0.1, 0)} className="eyebrow flex items-center gap-3">
        <span className="h-px w-10 bg-brand/70" aria-hidden="true" />
        Fan-made Pokémon adventures
      </motion.p>

      <h1 aria-label="PokéSmith" className="type-hero mt-7 font-display font-bold">
        <span className="sr-only">PokéSmith</span>
        <span aria-hidden="true" className="inline">
          {[
            { word: "Poké", tone: "text-brand-500", delay: 0.25 },
            { word: "Smith", tone: "text-white", delay: 0.4 },
          ].map((part) => (
            <span
              key={part.word}
              className="-mb-[0.12em] inline-block overflow-hidden pb-[0.12em] align-bottom"
            >
              <motion.span
                className={`inline-block ${part.tone}`}
                initial={reduced ? false : { y: "112%" }}
                animate={{ y: "0%" }}
                transition={{ duration: 1.2, delay: part.delay, ease: EASE.emphasis }}
              >
                {part.word}
              </motion.span>
            </span>
          ))}
        </span>
      </h1>

      <motion.p
        {...from(0.55)}
        className="mt-6 font-display text-xl text-neutral-300 sm:text-2xl"
      >
        Discover Amazing Pokémon ROM Hacks
      </motion.p>

      <motion.p
        {...from(0.7)}
        className="mt-4 max-w-xl text-[15px] leading-relaxed text-neutral-400 text-balance sm:text-base"
      >
        Explore fan-made Pokémon adventures, download patches, cheats, and emulators — all in
        one place.
      </motion.p>

      <motion.div {...from(0.85)} className="mt-9 flex flex-wrap gap-3">
        <button onClick={() => navigate("/hacks")} className="btn-hero group">
          Browse ROM Hacks
          <svg
            width="15"
            height="15"
            viewBox="0 0 14 14"
            fill="none"
            aria-hidden="true"
            className="transition-transform duration-300 group-hover:translate-x-1"
          >
            <path
              d="M2 7h10M8.5 3.5 12 7l-3.5 3.5"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <button onClick={() => navigate("/patcher")} className="btn-hero-ghost">
          ROM Patcher
        </button>
      </motion.div>

      {stats && (
        <motion.dl
          {...from(1, 14)}
          className="mt-12 flex flex-wrap gap-x-10 gap-y-4 border-t border-white/10 pt-6"
        >
          {STAT_LABELS.map(({ key, label }) => (
            <div key={key}>
              <dt className="type-overline text-neutral-600">{label}</dt>
              <dd className="mt-1 font-display text-2xl font-bold text-white">
                {String(stats[key] ?? 0).padStart(2, "0")}
              </dd>
            </div>
          ))}
        </motion.dl>
      )}
    </div>
  );
}