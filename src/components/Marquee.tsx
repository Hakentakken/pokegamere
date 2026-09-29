type Props = {
  items: string[];
  /** Loop speed. */
  speed?: "fast" | "normal" | "slow";
  /** Play the strip right-to-left. */
  reverse?: boolean;
  /** Glyph between items. */
  separator?: string;
  className?: string;
  /** Screen-reader label for the decorative strip. */
  label?: string;
};

/**
 * Endless mono ticker with soft edge fades.
 *
 * Pure CSS transform animation (no JS, no re-renders, no layout) and the strip
 * is hidden from assistive tech — it is pure texture, the meaning is in the
 * sections around it.
 */
export default function Marquee({
  items,
  speed = "normal",
  reverse = false,
  separator = "◆",
  className = "",
  label = "PokéSmith highlights",
}: Props) {
  const duration =
    speed === "slow" ? "animate-marquee-slow" : speed === "fast" ? "animate-marquee" : "animate-marquee-slow";

  return (
    <div className={`mask-fade-x relative overflow-hidden ${className}`}>
      <span className="sr-only">{label}</span>
      <div
        aria-hidden="true"
        className={`flex w-max ${duration}`}
        style={reverse ? { animationDirection: "reverse" } : undefined}
      >
        {[0, 1].map((half) => (
          <div key={half} className="flex shrink-0 items-center gap-10 pr-10">
            {items.map((item) => (
              <span
                key={item}
                className="flex items-center gap-10 font-mono text-[11px] tracking-[0.3em] whitespace-nowrap text-neutral-500 uppercase"
              >
                {item}
                <span className="text-brand-500">{separator}</span>
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}