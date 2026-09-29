import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import Atmosphere from "./Atmosphere";
import Reveal from "./Reveal";
import SplitHeading from "./SplitHeading";
import { DUR, EASE } from "../lib/motion";

const COLUMNS = [
  {
    title: "Explore",
    links: [
      { to: "/hacks", label: "ROM Hacks" },
      { to: "/cheats", label: "Cheats" },
      { to: "/emulators", label: "Emulators" },
      { to: "/patcher", label: "Patcher" },
    ],
  },
  {
    title: "Info",
    links: [
      { to: "/qa", label: "Q&A" },
      { to: "/about", label: "About" },
      { to: "/contact", label: "Contact" },
      { to: "/privacy", label: "Privacy" },
      { to: "/terms", label: "Terms & Disclaimer" },
    ],
  },
];

/**
 * The end of the experience, not an afterthought.
 *
 * The wordmark scales up out of the dark as the footer enters, the light field
 * drifts behind it, and the link columns rise in behind a hairline — so the page
 * resolves rather than simply stopping.
 */
export default function Footer() {
  return (
    <footer className="grain relative isolate overflow-hidden border-t border-white/10 bg-ink-950">
      <Atmosphere tone="page" grid={false} vignette={false} />

      <div className="shell relative">
        {/* Oversized wordmark, revealed by clipping as the footer arrives */}
        <div className="pointer-events-none pt-16">
          <SplitHeading
            as="p"
            text="PokéSmith"
            className="font-display text-[clamp(3.5rem,15vw,13rem)] leading-[0.85] font-bold tracking-tighter text-white/[0.06] select-none"
          />
        </div>

        <div className="grid gap-10 pt-12 pb-14 md:grid-cols-[1.4fr_1fr_1fr]">
          {/* Brand */}
          <Reveal as="up" index={0}>
            <div>
              <Link to="/" className="group inline-flex items-center gap-2.5" aria-label="PokéSmith home">
                <span className="h-9 w-9 overflow-hidden rounded-full border border-white/15">
                  <img
                    src="/logo.jpeg"
                    alt=""
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                </span>
                <span className="font-display text-xl font-bold tracking-tight text-brand-500">
                  Poké<span className="text-white">Smith</span>
                </span>
              </Link>

              <p className="mt-4 max-w-sm text-sm leading-relaxed text-neutral-500">
                A home for fan-made Pokémon adventures — discover ROM hacks, grab cheats,
                and get emulators in one place.
              </p>

              <a
                href="https://www.youtube.com/@InvincibleGreninjaIsHere"
                target="_blank"
                rel="noreferrer"
                className="group mt-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-neutral-300 transition duration-300 hover:border-brand/50 hover:text-white"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-brand-500 transition-transform duration-500 group-hover:scale-125" aria-hidden="true" />
                @InvincibleGreninjaIsHere
              </a>
            </div>
          </Reveal>

          {/* Link columns */}
          {COLUMNS.map((col, i) => (
            <Reveal as="up" key={col.title} index={i + 1}>
              <nav aria-label={col.title}>
                <h3 className="type-overline text-neutral-500">{col.title}</h3>
                <ul className="mt-4 space-y-2.5">
                  {col.links.map((link) => (
                    <li key={link.to}>
                      <Link
                        to={link.to}
                        className="group inline-flex items-center gap-2 text-sm text-neutral-400 transition-colors duration-300 hover:text-white"
                      >
                        <span
                          aria-hidden="true"
                          className="h-px w-0 bg-brand transition-all duration-500 ease-cinematic group-hover:w-3"
                        />
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            </Reveal>
          ))}
        </div>

        {/* Bottom bar */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: DUR.section, delay: 0.2, ease: EASE.out }}
          className="flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 pb-8 text-center sm:flex-row sm:text-left"
        >
          <p className="font-semibold text-neutral-300">PokéSmith</p>
          <p className="text-xs text-neutral-500">
            This site does not host ROMs. All rights belong to respective owners.
          </p>
          <p className="font-mono text-[11px] tracking-widest text-neutral-600 uppercase">
            © {new Date().getFullYear()}
          </p>
        </motion.div>
      </div>
    </footer>
  );
}