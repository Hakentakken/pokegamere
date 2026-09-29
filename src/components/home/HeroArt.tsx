import { motion } from "framer-motion";
import CoverImage from "../CoverImage";
import Parallax from "../Parallax";
import { useMotionPrefs } from "../../lib/motion";

type Props = {
  /** Already-normalised cover URLs (empty is fine — the hero simply has no art). */
  covers: string[];
};

/** Fan layout: the middle card sits forward, the outer cards recede. */
const LAYOUT = [
  { right: "13.5rem", top: "1.5rem", rotate: -7, scale: 0.86, z: 0 },
  { right: "5.5rem", top: "4.25rem", rotate: 3.5, scale: 1, z: 2 },
  { right: "0rem", top: "7.5rem", rotate: 8, scale: 0.9, z: 1 },
];

/**
 * Hero artwork built from real cover art.
 *
 * Desktop: a three-card fan where each card sits at its own depth — different
 * scale, dimming, blur and scroll travel — plus a little pointer drift, so the
 * frame has real space in it.
 *
 * Mobile: the same artwork becomes a soft, out-of-focus backdrop behind the
 * copy instead of competing with it. Art direction adapted, not shrunk.
 */
export default function HeroArt({ covers }: Props) {
  const { reduced, coarse } = useMotionPrefs();
  const cards = covers.slice(0, 3);

  if (cards.length === 0) return null;

  return (
    <>
      {/* DESKTOP — layered fan */}
      <Parallax
        distance={reduced ? 0 : 46}
        depth={coarse ? 0 : 18}
        className="pointer-events-none absolute top-1/2 right-0 z-[1] hidden w-[46rem] -translate-y-1/2 lg:block"
      >
        <div className="mask-radial relative h-[34rem] w-full">
          <span className="glow-spot top-1/2 left-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 bg-brand-600/25" aria-hidden="true" />

          {cards.map((src, i) => {
            const spot = LAYOUT[i];
            return (
              <motion.div
                key={`${src}-${i}`}
                initial={reduced ? false : { opacity: 0, y: 70, rotate: spot.rotate, scale: spot.scale * 0.92 }}
                animate={{ opacity: 1 - i * 0.12, y: 0, rotate: spot.rotate, scale: spot.scale }}
                transition={{
                  duration: 1.4,
                  delay: 0.25 + i * 0.16,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="absolute"
                style={{ right: spot.right, top: spot.top, zIndex: spot.z }}
              >
                <CoverImage
                  src={src}
                  alt=""
                  className="h-64 w-48 rounded-2xl shadow-panel ring-1 ring-white/10"
                  imgClassName={`keyart ${i === 0 || i === 2 ? "saturate-[0.85] brightness-90" : ""}`}
                />
              </motion.div>
            );
          })}
        </div>
      </Parallax>

      {/* MOBILE — soft backdrop behind the copy */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-0 lg:hidden">
        <div className="mask-radial absolute -top-16 right-[-30%] h-[24rem] w-[24rem] opacity-40 blur-[3px]">
          <div className="relative h-full w-full">
            {cards.map((src, i) => (
              <motion.div
                key={`m-${src}-${i}`}
                initial={reduced ? false : { opacity: 0, scale: 1.1, y: 40 }}
                animate={{ opacity: 0.5 - i * 0.12, scale: 1, y: i * 26 }}
                transition={{ duration: 1.5, delay: 0.3 + i * 0.14, ease: [0.16, 1, 0.3, 1] }}
                className="absolute h-56 w-44 overflow-hidden rounded-2xl ring-1 ring-white/10"
                style={{ right: `${i * 4.5}rem`, top: `${i * 1.5}rem` }}
              >
                <CoverImage src={src} alt="" className="h-full w-full" />
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}