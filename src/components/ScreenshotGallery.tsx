import { useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Screenshot from "./Screenshot";
import Lightbox from "./Lightbox";
import Parallax from "./Parallax";
import { DUR, EASE, VIEWPORT } from "../lib/motion";

type Props = {
  /** Raw image references (already decoded by `parseImageList`). */
  images: string[];
  /** Game title, used for alt text. */
  title: string;
};

/**
 * Screenshot gallery: one large stage that breathes as you scroll, a
 * thumbnail rail, and a full-screen lightbox.
 *
 * Accessibility: the stage and each thumbnail are real buttons, the rail is a
 * labelled focusable scroll region, and the lightbox is a modal dialog with
 * Escape / arrow-key support.
 */
export default function ScreenshotGallery({ images, title }: Props) {
  const [active, setActive] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const stageRef = useRef<HTMLButtonElement>(null);

  const count = images.length;
  if (count === 0) return null;

  const go = (dir: number) => setActive((i) => (i + dir + count) % count);

  return (
    <div className="relative">
      <Parallax distance={22} className="relative">
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={VIEWPORT}
          transition={{ duration: DUR.cinematic, ease: EASE.emphasis }}
          className="group edge-lit relative overflow-hidden rounded-2xl border border-white/10 shadow-panel"
        >
          <button
            ref={stageRef}
            onClick={() => setLightbox(true)}
            className="relative block w-full cursor-zoom-in"
            aria-label={`Open screenshot ${active + 1} of ${count} full screen`}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={images[active]}
                initial={{ opacity: 0, scale: 1.04 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.99 }}
                transition={{ duration: DUR.component, ease: EASE.out }}
              >
                <Screenshot
                  src={images[active]}
                  alt={`${title} screenshot ${active + 1} of ${count}`}
                  priority
                  className="rounded-none border-0"
                />
              </motion.div>
            </AnimatePresence>

            <span
              aria-hidden="true"
              className="pointer-events-none absolute right-4 bottom-4 flex items-center gap-2 rounded-full border border-white/20 bg-ink-950/75 px-3.5 py-2 text-[10px] font-semibold tracking-[0.18em] text-white uppercase opacity-0 backdrop-blur transition-opacity duration-500 group-hover:opacity-100 group-focus-visible:opacity-100"
            >
              Expand
              <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                <path d="M6 1v8M1 6h8M10.5 3.5 13 6m0 0-2.5 2.5M13 6H9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
            </span>
          </button>

          {count > 1 && (
            <>
              <StageArrow side="left" onClick={() => go(-1)} />
              <StageArrow side="right" onClick={() => go(1)} />
            </>
          )}

          <span className="pointer-events-none absolute bottom-4 left-4 rounded-full border border-white/15 bg-ink-950/70 px-3 py-1.5 font-mono text-[10px] tracking-[0.2em] text-white/80 backdrop-blur">
            {String(active + 1).padStart(2, "0")} / {String(count).padStart(2, "0")}
          </span>
        </motion.div>
      </Parallax>

      {count > 1 && (
        <div
          role="region"
          aria-label={`${title} screenshots — scroll sideways for more`}
          tabIndex={0}
          className="no-scrollbar rail mask-fade-x mt-5 gap-4 pb-2"
        >
          {images.map((src, i) => (
            <button
              key={`${src}-${i}`}
              onClick={() => setActive(i)}
              aria-label={`Show screenshot ${i + 1}`}
              aria-current={i === active}
              className={`overflow-hidden rounded-xl border transition-[opacity,transform,border-color] duration-500 ease-cinematic ${
                i === active
                  ? "scale-[1.02] border-brand/70 opacity-100"
                  : "border-white/10 opacity-55 hover:opacity-90"
              }`}
            >
              <Screenshot src={src} alt="" variant="preview" className="!rounded-xl" />
            </button>
          ))}
        </div>
      )}

      <AnimatePresence>
        {lightbox && (
          <Lightbox
            images={images}
            active={active}
            onIndex={setActive}
            onClose={() => {
              setLightbox(false);
              stageRef.current?.focus();
            }}
            title={title}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function StageArrow({ side, onClick }: { side: "left" | "right"; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label={side === "left" ? "Previous screenshot" : "Next screenshot"}
      className={`absolute top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-ink-950/70 text-white opacity-0 backdrop-blur transition-[opacity,transform,background-color] duration-500 ease-cinematic hover:scale-105 hover:bg-ink-900 focus-visible:opacity-100 group-hover:opacity-100 ${
        side === "left" ? "left-4" : "right-4"
      }`}
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