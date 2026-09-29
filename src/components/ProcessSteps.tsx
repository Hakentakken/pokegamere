import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { DUR, EASE, stagger } from "../lib/motion";

export type Step = {
  title: string;
  body: string;
  to: string;
  action: string;
};

/**
 * Three-beat process rail — the "how do I actually play this?" chapter.
 *
 * Steps enter from alternating sides along a hairline that draws in behind
 * them, so the section reads as a path rather than three identical boxes.
 */
export default function ProcessSteps({ steps }: { steps: Step[] }) {
  return (
    <ol className="relative mt-14 grid gap-8 sm:gap-10 lg:grid-cols-3">
      {/* Connecting hairline — desktop only, sits behind the numerals */}
      <span
        aria-hidden="true"
        className="hairline absolute top-7 right-[16%] left-[16%] hidden lg:block"
      />

      {steps.map((step, i) => (
        <motion.li
          key={step.title}
          initial={{ opacity: 0, y: 26 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "0px 0px -10% 0px" }}
          transition={{ duration: DUR.section, delay: stagger(i, 0.12), ease: EASE.out }}
          className="group relative flex gap-5 lg:block"
        >
            <span
              aria-hidden="true"
              className="relative z-10 flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-white/10 bg-ink-900 font-mono text-sm text-brand-400 shadow-panel transition-[border-color,transform] duration-500 ease-cinematic group-hover:scale-110 group-hover:border-brand/50"
            >
              {String(i + 1).padStart(2, "0")}
            </span>

            <div className="min-w-0 lg:mt-7">
              <h3 className="font-display text-lg font-bold text-white">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-neutral-400">{step.body}</p>
              <Link
                to={step.to}
                className="link-underline mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-brand-400 transition-colors duration-300 hover:text-brand-300"
              >
                {step.action}
                <span
                  aria-hidden="true"
                  className="transition-transform duration-300 group-hover:translate-x-1"
                >
                  →
                </span>
              </Link>
            </div>
        </motion.li>
      ))}
    </ol>
  );
}