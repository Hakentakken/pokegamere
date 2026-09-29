import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { EASE } from "../lib/motion";

type Props = {
  children: ReactNode;
};

/**
 * Page entrance.
 *
 * The intent is a *cut*, not a scroll: the new route cross-fades into place
 * while a brand hairline draws itself across the top edge. Deliberately there is
 * no full-screen overlay — an opaque curtain on top of a dark page is what used
 * to read as a black flash — and no scaling, which would reflow sticky elements
 * and blur text mid-animation.
 *
 * The vertical travel is 8px, an order of magnitude below a line of text, so it
 * registers as settling rather than scrolling.
 */
export default function PageWrapper({ children }: Props) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduceMotion ? 0 : 0.4, ease: EASE.out }}
      className="relative"
    >
      {/* The cut: a light drawn across the top edge, never covering content. */}
      {!reduceMotion && (
        <motion.span
          aria-hidden="true"
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: [0, 1, 1], opacity: [0, 0.9, 0] }}
          transition={{ duration: 0.75, ease: EASE.inOut, times: [0, 0.4, 1] }}
          className="pointer-events-none absolute inset-x-0 top-0 z-30 h-px origin-left bg-gradient-to-r from-brand-500 via-brand-400/70 to-transparent"
        />
      )}
      {children}
    </motion.div>
  );
}