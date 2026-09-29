import type { ReactNode } from "react";
import Reveal from "./Reveal";
import SplitHeading from "./SplitHeading";
import { DUR, EASE } from "../lib/motion";
import { motion, useReducedMotion } from "framer-motion";

type Props = {
  eyebrow?: string;
  title: string;
  /** Optional second line of the headline, revealed as its own beat. */
  sub?: string;
  subClassName?: string;
  /** Optional node rendered on the trailing edge (e.g. a "View All" action) */
  action?: ReactNode;
  align?: "left" | "center";
  className?: string;
  delay?: number;
  /** Supporting copy under the headline. */
  lede?: ReactNode;
  /** Mono index marker (e.g. "02 — Discovery") for narrative bands. */
  index?: string;
};

function Rule({ centered, delay }: { centered: boolean; delay: number }) {
  const reduceMotion = useReducedMotion();
  if (reduceMotion) {
    return <div className={`hairline mt-6 ${centered ? "mx-auto w-24" : "w-full"}`} />;
  }
  return (
    <motion.div
      aria-hidden="true"
      className={`hairline mt-6 origin-left ${centered ? "mx-auto w-24" : "w-full"}`}
      initial={{ scaleX: 0, opacity: 0 }}
      whileInView={{ scaleX: 1, opacity: 1 }}
      viewport={{ once: true, margin: "0px 0px -10% 0px" }}
      transition={{ duration: DUR.section + 0.2, delay: delay + 0.12, ease: EASE.out }}
    />
  );
}

/**
 * Editorial section header: mono eyebrow + rule, masked display title,
 * optional lede and trailing action. One shared rhythm for every band so the
 * page reads as chapters rather than a stack of similar blocks.
 */
export default function SectionHeader({
  eyebrow,
  title,
  sub,
  subClassName = "font-display text-lg font-medium text-brand-400 sm:text-xl",
  action,
  align = "left",
  className = "",
  delay = 0,
  lede,
  index,
}: Props) {
  const centered = align === "center";

  return (
    <Reveal delay={delay} className={className} as="fade">
      <div
        className={`flex flex-wrap items-end justify-between gap-x-8 gap-y-6 ${
          centered ? "flex-col items-center text-center" : ""
        }`}
      >
        <div className={centered ? "flex max-w-2xl flex-col items-center" : "min-w-0 max-w-2xl"}>
          {(eyebrow || index) && (
            <span className="eyebrow mb-4">
              <span className="h-px w-8 bg-brand/70" aria-hidden="true" />
              {index && <span className="text-neutral-500">{index}</span>}
              {eyebrow}
              {!centered && <span className="h-px w-16 bg-white/15" aria-hidden="true" />}
            </span>
          )}

          <SplitHeading
            as="h2"
            text={title}
            sub={sub}
            subClassName={subClassName}
            delay={delay + 0.05}
            className="type-display font-display font-bold text-white"
          />

          {lede && <p className="type-lede mt-5 max-w-xl">{lede}</p>}
        </div>

        {action && <div className="shrink-0">{action}</div>}
      </div>

      <Rule centered={centered} delay={delay} />
    </Reveal>
  );
}

/** Small helper for "View all" style trailing actions with directional motion. */
export function HeaderAction({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick?: () => void;
}) {
  return (
    <Reveal as="right" delay={0.12}>
      <button
        onClick={onClick}
        className="group inline-flex items-center gap-2 text-sm font-medium text-neutral-400 transition-colors duration-300 hover:text-white"
      >
        <span className="link-underline">{children}</span>
        <span
          className="transition-transform duration-300 ease-cinematic group-hover:translate-x-1"
          aria-hidden="true"
        >
          →
        </span>
      </button>
    </Reveal>
  );
}