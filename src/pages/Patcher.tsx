import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import PageWrapper from "../components/PageWrapper";
import Atmosphere from "../components/Atmosphere";
import SplitHeading from "../components/SplitHeading";
import Reveal from "../components/Reveal";
import { DUR, EASE, stagger } from "../lib/motion";

const STAGES = [
  { label: "Drag in your legally obtained base ROM", done: true },
  { label: "Drop the patch on top", done: true },
  { label: "Apply, then load the result in an emulator", done: false },
];

/**
 * The patcher is still in the oven — this page says so honestly, and explains
 * what it will do so the wait has a shape.
 */
export default function Patcher() {
  const navigate = useNavigate();

  return (
    <PageWrapper>
      <section className="grain relative isolate flex min-h-[80svh] items-center overflow-hidden">
        <Atmosphere tone="hero" sweep />

        <div className="shell relative py-28 text-center">
          <motion.span
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: DUR.component, ease: EASE.out }}
            className="eyebrow mx-auto"
          >
            <span className="h-px w-8 bg-brand/70" aria-hidden="true" />
            Under construction
            <span className="h-px w-8 bg-brand/70" aria-hidden="true" />
          </motion.span>

          <SplitHeading
            as="h1"
            text="ROM Patcher"
            sub="Almost ready"
            subClassName="font-display text-xl font-medium text-brand-400 sm:text-2xl"
            className="type-display mt-8 font-display font-bold text-white"
          />

          <Reveal as="up" delay={0.3}>
            <p className="type-lede mx-auto mt-6 max-w-xl">
              Patch a ROM in your browser, with nothing uploaded anywhere. It is being finished
              now — in the meantime, the Q&A walks through patching by hand.
            </p>
          </Reveal>

          {/* What it will do */}
          <Reveal as="up" delay={0.4}>
            <ol className="mx-auto mt-12 grid max-w-3xl gap-3 text-left sm:grid-cols-3">
              {STAGES.map((stage, i) => (
                <motion.li
                  key={stage.label}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: DUR.component, delay: 0.5 + stagger(i, 0.12), ease: EASE.out }}
                  className="glass rounded-2xl p-5"
                >
                  <span className="type-overline text-neutral-600">Step {i + 1}</span>
                  <p className="mt-2 text-sm leading-relaxed text-neutral-300">{stage.label}</p>
                </motion.li>
              ))}
            </ol>
          </Reveal>

          <Reveal as="up" delay={0.7}>
            <div className="mt-12 flex flex-wrap justify-center gap-3">
              <button onClick={() => navigate("/qa")} className="btn-hero">
                How to patch by hand
              </button>
              <button onClick={() => navigate("/hacks")} className="btn-hero-ghost">
                Browse hacks
              </button>
            </div>
          </Reveal>
        </div>
      </section>
    </PageWrapper>
  );
}