import { useEffect, useState } from "react";
import { useReducedMotion } from "framer-motion";

/**
 * ============================================================
 *  MOTION SYSTEM
 * ============================================================
 *  Every animation in the app pulls its timing from here, so the
 *  experience speaks with one voice instead of ad-hoc numbers.
 *
 *  Scale
 *    micro      150-250ms   buttons, icons, small state changes
 *    component  300-700ms   cards, images, menus, drawers
 *    section    600-1200ms  major content reveals
 *    cinematic  1000ms+     hero sequences, page transitions
 */

/** Easings. `out` decelerates hard (entrances), `inOut` loops, `exit` accelerates away. */
export const EASE = {
  out: [0.22, 1, 0.36, 1] as const,
  emphasis: [0.16, 1, 0.3, 1] as const,
  inOut: [0.65, 0, 0.35, 1] as const,
  exit: [0.4, 0, 1, 1] as const,
};

/** Duration bands, in seconds. */
export const DUR = {
  micro: 0.18,
  component: 0.45,
  section: 0.85,
  cinematic: 1.25,
};

/** Stagger steps between siblings, in seconds. */
export const STEP = {
  tight: 0.06,
  base: 0.09,
  loose: 0.14,
};

/**
 * Index-based stagger that stops growing after `cap` items — a 40-card grid
 * must not take nine seconds to finish appearing.
 */
export function stagger(i: number, step: number = STEP.base, cap = 6): number {
  return Math.min(i, cap) * step;
}

/** Shared viewport config so reveals trigger at the same depth everywhere. */
export const VIEWPORT = {
  once: true,
  margin: "0px 0px -10% 0px",
} as const;

/** A snappy spring for layout/indicator movement (tabs, active nav pill). */
export const SPRING = {
  type: "spring" as const,
  stiffness: 320,
  damping: 32,
  mass: 0.7,
};

/**
 * True when the user has asked for less motion — the case where every
 * non-essential animation must be dropped or simplified.
 */
export function useReducedMotionSafe() {
  return !!useReducedMotion();
}

/**
 * Touch-device detection. Parallax and pointer-tracked depth are pointless on
 * a phone (and expensive), so the motion system switches to a simpler,
 * intentional mobile choreography instead of shrinking the desktop one.
 */
export function useCoarsePointer() {
  const [coarse, setCoarse] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(pointer: coarse)");
    const update = () => setCoarse(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return coarse;
}

/**
 * The single gate every scroll/pointer effect should check.
 * `parallax` is only true on a mouse-driven, motion-tolerant viewport.
 */
export function useMotionPrefs() {
  const reduced = !!useReducedMotion();
  const coarse = useCoarsePointer();
  return { reduced, coarse, parallax: !reduced && !coarse };
}

/** True on narrow viewports — used to simplify choreography on phones. */
export function useNarrow(below = 768) {
  const [narrow, setNarrow] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia(`(max-width: ${below - 1}px)`);
    const update = () => setNarrow(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, [below]);

  return narrow;
}