import { NavLink } from "react-router-dom";
import { motion } from "framer-motion";
import ThemeToggle from "./ThemeToggle";
import { SPRING } from "../lib/motion";
import { PRIMARY, type SessionUser } from "./navLinks";
import type { Theme } from "../lib/theme";

type Props = {
  user: SessionUser;
  theme: Theme;
  onToggleTheme: () => void;
};

/**
 * Desktop navigation cluster: destination links, the auth-aware Login/Admin
 * swap and the theme switch.
 *
 * The active page is marked by a pill that slides between items via a shared
 * layout, so the current page is obvious without relying on colour alone.
 */
export default function DesktopNav({ user, theme, onToggleTheme }: Props) {
  return (
    <div className="hidden items-center gap-6 md:flex">
      {PRIMARY.map((link) => (
        <NavLink
          key={link.to}
          to={link.to}
          end={link.to === "/"}
          className={({ isActive }) =>
            [
              "group relative rounded-lg px-2.5 py-1.5 text-[13px] font-medium tracking-wide transition-colors duration-300",
              isActive ? "text-white" : "text-neutral-400 hover:text-white",
            ].join(" ")
          }
        >
          {({ isActive }) => (
            <>
              {isActive && (
                <motion.span
                  layoutId="nav-active-pill"
                  aria-hidden="true"
                  className="absolute inset-0 -z-10 rounded-lg bg-white/[0.07] ring-1 ring-white/10"
                  transition={SPRING}
                />
              )}
              <span className="relative">{link.label}</span>
            </>
          )}
        </NavLink>
      ))}

      {user ? (
        <NavLink
          to="/admin"
          className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-1.5 text-[13px] font-semibold text-emerald-300 transition hover:bg-emerald-400/20"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" aria-hidden="true" />
          Admin
        </NavLink>
      ) : (
        <NavLink
          to="/login"
          className="rounded-full bg-brand-500 px-5 py-1.5 text-[13px] font-semibold text-oncolor transition duration-300 hover:bg-brand-600 hover:shadow-glow-sm"
        >
          Login
        </NavLink>
      )}

      <ThemeToggle theme={theme} onToggle={onToggleTheme} />
    </div>
  );
}