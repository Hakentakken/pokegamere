import { motion } from "framer-motion";
import type { Theme } from "../lib/theme";

type Props = {
  theme: Theme;
  onToggle: () => void;
  /** Compact icon-only button for the header bar. */
  compact?: boolean;
};

/**
 * Day / night switch.
 *
 * The track slides, the icons cross-fade with a short rotation, and the button
 * exposes the *action* to assistive tech ("Switch to light theme") plus its
 * current state, so it is never an unlabelled emoji.
 */
export default function ThemeToggle({ theme, onToggle, compact = true }: Props) {
  const isDark = theme === "dark";
  const nextLabel = isDark ? "Switch to light theme" : "Switch to dark theme";

  return (
    <button
      onClick={onToggle}
      aria-label={nextLabel}
      title={nextLabel}
      aria-pressed={isDark}
      className={`group relative flex items-center rounded-full border border-white/10 bg-white/5 transition-[border-color,background-color] duration-300 hover:border-brand/50 hover:bg-white/10 ${
        compact ? "h-9 w-16 p-1" : "w-full justify-between px-2 py-2"
      }`}
    >
      {/* Track thumb */}
      <motion.span
        aria-hidden="true"
        className="absolute top-1 bottom-1 left-1 flex items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 shadow-glow-sm"
        animate={{ x: compact ? (isDark ? 0 : 24) : 0, y: 0, width: compact ? 28 : 30, height: compact ? 28 : 30 }}
        transition={{ type: "spring", stiffness: 420, damping: 30, mass: 0.6 }}
      >
        <motion.span
          key={theme}
          initial={{ rotate: -70, opacity: 0, scale: 0.7 }}
          animate={{ rotate: 0, opacity: 1, scale: 1 }}
          transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
          className="text-oncolor"
        >
          {isDark ? <MoonIcon /> : <SunIcon />}
        </motion.span>
      </motion.span>

      {/* Track labels (desktop header keeps the switch compact) */}
      <span aria-hidden="true" className={compact ? "sr-only" : "flex-1 text-left pl-9 text-sm text-neutral-300"}>
        {nextLabel}
      </span>
      <span aria-hidden="true" className={compact ? "sr-only" : "text-xs text-neutral-500"}>
        {isDark ? "Dark" : "Light"}
      </span>
    </button>
  );
}

function MoonIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm0-13.5V1.5m0 21v-2m8.5-8.5h2m-21 0h2m14.8-6.3 1.4-1.4M4.7 19.3l1.4-1.4m12.2 0 1.4 1.4M4.7 4.7l1.4 1.4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}