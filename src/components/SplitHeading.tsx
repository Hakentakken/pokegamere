import { motion, useReducedMotion } from "framer-motion";
import { DUR, EASE, STEP, VIEWPORT } from "../lib/motion";

type Props = {
  text: string;
  as?: "h1" | "h2" | "h3" | "p" | "span";
  className?: string;
  /** Delay before the first word (seconds) */
  delay?: number;
  /** Stagger between words (seconds) */
  stagger?: number;
  once?: boolean;
  /**
   * mask – words slide up from behind an overflow mask (default, cinematic)
   * clip – a wipe that opens downward, for tighter headlines
   */
  mode?: "mask" | "clip";
  /** Optional second line, revealed as its own beat after the headline. */
  sub?: string;
  subClassName?: string;
};

/**
 * Cinematic masked text reveal — words slide up from behind a mask.
 *
 * Screen readers get the plain string via `aria-label` + `sr-only`, and the
 * animated copy is `aria-hidden`, so the heading is announced once, correctly.
 */
export default function SplitHeading({
  text,
  as: Tag = "h2",
  className = "",
  delay = 0,
  stagger = STEP.base,
  once = true,
  mode = "mask",
  sub,
  subClassName = "",
}: Props) {
  const reduceMotion = useReducedMotion();
  const words = text.split(" ");

  if (reduceMotion) {
    return (
      <Tag className={className}>
        {text}
        {sub ? <span className={subClassName}>{sub}</span> : null}
      </Tag>
    );
  }

  const reveal = (delayOffset: number) => ({
    initial: mode === "mask" ? { y: "112%", opacity: 0 } : { opacity: 0, y: -6 },
    whileInView: mode === "mask" ? { y: "0%", opacity: 1 } : { opacity: 1, y: 0 },
    viewport: { ...VIEWPORT, once },
    transition: {
      duration: mode === "mask" ? DUR.cinematic : DUR.section,
      delay: delay + delayOffset,
      ease: EASE.emphasis,
    },
  });

  return (
    <Tag className={className} aria-label={sub ? `${text} ${sub}` : text}>
      <span className="sr-only">{sub ? `${text} ${sub}` : text}</span>
      <span aria-hidden="true" className="inline">
        {words.map((word, i) => (
          <span
            key={`${word}-${i}`}
            className="-mb-[0.12em] inline-block overflow-hidden pb-[0.12em] align-bottom"
          >
            <motion.span className="inline-block will-change-transform" {...reveal(i * stagger)}>
              {word}
              {i < words.length - 1 ? "\u00A0" : ""}
            </motion.span>
          </span>
        ))}
      </span>

      {sub && (
        <span aria-hidden="true" className={`mt-2 block ${subClassName}`}>
          <span className="-mb-[0.12em] inline-block overflow-hidden pb-[0.12em] align-bottom">
            <motion.span className="inline-block will-change-transform" {...reveal(words.length * stagger)}>
              {sub}
            </motion.span>
          </span>
        </span>
      )}
    </Tag>
  );
}