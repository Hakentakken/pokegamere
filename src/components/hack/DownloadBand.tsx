import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import Atmosphere from "../Atmosphere";
import Reveal from "../Reveal";
import DownloadLink from "../DownloadLink";
import SplitHeading from "../SplitHeading";
import { DUR, EASE, stagger } from "../../lib/motion";
import type { DetailHack } from "./DetailHero";

type Props = {
  hack: DetailHack;
  steps: string[];
};

/**
 * The final beat of a game page: how to get playing, and the action itself.
 *
 * The numbered steps draw in one after another down a vertical rail, then the
 * download CTA rises last — the page resolves on the thing you came for.
 */
export default function DownloadBand({ hack, steps }: Props) {
  let source: URL | null = null;
  try {
    const parsed = new URL(hack.download_link || '');
    if (['https:', 'http:'].includes(parsed.protocol)) source = parsed;
  } catch { /* Missing or malformed external URL: don't render an actionable link. */ }
  return (
    <section id="downloads" className="scroll-mt-24 grain relative isolate overflow-hidden border-t border-white/10">
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
              Check the release instructions first. If the release is a patch, it requires
              the specified base-game version. Standalone fan games have their own system
              requirements. Back up your save before updating.
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
                {source
                  ? "The external download page opens in a new tab. Check the publisher, release version and file type there; linked files are not hosted or independently verified by PokéSmith."
                  : "This entry has no download link yet — check back soon or follow the channel for updates."}
              </p>

              {source && <dl className="mt-6 divide-y divide-white/10 border-y border-white/10 text-sm">
                <div className="grid gap-1 py-3 sm:grid-cols-[7rem_1fr]"><dt className="text-neutral-500">Destination</dt><dd className="break-all text-neutral-200">{source.hostname}</dd></div>
                <div className="grid gap-1 py-3 sm:grid-cols-[7rem_1fr]"><dt className="text-neutral-500">File format</dt><dd className="text-neutral-300">Check the external release page. <Link to="/guides#formats" className="link-underline text-brand-400">Understand the formats</Link></dd></div>
              </dl>}

              <div className="mt-8 flex flex-wrap gap-3">
                {source && (
                  <DownloadLink href={source.href} target="_blank" className="btn-hero group">
                    Visit download page ↗
                  </DownloadLink>
                )}
                <Link to="/emulators" className="btn-hero-ghost">
                  Get an emulator
                </Link>
              </div>

              <motion.p
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: DUR.component, delay: 0.5, ease: EASE.out }}
                className="mt-6 font-mono text-[10px] tracking-[0.2em] text-neutral-600 uppercase"
              >
                External release · Opens in a new tab
              </motion.p>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
