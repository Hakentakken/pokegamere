import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { motion, useScroll } from "framer-motion";
import DesktopNav from "./DesktopNav";
import MobileMenu from "./MobileMenu";
import { PRIMARY, SECONDARY, type SessionUser } from "./navLinks";
import { supabase } from "../lib/supabase";
import { DUR, EASE } from "../lib/motion";
import { useTheme } from "../lib/theme";

/**
 * Site header.
 *
 * Arrives from above, then transforms with the page: it tightens, gains a
 * solid blurred background and shows a reading-progress hairline once you
 * start scrolling. The active page is marked by a pill that slides between
 * items (see DesktopNav).
 *
 * The theme lives in `useTheme`, so the header switch, the mobile drawer and
 * the persisted preference are always the same value.
 */
export default function Navbar() {
  const { theme, toggle } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState<SessionUser>(null);
  const [scrolled, setScrolled] = useState(false);

  const { scrollYProgress } = useScroll();

  // 🔐 Auth
  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
    };
    checkUser();
  }, []);

  // 📜 Scroll state → the bar compacts and firms up once the page moves
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // ⛔ Drawer: Escape closes it, body scroll locks while open
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  return (
    <>
      <motion.nav
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: DUR.section, ease: EASE.out, delay: 0.05 }}
        className={`sticky top-0 z-50 border-b transition-[background-color,border-color,box-shadow] duration-500 ease-cinematic ${
          scrolled
            ? "border-white/10 bg-ink-950/90 shadow-panel backdrop-blur-xl"
            : "border-transparent bg-ink-950/60 backdrop-blur-md"
        }`}
      >
        <div
          className={`shell flex items-center justify-between transition-[padding] duration-500 ease-cinematic ${
            scrolled ? "py-2" : "py-3"
          }`}
        >
          {/* LOGO */}
          <Link
            to="/"
            className="group flex items-center gap-2.5 transition-transform duration-300 hover:scale-[1.02]"
            aria-label="PokéSmith home"
          >
            <span className="relative h-9 w-9 overflow-hidden rounded-full border border-white/15 shadow-glow-sm">
              <img
                src="/logo.jpeg"
                alt=""
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
            </span>
            <span className="font-display text-xl font-bold tracking-tight text-brand-500">
              Poké<span className="text-white">Smith</span>
            </span>
          </Link>

          <DesktopNav user={user} theme={theme} onToggleTheme={toggle} />

          {/* MOBILE BUTTON */}
          <button
            onClick={() => setMenuOpen(true)}
            className="flex h-10 w-10 flex-col items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-white/5 transition hover:bg-white/10 md:hidden"
            aria-label="Open menu"
            aria-expanded={menuOpen}
          >
            <span className="h-px w-5 bg-white" />
            <span className="h-px w-5 bg-white" />
            <span className="h-px w-3.5 self-center bg-brand-400" />
          </button>
        </div>

        {/* Reading progress */}
        <motion.div
          aria-hidden="true"
          style={{ scaleX: scrollYProgress }}
          className="h-px origin-left bg-gradient-to-r from-brand-600 via-brand-400 to-brand-300"
        />
      </motion.nav>

      <MobileMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        user={user}
        theme={theme}
        onToggleTheme={toggle}
        primary={PRIMARY}
        secondary={SECONDARY}
      />
    </>
  );
}