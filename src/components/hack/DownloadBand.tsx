import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Atmosphere from "../Atmosphere";
import Reveal from "../Reveal";
import SplitHeading from "../SplitHeading";
import { DUR, EASE, stagger } from "../../lib/motion";
import type { DetailHack } from "./DetailHero";

type Props = {
  hack: DetailHack;
  downloading: boolean;
  steps: string[];
  onDownload: () => void;
};

/**
 * The final beat of a game page: how to get playing, and the action itself.
 *
 * The numbered steps draw in one after another down a vertical rail, then the
 * download CTA rises last — the page resolves on the thing you came for.
 */
export default function DownloadBand({ hack, downloading, steps, onDownload }: Props) {
  const navigate = useNavigate();

  return (
    <section className="grain relative isolate overflow-hidden border-t border-white/10">
      <Atmosphere tone="hero" grid={false} />

      <div className="shell relative band">
        <div className="grid gap-12 lg:grid-cols-[1fr_1fr] lg:gap-16">
          <div>
            <SplitHeading
              as="h2"
              text="How to play"
              className="type-display font-display font-bold text-white"
            />
            <p className="type-lede mt-4 max-w-md">
              Four steps, then you are in. Keep your own legally obtained copy of the base
              game — a patch is just a diff applied to it.
            </p>

            <ol className="relative mt-9 space-y-6">
              {/* Rail behind the numerals */}
              <span
                aria-hidden="true"
                className="absolute top-3 bottom-3 left-[15px] w-px bg-gradient-to-b from-brand/60 via-white/10 to-transparent"
              />
              {steps.map((step, i) => (
                <motion.li
                  key={step}
                  initial={{ opacity: 0, x: -18 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "0px 0px -10% 0px" }}
                  transition={{ duration: DUR.component, delay: stagger(i, 0.12), ease: EASE.out }}
                  className="relative flex items-center gap-4"
                >
                  <span className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-ink-900 font-mono text-[11px] text-brand-400">
                    {i + 1}
                  </span>
                  <span className="text-neutral-300">{step}</span>
                </motion.li>
              ))}
            </ol>
          </div>

          {/* Action */}
          <Reveal as="right" delay={0.2}>
            <div className="glass flex h-full flex-col justify-center rounded-3xl p-8 sm:p-10">
              <span className="eyebrow">
                <span className="h-px w-8 bg-brand/70" aria-hidden="true" />
                Ready when you are
              </span>

              <h3 className="type-display mt-6 font-display font-bold text-balance text-white">
                Take {hack.title} with you
              </h3>

              <p className="mt-4 leading-relaxed text-neutral-400">
                {hack.download_link
                  ? "The patch opens in a new tab. Apply it to your own copy of the base game, then load the result in any emulator."
                  : "This entry has no download link yet — check back soon or follow the channel for updates."}
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                {hack.download_link && (
                  <button onClick={onDownload} className="btn-hero group">
                    {downloading ? "Preparing Download..." : "Download ROM / Patch"}
                  </button>
                )}
                <button onClick={() => navigate("/emulators")} className="btn-hero-ghost">
                  Get an emulator
                </button>
              </div>

              <motion.p
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: DUR.component, delay: 0.5, ease: EASE.out }}
                className="mt-6 font-mono text-[10px] tracking-[0.2em] text-neutral-600 uppercase"
              >
                Opens in a new tab · Nothing is hosted on this site
              </motion.p>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}