import { useNavigate } from "react-router-dom";
import Atmosphere from "./Atmosphere";
import SplitHeading from "./SplitHeading";
import Reveal from "./Reveal";
import { motion } from "framer-motion";
import { EASE } from "../lib/motion";

type Props = {
  eyebrow?: string;
  title?: string;
  lede?: string;
  primary?: { label: string; to: string };
  secondary?: { label: string; to: string };
};

/** Destination that leaves the app (channel links, docs, …). */
function isExternal(to: string) {
  return /^https?:\/\//i.test(to);
}

/**
 * The closing beat before the footer.
 *
 * The background light sweeps in from the side while the type settles, so the
 * page ends on a deliberate crescendo instead of trailing off into a link list.
 */
export default function CtaBand({
  eyebrow = "Your adventure starts here",
  title = "Ready to play something new?",
  lede = "Browse the library, grab a patch, and get your emulator running in minutes.",
  primary = { label: "Browse ROM Hacks", to: "/hacks" },
  secondary = { label: "Need a hand?", to: "/qa" },
}: Props) {
  const navigate = useNavigate();

  return (
    <section className="grain relative isolate overflow-hidden border-t border-white/10">
      <Atmosphere tone="hero" grid={false} sweep />

      {/* Light that travels across the band as it enters */}
      <motion.div
        aria-hidden="true"
        initial={{ x: "-60%", opacity: 0 }}
        whileInView={{ x: "60%", opacity: 1 }}
        viewport={{ once: true, margin: "0px 0px -20% 0px" }}
        transition={{ duration: 2.2, ease: EASE.inOut }}
        className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-white/[0.07] to-transparent blur-2xl"
      />

      <div className="shell relative py-24 text-center sm:py-28">
        <Reveal as="fade">
          <span className="eyebrow justify-center">
            <span className="h-px w-8 bg-brand/70" aria-hidden="true" />
            {eyebrow}
            <span className="h-px w-8 bg-brand/70" aria-hidden="true" />
          </span>
        </Reveal>

        <SplitHeading
          as="h2"
          text={title}
          className="type-display mx-auto mt-7 max-w-3xl font-display font-bold text-balance text-white"
        />

        <Reveal as="up" delay={0.2}>
          <p className="type-lede mx-auto mt-6 max-w-xl">{lede}</p>
        </Reveal>

        <Reveal as="up" delay={0.3}>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            {isExternal(primary.to) ? (
              <a
                href={primary.to}
                target="_blank"
                rel="noreferrer"
                className="btn-hero group"
              >
                {primary.label}
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 14 14"
                  fill="none"
                  aria-hidden="true"
                  className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                >
                  <path d="M5 9 9 5M6 5h3v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M9.5 2.5h2v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </a>
            ) : (
              <button onClick={() => navigate(primary.to)} className="btn-hero group">
                {primary.label}
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
            )}

            {isExternal(secondary.to) ? (
              <a href={secondary.to} target="_blank" rel="noreferrer" className="btn-hero-ghost">
                {secondary.label}
              </a>
            ) : (
              <button onClick={() => navigate(secondary.to)} className="btn-hero-ghost">
                {secondary.label}
              </button>
            )}
          </div>
        </Reveal>
      </div>
    </section>
  );
}