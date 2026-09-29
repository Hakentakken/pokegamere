import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import CoverImage from "./CoverImage";
import { MetaChips, Stars } from "./HackMeta";
import { DUR, EASE } from "../lib/motion";

type Props = {
  id: string;
  title: string;
  author: string;
  rating: number;
  baseGame: string;
  platform: string;
  status: string;
  coverImage: string;
  description: string;
  /** grid = equal tiles · rail = portrait showcase cards · compact = dense list */
  variant?: "grid" | "rail" | "compact";
  /** Position in a grid — drives the directional entrance. */
  index?: number;
  showActions?: boolean;
};

/**
 * Game card — one component, three compositions.
 *
 * The artwork is the primary action (it opens the detail page) and the
 * "Details / Patch" row repeats those destinations explicitly, so keyboard and
 * screen-reader users reach the same places as a pointer user. Motion stays
 * quiet here: image depth, a light that follows the cursor, metadata that
 * settles — not a lift-and-scale on everything.
 */
export default function HackCard({
  id, title, author, rating, baseGame, platform, status, coverImage, description,
  variant = "grid", index = 0, showActions = true,
}: Props) {
  const navigate = useNavigate();
  const open = () => navigate(`/hack/${id}`);

  // Pointer-tracked light: CSS custom properties only — no React state, no re-render
  const trackLight = (event: React.PointerEvent<HTMLElement>) => {
    if (event.pointerType !== "mouse") return;
    const el = event.currentTarget;
    const box = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${event.clientX - box.left}px`);
    el.style.setProperty("--my", `${event.clientY - box.top}px`);
  };

  const rail = variant === "rail";
  const compact = variant === "compact";
  const frame = rail ? "aspect-[3/4]" : compact ? "aspect-[16/9]" : "aspect-[16/10]";

  return (
    <motion.article
      onPointerMove={trackLight}
      initial={{ opacity: 0, y: 26 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -8% 0px" }}
      transition={{ duration: DUR.section, delay: Math.min(index, 5) * 0.07, ease: EASE.out }}
      className={`group glass edge-lit relative flex h-full flex-col overflow-hidden rounded-2xl transition-[border-color,box-shadow,transform] duration-500 ease-cinematic hover:-translate-y-1 hover:border-white/20 hover:shadow-panel ${
        // Rail cards are deliberately wide: they must overflow the container so
        // the showcase rail is actually scrollable on desktop, not just on mobile.
        rail ? "w-[min(19rem,80vw)] sm:w-[22rem] lg:w-[25rem]" : ""
      }`}
    >
      <span className="light-layer" aria-hidden="true" />

      {/* ARTWORK — the primary action */}
      <button onClick={open} className={`relative block w-full overflow-hidden text-left ${frame}`} aria-label={`Open ${title}`}>
        <CoverImage
          src={coverImage}
          alt={title}
          zoom
          className="absolute inset-0 h-full w-full"
          imgClassName="transition-[opacity,transform] duration-[1200ms] ease-cinematic group-hover:scale-[1.08]"
          scrimClassName="bg-gradient-to-t from-black/85 via-black/25 to-transparent"
        />

        {status && (
          <span className="absolute top-3 right-3 z-10 inline-flex items-center gap-1.5 rounded-full bg-emerald-500/90 px-3 py-1 text-[10px] font-semibold tracking-wider text-oncolor uppercase shadow-lg backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-oncolor" aria-hidden="true" />
            {status}
          </span>
        )}

        {/* View cue — on hover / focus, never permanently in the way */}
        <span aria-hidden="true" className="absolute right-3 bottom-3 z-10 flex translate-y-1 items-center gap-1.5 rounded-full border border-white/20 bg-ink-950/70 px-3 py-1.5 text-[10px] font-semibold tracking-[0.18em] text-white uppercase opacity-0 backdrop-blur transition-[opacity,transform] duration-500 ease-cinematic group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100">
          Explore
          <svg width="11" height="11" viewBox="0 0 14 14" fill="none">
            <path d="M2 7h10M8.5 3.5 12 7l-3.5 3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </button>

      {/* CONTENT */}
      <div className={`flex flex-1 flex-col ${rail ? "gap-3 p-5" : compact ? "gap-2 p-4" : "gap-3 p-4"}`}>
        <div>
          <h3 className="font-display text-lg leading-snug font-bold text-white transition-colors duration-300 group-hover:text-brand-400">{title}</h3>
          <p className="mt-0.5 text-sm text-neutral-500">by {author || "Unknown"}</p>
        </div>

        <MetaChips baseGame={baseGame} platform={platform} />
        <Stars rating={rating} />

        {!compact && (
          <p className="line-clamp-2 text-sm leading-relaxed text-neutral-400">{description || "No description available."}</p>
        )}

        {showActions && (
          <div className="mt-auto flex gap-2 pt-2">
            <button onClick={open} className="flex-1 rounded-lg bg-brand px-3 py-2 text-sm font-semibold text-oncolor transition duration-300 hover:bg-brand-600 hover:shadow-glow-sm active:translate-y-px">Details</button>
            <button onClick={() => navigate("/patcher")} className="flex-1 rounded-lg border border-white/15 px-3 py-2 text-sm font-medium text-neutral-200 transition duration-300 hover:border-white/40 hover:bg-white/10">Patch</button>
          </div>
        )}
      </div>
    </motion.article>
  );
}