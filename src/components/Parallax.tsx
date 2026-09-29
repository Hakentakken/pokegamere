import { useRef, type ReactNode, type RefObject } from "react";
import { motion, useMotionValue, useScroll, useSpring, useTransform } from "framer-motion";
import { useMotionPrefs } from "../lib/motion";

type Props = {
  children: ReactNode;
  className?: string;
  /** Vertical travel across the element's own scroll span, in px. */
  distance?: number;
  /** Scale from span start → span end (e.g. [1, 1.08] to breathe outward). */
  scale?: [number, number];
  /** Extra pointer-driven depth in px — fine pointers only, never on touch. */
  depth?: number;
  /** Track a different element's scroll instead of this one. */
  target?: RefObject<HTMLElement | null>;
};

/**
 * Depth layer: scroll-linked travel (and optional pointer depth) on a nested
 * element, so the outer box never moves and nothing reflows.
 *
 * - Uses `transform` only (y / x / scale) → stays on the compositor.
 * - Travel is halved on coarse pointers, disabled entirely for reduced motion.
 * - Pointer depth is spring-smoothed, so it never tracks the cursor 1:1.
 */
export default function Parallax({
  children,
  className = "",
  distance = 40,
  scale,
  depth = 0,
  target,
}: Props) {
  const own = useRef<HTMLDivElement>(null);
  const { reduced, coarse, parallax: canPointer } = useMotionPrefs();

  const ref = (target ?? own) as RefObject<HTMLDivElement>;

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  // Mobile gets a much gentler drift than desktop rather than a shrunken copy.
  const travel = reduced ? 0 : distance * (coarse ? 0.45 : 1);

  const y = useTransform(scrollYProgress, [0, 1], [travel, -travel]);

  const [sFrom, sMid, sTo] = scale ?? [1, 1, 1];
  const s = useTransform(scrollYProgress, [0, 0.5, 1], [sFrom, sMid, sTo]);

  // Pointer depth
  const pointerDepth = canPointer && depth > 0 ? depth : 0;
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const x = useSpring(rawX, { stiffness: 120, damping: 20, mass: 0.6 });
  const py = useSpring(rawY, { stiffness: 120, damping: 20, mass: 0.6 });

  const handleMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (pointerDepth === 0) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const nx = (event.clientX - rect.left) / rect.width - 0.5;
    const ny = (event.clientY - rect.top) / rect.height - 0.5;
    rawX.set(nx * pointerDepth * 2);
    rawY.set(ny * pointerDepth * 2);
  };

  const handleLeave = () => {
    rawX.set(0);
    rawY.set(0);
  };

  return (
    <div
      ref={own}
      className={className}
      onPointerMove={handleMove}
      onPointerLeave={handleLeave}
    >
      <motion.div
        style={reduced ? undefined : { y, scale: s }}
        className="will-change-transform"
      >
        <motion.div style={pointerDepth === 0 ? undefined : { x, y: py }}>
          {children}
        </motion.div>
      </motion.div>
    </div>
  );
}