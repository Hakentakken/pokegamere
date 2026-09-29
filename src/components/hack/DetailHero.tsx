import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import Atmosphere from "../Atmosphere";
import CoverImage from "../CoverImage";
import Parallax from "../Parallax";
import Reveal from "../Reveal";
import SplitHeading from "../SplitHeading";
import { MetaChips, Stars } from "../HackMeta";
import { DUR, EASE, stagger } from "../../lib/motion";

/** The fields of a `hacks` row this page renders. */
export type DetailHack = {
  title: string;
  author?: string;
  rating?: number;
  base_game?: string;
  platform?: string;
  status?: string;
  cover_image?: string;
  description?: string;
  download_link?: string;
};

type Props = {
  hack: DetailHack;
  downloading: boolean;
  onDownload: () => void;
};

/**
 * Key art for a single game.
 *
 * The cover fills the frame and drifts behind the title, so the page opens like
 * a release splash rather than a record row. The download action lives here —
 * first and last, the way a store page would.
 */
export default function DetailHero({ hack, downloading, onDownload }: Props) {
  const fields = [
    { term: "Base game", value: hack.base_game || "—" },
    { term: "Platform", value: hack.platform || "—" },
    { term: "Status", value: hack.status || "—" },
    { term: "Rating", value: `${hack.rating || 0} / 5` },
  ];

  return (
    <header className="grain relative isolate overflow-hidden">
      <Atmosphere tone="hero" grid={false} />

      {/* Key art */}
      <Parallax distance={40} className="absolute inset-0 -z-10">
        <CoverImage
          src={hack.cover_image || ""}
          alt=""
          priority
          zoom={false}
          position="center 30%"
          className="h-[120%] w-full"
          imgClassName="keyart opacity-45 saturate-[0.8]"
        />
      </Parallax>
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-gradient-to-t from-ink-950 via-ink-950/80 to-ink-950/50"
      />

      <div className="shell relative pt-28 pb-16 sm:pt-32">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: DUR.component, delay: 0.1, ease: EASE.out }}
        >
          <Link
            to="/hacks"
            className="link-underline inline-flex items-center gap-2 font-mono text-[11px] tracking-[0.25em] text-neutral-400 uppercase transition-colors duration-300 hover:text-white"
          >
            <span aria-hidden="true">←</span> All hacks
          </Link>
        </motion.div>

        <div className="mt-8 grid gap-10 lg:grid-cols-[1.25fr_1fr] lg:items-end lg:gap-16">
          <div>
            <Reveal as="left" delay={0.12}>
              <span className="eyebrow">
                <span className="h-px w-8 bg-brand/70" aria-hidden="true" />
                {hack.status || "ROM hack"}
              </span>
            </Reveal>

            <Reveal as="mask" delay={0.16}>
              <SplitHeading
                as="h1"
                text={hack.title}
                className="type-display mt-6 font-display font-bold text-white"
              />
            </Reveal>

            <Reveal as="up" delay={0.26}>
              <p className="mt-4 font-display text-lg text-brand-400">
                by {hack.author || "Unknown"}
              </p>
              <div className="mt-6">
                <MetaChips baseGame={hack.base_game || ""} platform={hack.platform || ""} />
              </div>
              <div className="mt-5">
                <Stars rating={hack.rating || 0} size={16} />
              </div>
            </Reveal>
          </div>

          {/* Facts + primary action */}
          <Reveal as="right" delay={0.3}>
            <div className="glass rounded-2xl p-6">
              <dl className="grid grid-cols-2 gap-x-6 gap-y-5">
                {fields.map((row, i) => (
                  <motion.div
                    key={row.term}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: DUR.component, delay: 0.35 + stagger(i, 0.07), ease: EASE.out }}
                  >
                    <dt className="type-overline text-neutral-600">{row.term}</dt>
                    <dd className="mt-1.5 font-display text-sm font-medium text-white">{row.value}</dd>
                  </motion.div>
                ))}
              </dl>

              <div className="mt-7">
                {hack.download_link ? (
                  <button onClick={onDownload} className="btn-hero w-full group">
                    {downloading ? "Preparing Download..." : "Download ROM / Patch"}
                    {!downloading && (
                      <svg width="15" height="15" viewBox="0 0 14 14" fill="none" aria-hidden="true" className="transition-transform duration-300 group-hover:translate-y-0.5">
                        <path d="M7 1.5v9M3.5 7 7 10.5 10.5 7M2 12.5h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </button>
                ) : (
                  <p className="rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-neutral-400">
                    🚧 No download link
                  </p>
                )}

                <Link
                  to="/patcher"
                  className="btn-hero-ghost mt-3 w-full"
                >
                  Open ROM Patcher
                </Link>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </header>
  );
}