import { useCallback, useEffect, useState } from "react";

export type Theme = "dark" | "light";

const STORAGE_KEY = "pokesmith-theme";
const EVENT = "pokesmith:theme";

/**
 * `<html>`, or null when there is no document.
 *
 * Every helper goes through this instead of touching `document` at import time,
 * so the module is safe to load in the SSR smoke harness and in tests.
 */
function root(): HTMLElement | null {
  return typeof document === "undefined" ? null : document.documentElement;
}

/** True when the visitor has asked the OS to reduce motion. */
function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * Reads the stored preference.
 *
 * Dark is the signature look and the fallback, so a first-time visitor (or a
 * blocked storage) always lands on the design the site was art-directed around.
 */
export function readStoredTheme(): Theme {
  try {
    return localStorage.getItem(STORAGE_KEY) === "light" ? "light" : "dark";
  } catch {
    return "dark";
  }
}

/**
 * Writes the theme to the document: the class drives every colour token, and
 * `theme-color` keeps the mobile browser chrome in step.
 */
export function applyTheme(theme: Theme, animate = false) {
  const el = root();
  if (!el) return;
  const isLight = theme === "light";

  if (animate && !prefersReducedMotion()) {
    el.classList.add("theme-anim");
    window.setTimeout(() => root()?.classList.remove("theme-anim"), 380);
  }

  el.classList.toggle("light", isLight);
  el.classList.toggle("dark", !isLight);
  el.style.colorScheme = isLight ? "light" : "dark";

  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", isLight ? "#f8fafc" : "#050507");
}

/**
 * Applies the stored theme before the first paint.
 *
 * Called from `main.tsx`, i.e. before React mounts, so a refresh never flashes
 * the wrong palette.
 */
export function initTheme() {
  const theme = readStoredTheme();
  applyTheme(theme, false);
  return theme;
}

function store(theme: Theme) {
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    /* private mode — the theme still works for this session */
  }
}

function broadcast(theme: Theme) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<Theme>(EVENT, { detail: theme }));
}

/**
 * Theme state shared by every component that needs it (header button, mobile
 * drawer). Changing it applies, persists and notifies in one place, so the whole
 * app follows — header, hero, cards, forms, footer, admin, legal pages.
 */
export function useTheme() {
  const [theme, setTheme] = useState<Theme>(readStoredTheme);

  useEffect(() => {
    // Keep the desktop header switch and the mobile drawer in sync.
    const onChange = (event: Event) => setTheme((event as CustomEvent<Theme>).detail);
    window.addEventListener(EVENT, onChange);
    return () => window.removeEventListener(EVENT, onChange);
  }, []);

  const setThemeAndApply = useCallback((next: Theme) => {
    setTheme(next);
    applyTheme(next, true);
    store(next);
    broadcast(next);
  }, []);

  const toggle = useCallback(() => {
    // React may evaluate a `setState` updater more than once (eager evaluation
    // at dispatch time, then again during render). Side effects inside it would
    // run twice — first flipping the theme, then flipping it straight back —
    // so the switch appears dead. Compute the next value and hand it to
    // `setThemeAndApply`, which applies/persists/notifies exactly once; a
    // direct value in the queue is idempotent however often React reads it.
    const next: Theme = theme === "dark" ? "light" : "dark";
    setThemeAndApply(next);
  }, [theme, setThemeAndApply]);

  return { theme, isDark: theme === "dark", setTheme: setThemeAndApply, toggle };
}