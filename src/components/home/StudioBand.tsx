import { motion } from "framer-motion";
import SectionHeader from "../SectionHeader";
import Reveal from "../Reveal";
import Atmosphere from "../Atmosphere";
import { DUR, EASE, VIEWPORT } from "../../lib/motion";

const VIDEO = "https://www.youtube.com/embed/rECqu6ywMnY";
const CHANNEL = "https://www.youtube.com/@InvincibleGreninjaIsHere";

/**
 * The studio chapter.
 *
 * The frame masks itself open as it arrives, then drifts against its own
 * copy — the same depth trick used in the hero, applied quietly.
 */
export default function StudioBand() {
  return (
    <section className="grain relative isolate overflow-hidden border-t border-white/10">
      <Atmosphere tone="band" />

      <div className="shell relative band">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Video */}
          <motion.div
            initial={{ clipPath: "inset(0 0 100% 0)", opacity: 0 }}
            whileInView={{ clipPath: "inset(0 0 0% 0)", opacity: 1 }}
            viewport={VIEWPORT}
            transition={{ duration: DUR.cinematic + 0.3, ease: EASE.emphasis }}
            className="group relative"
          >
            <span
              aria-hidden="true"
              className="glow-spot -inset-10 -z-10 bg-brand-600/10"
            />
            <div className="edge-lit relative aspect-video overflow-hidden rounded-3xl border border-white/10 bg-ink-900 shadow-panel">
              <iframe
                className="h-full w-full"
                src={VIDEO}
                title="PokéSmith YouTube video"
                allowFullScreen
                loading="lazy"
              />
            </div>
          </motion.div>

          {/* Copy */}
          <div>
            <SectionHeader
              index="04 —"
              eyebrow="On YouTube"
              title="Watch it happen"
              className="[&_h2]:text-3xl [&_h2]:sm:text-4xl"
            />

            <Reveal as="up" delay={0.12}>
              <p className="mt-6 font-display text-lg font-medium text-brand-400">
                @InvincibleGreninjaIsHere
              </p>
              <p className="type-lede mt-4 max-w-md">
                Gameplay, ROM hack walkthroughs, tutorials and more — new videos every week.
              </p>
            </Reveal>

            <Reveal as="up" delay={0.2}>
              <a
                href={CHANNEL}
                target="_blank"
                rel="noreferrer"
                className="btn-hero group mt-8"
              >
                Visit Channel
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 14 14"
                  fill="currentColor"
                  aria-hidden="true"
                  className="transition-transform duration-300 group-hover:translate-x-1"
                >
                  <path d="M4 2.5v9l7-4.5-7-4.5Z" />
                </svg>
              </a>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}