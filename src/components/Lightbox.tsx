import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import Screenshot from "./Screenshot";
import { DUR, EASE } from "../lib/motion";

type Props = {
  images: string[];
  active: number;
  onIndex: (next: number) => void;
  onClose: () => void;
  title: string;
};

/**
 * Full-screen screenshot viewer.
 *
 * Modal dialog semantics, Escape to close, arrow keys to move, body scroll
 * locked only while open, focus moved in on open. Background clicks close it,
 * clicks on the image do not.
 */
export default function Lightbox({ images, active, onIndex, onClose, title }: Props) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const count = images.length;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight" && count) onIndex((active + 1) % count);
      if (e.key === "ArrowLeft" && count) onIndex((active - 1 + count) % count);
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    closeRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label={`${title} screenshot ${active + 1} of ${count}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: DUR.component }}
      className="fixed inset-0 z-[60] flex flex-col items-center justify-center gap-4 bg-ink-950/95 p-4 backdrop-blur-md sm:p-8"
      onClick={onClose}
    >
      <button
        ref={closeRef}
        onClick={onClose}
        className="absolute top-4 right-4 flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/5 text-lg text-white transition hover:border-brand/50 hover:bg-white/10"
        aria-label="Close full screen view"
      >
        ✕
      </button>

      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 18 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: DUR.section, ease: EASE.emphasis }}
        className="flex min-h-0 max-h-full items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        <Screenshot
          src={images[active]}
          alt={`${title} screenshot ${active + 1} of ${count}`}
          variant="lightbox"
          priority
        />
      </motion.div>

      {count > 1 && (
        <div className="flex items-center gap-4" onClick={(e) => e.stopPropagation()}>
          <NavButton side="left" onClick={() => onIndex((active - 1 + count) % count)} label="Previous screenshot" />
          <span className="font-mono text-[11px] tracking-[0.25em] text-neutral-400">
            {active + 1} / {count}
          </span>
          <NavButton side="right" onClick={() => onIndex((active + 1) % count)} label="Next screenshot" />
        </div>
      )}
    </motion.div>
  );
}

function NavButton({
  side,
  onClick,
  label,
}: {
  side: "left" | "right";
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white transition hover:border-brand/50 hover:bg-white/10"
    >
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
        <path
          d={side === "left" ? "M9 2.5 4.5 7 9 11.5" : "M5 2.5 9.5 7 5 11.5"}
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}