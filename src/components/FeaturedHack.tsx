import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Parallax from "./Parallax";
import Reveal from "./Reveal";
import SplitHeading from "./SplitHeading";
import CoverImage from "./CoverImage";
import { Stars } from "./HackMeta";
import { DUR, EASE, stagger } from "../lib/motion";

export type HackRecord = {
  id: string;
  title: string;
  author: string;
  rating: number;
  baseGame: string;
  platform: string;
  status: string;
  coverImage: string;
  description: string;
};

type Props = {
  hack: HackRecord;
  /** Mono marker, e.g. "01 — Featured". */
  index?: string;
};

const FIELDS = ["Base", "Platform", "Status", "Rating"];

/**
 * The editorial "key art" moment — one hack treated like a game release rather
 * than a list item.
 *
 * The artwork lives in its own depth layer (its own scroll travel plus a little
 * pointer drift on desktop) so the artwork and the copy separate in depth as
 * the section passes.
 */
export default function FeaturedHack({ hack, index = "01 — Featured" }: Props) {
  const navigate = useNavigate();
  const values = [hack.baseGame, hack.platform, hack.status, `${hack.rating || 0} / 5`];

  return (
    <article className="group relative grid items-center gap-10 lg:grid-cols-[1.15fr_1fr] lg:gap-16">
      {/* ARTWORK */}
      <Parallax distance={34} depth={14} className="relative order-1">
        <span aria-hidden="true" className="glow-spot -inset-10 -z-10 bg-brand-600/20 animate-breathe" />

        <motion.div
          initial={{ clipPath: "inset(0 0 100% 0)", opacity: 0 }}
          whileInView={{ clipPath: "inset(0 0 0% 0)", opacity: 1 }}
          viewport={{ once: true, margin: "0px 0px -12% 0px" }}
          transition={{ duration: DUR.cinematic, ease: EASE.emphasis }}
          className="edge-lit relative overflow-hidden rounded-3xl border border-white/10 shadow-panel"
        >
          <CoverImage
            src={hack.coverImage}
            alt={hack.title}
            zoom
            priority
            className="aspect-[4/3] w-full sm:aspect-[16/10]"
            scrimClassName="bg-gradient-to-t from-black/70 via-transparent to-black/20"
          />
          <span className="absolute top-5 left-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-ink-950/70 px-3.5 py-1.5 font-mono text-[10px] tracking-[0.28em] text-white uppercase backdrop-blur">
            <span className="h-1.5 w-1.5 animate-breathe rounded-full bg-brand-400" aria-hidden="true" />
            Featured
          </span>
        </motion.div>
      </Parallax>

      {/* COPY */}
      <div className="relative order-2">
        <Reveal as="left" delay={0.05}>
          <span className="eyebrow mb-5">
            <span className="h-px w-8 bg-brand/70" aria-hidden="true" />
            <span className="text-neutral-500">{index}</span>
            {hack.status || "New release"}
          </span>
        </Reveal>

        <Reveal as="mask" delay={0.1}>
          <SplitHeading
            as="h3"
            text={hack.title}
            className="text-balance font-display text-3xl leading-[1.05] font-bold text-white sm:text-4xl lg:text-5xl"
          />
        </Reveal>

        <Reveal as="up" delay={0.2}>
          <p className="mt-3 font-display text-base text-brand-400">by {hack.author || "Unknown"}</p>
          <p className="type-lede mt-5 max-w-lg">{hack.description || "No description available."}</p>
        </Reveal>

        <Reveal as="up" delay={0.28}>
          <dl className="mt-8 grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-4">
            {FIELDS.map((term, i) => (
              <motion.div
                key={term}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "0px 0px -10% 0px" }}
                transition={{ duration: DUR.component, delay: stagger(i, 0.07), ease: EASE.out }}
              >
                <dt className="type-overline text-neutral-600">{term}</dt>
                <dd className="mt-1.5 font-display text-sm font-medium text-white">{values[i] || "—"}</dd>
              </motion.div>
            ))}
          </dl>
        </Reveal>

        <Reveal as="fade" delay={0.36}>
          <Stars rating={hack.rating} size={15} />
        </Reveal>

        <Reveal as="up" delay={0.42}>
          <div className="mt-8 flex flex-wrap gap-3">
            <button onClick={() => navigate(`/hack/${hack.id}`)} className="btn-hero group">
              View this hack
              <svg width="15" height="15" viewBox="0 0 14 14" fill="none" aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-1">
                <path d="M2 7h10M8.5 3.5 12 7l-3.5 3.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button onClick={() => navigate("/patcher")} className="btn-hero-ghost">
              ROM Patcher
            </button>
          </div>
        </Reveal>
      </div>
    </article>
  );
}