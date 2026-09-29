import { useLayoutEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Scrolls the window to the top whenever the route changes.
 *
 * Two details matter here:
 *
 * 1. `behavior: "instant"` — the document sets `scroll-behavior: smooth`, and
 *    `"auto"` *defers to that value*, so the old call animated a multi-hundred
 *    millisecond scroll from wherever you were. That animated scroll is what
 *    read as "the page is sliding upward" on every navigation. `"instant"`
 *    bypasses the CSS default.
 * 2. `useLayoutEffect` — the reset happens before the browser paints the new
 *    route, so the jump is never seen; the new page simply appears at the top.
 *
 * It only reads `pathname`, so it stays out of the way of back/forward,
 * deep links and refresh, and never gates rendering.
 */
export default function ScrollToTop() {
  const { pathname } = useLocation();

  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });
  }, [pathname]);

  return null;
}