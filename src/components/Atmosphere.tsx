import { useMotionPrefs } from "../lib/motion";

type Props = {
  /** Density of the light field. */
  tone?: "hero" | "band" | "page";
  /** Faint HUD grid with a slow vertical scan. */
  grid?: boolean;
  /** Film grain. */
  grain?: boolean;
  /** Wide light bar that drifts across the frame. */
  sweep?: boolean;
  /** Corner vignette that focuses the eye. */
  vignette?: boolean;
  className?: string;
};

/**
 * Ambient atmosphere: the layered light field every hero and band sits inside.
 *
 * All layers are `aria-hidden`, never intercept pointer events, and animate
 * only `transform`/`opacity` so they stay on the compositor. Ambient loops are
 * switched off entirely when the user prefers reduced motion.
 */
export default function Atmosphere({
  tone = "band",
  grid = true,
  grain = true,
  sweep = false,
  vignette = true,
  className = "",
}: Props) {
  const { reduced } = useMotionPrefs();
  const loop = (name: string) => (reduced ? "" : name);

  const scale = tone === "hero" ? 1 : tone === "page" ? 0.55 : 0.78;

  return (
    <div aria-hidden="true" className={`atmosphere pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      {/* Key light — brand red, drifting */}
      <div
        className={`absolute -right-[12%] -top-[28%] h-[78%] w-[68%] rounded-full blur-3xl ${loop("animate-drift-a")}`}
        style={{
          background: `radial-gradient(closest-side, rgba(239,68,68,${0.26 * scale}), transparent)`,
        }}
      />

      {/* Fill light — warm nostalgia accent, counter-drifting */}
      <div
        className={`absolute -bottom-[34%] -left-[14%] h-[70%] w-[62%] rounded-full blur-3xl ${loop("animate-drift-b")}`}
        style={{
          background: `radial-gradient(closest-side, rgba(249,115,22,${0.13 * scale}), transparent)`,
        }}
      />

      {/* Deep third — cool, barely there, keeps the frame from going flat */}
      <div
        className={`absolute top-[18%] left-[32%] h-[52%] w-[46%] rounded-full blur-3xl ${loop("animate-drift-c")}`}
        style={{
          background: `radial-gradient(closest-side, rgba(190,24,93,${0.12 * scale}), transparent)`,
        }}
      />

      {/* HUD grid with a slow scan — nods to the handheld/CRT nostalgia.
          Line colour follows the theme so it reads on light surfaces too. */}
      {grid && (
        <div
          className={`absolute inset-0 opacity-40 mask-fade-b ${loop("animate-scan")}`}
          style={{
            backgroundImage:
              "linear-gradient(rgb(var(--c-white) / 0.05) 1px, transparent 1px)," +
              "linear-gradient(90deg, rgb(var(--c-white) / 0.05) 1px, transparent 1px)",
            backgroundSize: "72px 72px",
          }}
        />
      )}

      {/* Drifting light sweep */}
      {sweep && (
        <div
          className={`absolute inset-y-0 -left-1/3 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-white/[0.05] to-transparent blur-xl ${loop(
            "animate-sweep-x"
          )}`}
        />
      )}

      {/* Vignette — dark in night mode, soft neutral in day mode */}
      {vignette && (
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(125% 105% at 50% 45%, transparent 52%, rgb(var(--c-vignette) / var(--c-vignette-a)))`,
          }}
        />
      )}

      {/* Film grain */}
      {grain && <div className="grain absolute inset-0" />}
    </div>
  );
}