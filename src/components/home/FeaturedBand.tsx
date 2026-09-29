import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import FeaturedHack, { type HackRecord } from "../FeaturedHack";
import HackCard from "../HackCard";
import SectionHeader from "../SectionHeader";
import Skeleton from "../Skeleton";
import Atmosphere from "../Atmosphere";
import { useMotionPrefs } from "../../lib/motion";

type Props = {
  hacks: HackRecord[];
  loading: boolean;
};

/** How close to an edge (px) still counts as "at" that edge. */
const TOLERANCE = 4;

/**
 * The discovery chapter.
 *
 * One hack gets the full editorial treatment, the rest become a horizontal
 * showcase rail — a different rhythm from the grid on /hacks, so the same data
 * never looks like the same component twice.
 *
 * The rail's arrows are wired to the element that actually scrolls (`railRef`)
 * and track their real position, so each press advances exactly one card and the
 * arrows switch off at the ends instead of silently doing nothing.
 */
export default function FeaturedBand({ hacks, loading }: Props) {
  const navigate = useNavigate();
  const railRef = useRef<HTMLDivElement>(null);
  const { reduced } = useMotionPrefs();

  const [lead, ...rest] = hacks;

  const [scrollable, setScrollable] = useState(false);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(true);

  /** Re-reads the rail's geometry: is there anything to scroll, and where are we? */
  const measure = useCallback(() => {
    const rail = railRef.current;
    if (!rail) return;
    const max = rail.scrollWidth - rail.clientWidth;
    setScrollable(max > TOLERANCE);
    setAtStart(rail.scrollLeft <= TOLERANCE);
    setAtEnd(rail.scrollLeft >= max - TOLERANCE);
  }, []);

  // Measured before paint so the arrows are never briefly wrong on arrival.
  useLayoutEffect(() => {
    const rail = railRef.current;
    if (!rail) return;

    measure();
    // Cover images and webfonts land after mount and change `scrollWidth`.
    rail.addEventListener("load", measure, true);
    const onScroll = () => measure();
    rail.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", measure);
    const fonts = (document as Document & { fonts?: FontFaceSet }).fonts;
    void fonts?.ready.then(measure).catch(() => {});

    return () => {
      rail.removeEventListener("load", measure, true);
      rail.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", measure);
    };
  }, [measure, rest.length]);

  /** One card plus the gap — so a press always lands on a clean boundary. */
  const step = () => {
    const rail = railRef.current;
    const first = rail?.firstElementChild as HTMLElement | null;
    if (!rail || !first) return rail ? rail.clientWidth * 0.8 : 0;
    const gap = parseFloat(getComputedStyle(rail).columnGap) || 0;
    return first.getBoundingClientRect().width + gap;
  };

  const nudge = (dir: 1 | -1) => {
    const rail = railRef.current;
    if (!rail) return;
    const max = rail.scrollWidth - rail.clientWidth;
    const target = Math.max(0, Math.min(max, rail.scrollLeft + dir * step()));
    rail.scrollTo({ left: target, behavior: reduced ? "instant" : "smooth" });
  };

  const arrow =
    "flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white transition duration-300 " +
    "hover:border-brand/50 hover:bg-white/10 " +
    "disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-transparent disabled:text-neutral-600 disabled:hover:border-white/10 disabled:hover:bg-transparent";

  return (
    <section className="grain relative isolate overflow-hidden border-t border-white/10">
      <Atmosphere tone="band" />

      <div className="shell relative band">
        <SectionHeader
          index="01 —"
          eyebrow="Fresh releases"
          title="Start with a standout"
          lede="One hack gets the full spotlight. The rest are one swipe away."
          action={
            <button
              onClick={() => navigate("/hacks")}
              className="group inline-flex items-center gap-2 text-sm font-medium text-neutral-400 transition-colors duration-300 hover:text-white"
            >
              <span className="link-underline">All hacks</span>
              <span
                aria-hidden="true"
                className="transition-transform duration-300 group-hover:translate-x-1"
              >
                →
              </span>
            </button>
          }
        />

        {loading ? (
          <div className="mt-14 grid gap-10 lg:grid-cols-[1.15fr_1fr]">
            <Skeleton className="aspect-[4/3] w-full rounded-3xl" />
            <div className="space-y-4">
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-10 w-4/5" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          </div>
        ) : hacks.length === 0 ? (
          <div className="panel mt-14 flex flex-col items-center gap-3 px-6 py-16 text-center">
            <span className="text-3xl" aria-hidden="true">🚧</span>
            <p className="text-neutral-400">No hacks uploaded yet</p>
          </div>
        ) : (
          <>
            <div className="mt-14">
              <FeaturedHack hack={lead} />
            </div>

            {rest.length > 0 && (
              <div className="mt-24">
                <div className="flex items-end justify-between gap-6">
                  <h3 className="type-overline text-neutral-500">More to explore</h3>

                  {/*
                    Edge states are read from the rail itself: an arrow dims the
                    moment there is nothing left in its direction, so a press is
                    never a silent no-op.
                  */}
                  <div className="flex gap-2" role="group" aria-label="Showcase rail">
                    <button
                      onClick={() => nudge(-1)}
                      disabled={!scrollable || atStart}
                      aria-label="Previous hacks"
                      aria-controls="featured-rail"
                      className={arrow}
                    >
                      <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                        <path d="M9 2.5 4.5 7 9 11.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                    <button
                      onClick={() => nudge(1)}
                      disabled={!scrollable || atEnd}
                      aria-label="Next hacks"
                      aria-controls="featured-rail"
                      className={arrow}
                    >
                      <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                        <path d="M5 2.5 9.5 7 5 11.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  </div>
                </div>

                <div
                  ref={railRef}
                  id="featured-rail"
                  className="no-scrollbar rail mask-fade-x mt-6 gap-5 pb-4"
                  role="region"
                  aria-label="More ROM hacks — scroll sideways for more"
                  tabIndex={0}
                >
                  {rest.map((hack, i) => (
                    <HackCard key={hack.id} {...hack} variant="rail" index={i} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}