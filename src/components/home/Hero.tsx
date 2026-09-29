import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import Atmosphere from "../Atmosphere";
import HeroArt from "./HeroArt";
import HeroCopy from "./HeroCopy";

type Props = {
  /** Normalised cover URLs for the collage. */
  covers: string[];
  /** Live counts, when available. */
  stats?: { hacks: number; cheats: number; emulators: number } | null;
};

/**
 * The arrival.
 *
 * Layers, back to front: atmosphere (continuous drift) → artwork (masked,
 * staggered by depth) → legibility scrims → typography and UI. On scroll the
 * copy rises and dissolves faster than the artwork, so the two planes separate
 * as you leave the section.
 */
export default function Hero({ covers, stats }: Props) {
  const sectionRef = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });

  const copyY = useTransform(scrollYProgress, [0, 1], ["0%", reduced ? "0%" : "26%"]);
  const copyFade = useTransform(scrollYProgress, [0, 0.85], [1, 0]);

  return (
    <section
      ref={sectionRef}
      className="grain relative isolate flex min-h-[92svh] items-center overflow-hidden py-28"
    >
      <Atmosphere tone="hero" sweep />

      <HeroArt covers={covers} />

      {/* Legibility scrims */}
      <div
        aria-hidden="true"
        className="absolute inset-0 z-[2] bg-gradient-to-r from-ink-950 via-ink-950/85 to-transparent"
      />
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 z-[2] h-40 bg-gradient-to-t from-ink-950 to-transparent"
      />

      <motion.div
        style={reduced ? undefined : { y: copyY, opacity: copyFade }}
        className="shell relative z-10 w-full"
      >
        <HeroCopy stats={stats} />
      </motion.div>

      {/* Scroll cue */}
      {!reduced && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4, duration: 0.8 }}
          className="absolute bottom-8 left-1/2 z-10 hidden -translate-x-1/2 flex-col items-center gap-2 md:flex"
          aria-hidden="true"
        >
          <span className="font-mono text-[10px] tracking-[0.3em] text-neutral-500 uppercase">
            Scroll
          </span>
          <span className="relative block h-10 w-px overflow-hidden bg-white/10">
            <motion.span
              className="absolute top-0 left-0 block h-4 w-px bg-brand-400"
              animate={{ y: ["-100%", "250%"] }}
              transition={{ duration: 1.9, repeat: Infinity, ease: "easeInOut" }}
            />
          </span>
        </motion.div>
      )}

      {/* Touch devices get a shorter, cue-free hero so the fold is never crowded */}
    </section>
  );
}