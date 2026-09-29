import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import { DUR, EASE, STEP, stagger, VIEWPORT } from "../lib/motion";

type Props = {
  children: ReactNode;
  /** Delay in seconds (or use `stagger(i)` for sibling grids) */
  delay?: number;
  /** Starting vertical offset (used by the `up` / `down` patterns) */
  y?: number;
  className?: string;
  /** Animate only once per element (recommended) */
  once?: boolean;
  /**
   * Entrance pattern. Different sections should not all fade up the same way:
   *  up    – content rising (default: grids, copy blocks)
   *  down  – content descending (headers seen from below)
   *  left  – entering from the left rail (process steps, metadata)
   *  right – entering from the right rail (supporting panels)
   *  scale – settling in with depth (cards, images)
   *  mask  – revealed through a mask (hero artwork, key visuals)
   *  fade  – pure opacity (already-subtle elements)
   */
  as?: "up" | "down" | "left" | "right" | "scale" | "mask" | "fade";
  /** Distance for directional patterns, in px. Defaults to `y`. */
  distance?: number;
  /** Sibling index — replaced by `delay` when omitted. */
  index?: number;
  /** Stagger step in seconds (only used together with `index`). */
  step?: number;
};

function pattern(as: Props["as"], y: number, distance: number) {
  switch (as) {
    case "down":
      return { hidden: { opacity: 0, y: -distance }, show: { opacity: 1, y: 0 } };
    case "left":
      return { hidden: { opacity: 0, x: -distance }, show: { opacity: 1, x: 0 } };
    case "right":
      return { hidden: { opacity: 0, x: distance }, show: { opacity: 1, x: 0 } };
    case "scale":
      return { hidden: { opacity: 0, scale: 0.94 }, show: { opacity: 1, scale: 1 } };
    case "mask":
      return {
        hidden: { opacity: 0, clipPath: "inset(0 0 100% 0)" },
        show: { opacity: 1, clipPath: "inset(0 0 0% 0)" },
      };
    case "fade":
      return { hidden: { opacity: 0 }, show: { opacity: 1 } };
    default:
      return { hidden: { opacity: 0, y }, show: { opacity: 1, y: 0 } };
  }
}

/**
 * Scroll-driven reveal.
 *
 * Transform / opacity / clip-path only, no layout properties, so it never
 * triggers reflow. Falls back to plain markup under reduced motion.
 */
export default function Reveal({
  children,
  delay,
  y = 28,
  className,
  once = true,
  as = "up",
  distance,
  index,
  step = STEP.base,
}: Props) {
  const reduceMotion = useReducedMotion();
  const offset = distance ?? y;
  const resolved = delay ?? (index === undefined ? 0 : stagger(index, step));

  if (reduceMotion) {
    return <div className={className}>{children}</div>;
  }

  const { hidden, show } = pattern(as, y, offset);

  return (
    <motion.div
      className={className}
      initial={hidden}
      whileInView={show}
      viewport={{ ...VIEWPORT, once }}
      transition={{
        duration: as === "mask" ? DUR.cinematic : DUR.section,
        delay: resolved,
        ease: EASE.out,
      }}
    >
      {children}
    </motion.div>
  );
}