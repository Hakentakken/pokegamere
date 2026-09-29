import { NavLink, Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import ThemeToggle from "./ThemeToggle";
import { DUR, EASE } from "../lib/motion";
import type { Theme } from "../lib/theme";
import type { NavItem, SessionUser } from "./navLinks";

export type { NavItem };

type Props = {
  open: boolean;
  onClose: () => void;
  user: SessionUser;
  theme: Theme;
  onToggleTheme: () => void;
  /** First group is the primary destination set. */
  primary: NavItem[];
  /** Second group is the quieter utility set. */
  secondary: NavItem[];
};

/**
 * Mobile navigation drawer.
 *
 * Slides in from the right behind a fading scrim, locks body scroll while
 * open, closes on Escape, and every link closes it on tap. The theme switch is
 * the same control as in the header, so it works the same on small screens.
 */
export default function MobileMenu({
  open,
  onClose,
  user,
  theme,
  onToggleTheme,
  primary,
  secondary,
}: Props) {
  const item = "block rounded-lg px-3 py-2.5 text-[15px] transition";

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
            aria-hidden="true"
          />

          <motion.aside
            key="drawer"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.45, ease: EASE.out }}
            className="fixed top-0 right-0 z-50 flex h-full w-72 flex-col border-l border-white/10 bg-ink-900/95 backdrop-blur-xl"
            aria-label="Menu"
          >
            <div className="flex items-center justify-between border-b border-white/10 p-4">
              <h2 className="font-mono text-xs font-medium uppercase tracking-[0.25em] text-brand-400">
                Menu
              </h2>
              <button
                onClick={onClose}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-lg transition hover:bg-white/10"
                aria-label="Close menu"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-col gap-1 overflow-y-auto p-4">
              {[...primary, ...secondary].map((link, i) => (
                <motion.div
                  key={link.to}
                  initial={{ opacity: 0, x: 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{
                    delay: 0.08 + i * 0.045,
                    duration: DUR.component,
                    ease: EASE.out,
                  }}
                >
                  <NavLink
                    to={link.to}
                    end={link.to === "/"}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `${item} ${
                        isActive
                          ? "bg-white/5 font-semibold text-white"
                          : "text-neutral-300 hover:bg-white/5 hover:text-white"
                      }`
                    }
                  >
                    {link.label}
                  </NavLink>
                </motion.div>
              ))}

              <hr className="my-3 border-white/10" />

              <div>
                {user ? (
                  <Link
                    to="/admin"
                    onClick={onClose}
                    className="block rounded-lg border border-emerald-400/30 bg-emerald-400/10 px-3 py-2.5 text-center text-[15px] font-semibold text-emerald-300 transition hover:bg-emerald-400/20"
                  >
                    Admin Panel
                  </Link>
                ) : (
                  <Link
                    to="/login"
                    onClick={onClose}
                    className="block rounded-lg bg-brand-500 px-3 py-2.5 text-center text-[15px] font-semibold text-oncolor transition hover:bg-brand-600"
                  >
                    Login
                  </Link>
                )}

                {/* Same switch as the header — labelled, animated, persisted */}
                <div className="mt-3 flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                  <span className="text-sm text-neutral-300">Appearance</span>
                  <ThemeToggle theme={theme} onToggle={onToggleTheme} />
                </div>
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}