import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import Atmosphere from "../Atmosphere";
import CoverImage from "../CoverImage";
import Parallax from "../Parallax";
import Reveal from "../Reveal";
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
};

/**
 * Key art for a single game.
 *
 * The cover fills the frame and drifts behind the title, so the page opens like
 * a release splash rather than a record row. Section links help readers find
 * screenshots, the overview and the download information below.
 */
export default function DetailHero({ hack }: Props) {
  const description = hack.description?.replace(/\s+/g, ' ').trim() || '';
  const summary = description.length > 260 ? `${description.slice(0, 260).replace(/\s+\S*$/, '')}…` : description;
  const fields = [
    { term: "Base game", value: hack.base_game || "—" },
    { term: "Platform", value: hack.platform || "—" },
    { term: "Status", value: hack.status || "—" },
    { term: "Catalogue rating", value: `${hack.rating || 0} / 5` },
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
          <div className="min-w-0">
            <Reveal as="left" delay={0.12}>
              <span className="eyebrow">
                <span className="h-px w-8 bg-brand/70" aria-hidden="true" />
                {hack.status || "ROM hack"}
              </span>
            </Reveal>

            {/* Essential identity stays visible without scroll observers or JS.
                Observing translated words inside overflow masks can leave them
                permanently outside the observer's visible intersection. */}
            <h1 className="type-display mt-6 font-display font-bold text-white [overflow-wrap:anywhere]">
              {hack.title}
            </h1>

            <Reveal as="up" delay={0.26}>
              <p className="mt-4 font-display text-lg text-brand-400">
                by {hack.author || "Unknown"}
              </p>
              {summary && <div className="mt-5 max-w-2xl">
                <p className="text-base leading-relaxed text-neutral-300">{summary}</p>
                <a href="#overview" className="link-underline mt-2 inline-block text-sm text-brand-400">Read the full overview</a>
              </div>}
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

              <nav aria-label="On this page" className="mt-7 flex flex-wrap gap-3 text-sm">
                <a href="#screenshots" className="btn-hero-ghost">Screenshots</a>
                <a href="#overview" className="btn-hero-ghost">Overview</a>
                <a href="#downloads" className="link-underline self-center text-neutral-300">Setup &amp; download</a>
              </nav>
            </div>
          </Reveal>
        </div>
      </div>
    </header>
  );
}
