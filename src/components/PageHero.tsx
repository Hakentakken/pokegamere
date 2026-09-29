import type { ReactNode } from "react";
import Atmosphere from "./Atmosphere";
import SplitHeading from "./SplitHeading";
import Reveal from "./Reveal";
import Parallax from "./Parallax";
import { motion } from "framer-motion";
import { DUR, EASE } from "../lib/motion";

type Props = {
  eyebrow: string;
  title: string;
  /** Optional second headline line. */
  sub?: string;
  lede?: ReactNode;
  /** Trailing content (filters, counts, actions). */
  aside?: ReactNode;
  /** Mono chapter marker, e.g. "02". */
  index?: string;
  /** Optional decorative artwork floated behind the copy. */
  art?: ReactNode;
  children?: ReactNode;
};

/**
 * Inner-page hero — the arrival moment for every non-home page.
 *
 * Gives Hacks / Cheats / Emulators / Q&A / About / Privacy / Contact the same
 * cinematic opening (atmosphere → drifting display type → lede) instead of the
 * seven near-identical plain headers the app used to have.
 */
export default function PageHero({
  eyebrow,
  title,
  sub,
  lede,
  aside,
  index,
  art,
  children,
}: Props) {
  return (
    <header className="grain relative isolate overflow-hidden border-b border-white/10">
      <Atmosphere tone="hero" sweep />

      <div className="shell relative">
        <div className="grid items-center gap-10 py-20 sm:py-24 lg:grid-cols-[1.4fr_1fr] lg:py-28">
          <div>
            <motion.span
              initial={{ opacity: 0, x: -18 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: DUR.component, ease: EASE.out }}
              className="eyebrow mb-6"
            >
              <span className="h-px w-10 bg-brand/70" aria-hidden="true" />
              {index && <span className="text-neutral-500">{index}</span>}
              {eyebrow}
              <span className="h-px w-16 bg-white/15" aria-hidden="true" />
            </motion.span>

            <SplitHeading
              as="h1"
              text={title}
              sub={sub}
              className="type-display font-display font-bold text-white"
            />

            {lede && (
              <Reveal as="up" delay={0.22}>
                <p className="type-lede mt-6 max-w-xl">{lede}</p>
              </Reveal>
            )}

            {children && (
              <Reveal as="up" delay={0.32}>
                <div className="mt-9">{children}</div>
              </Reveal>
            )}
          </div>

          {aside && (
            <Parallax distance={18} className="hidden lg:block">
              <Reveal as="right" delay={0.16}>
                {aside}
              </Reveal>
            </Parallax>
          )}
        </div>

        {art && <div className="pointer-events-none absolute inset-0 -z-10 opacity-30">{art}</div>}
      </div>

      {/* Fade into the page body so the hero never ends on a hard edge */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-ink-950 to-transparent"
      />
    </header>
  );
}