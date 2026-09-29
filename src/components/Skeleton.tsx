type Props = {
  className?: string;
  /** block = generic fill · card = cover + copy · text = paragraph lines · row = list row */
  variant?: "block" | "card" | "text" | "row";
};

/**
 * Loading placeholder. Shimmers with a single transform animation, announces
 * nothing, and reserves the exact footprint of the content it replaces so
 * nothing jumps when the data lands.
 */
export default function Skeleton({ className = "", variant = "block" }: Props) {
  if (variant === "card") {
    return (
      <div
        aria-hidden="true"
        className={`overflow-hidden rounded-2xl border border-white/10 bg-ink-850/50 ${className}`}
      >
        <div className="skeleton aspect-[16/10] w-full rounded-none" />
        <div className="space-y-3 p-4">
          <div className="skeleton h-4 w-3/4 rounded" />
          <div className="skeleton h-3 w-1/2 rounded" />
          <div className="skeleton h-3 w-full rounded" />
          <div className="skeleton h-8 w-full rounded-lg" />
        </div>
      </div>
    );
  }

  if (variant === "text") {
    return (
      <div aria-hidden="true" className={`space-y-3 ${className}`}>
        <div className="skeleton h-3 w-full rounded" />
        <div className="skeleton h-3 w-11/12 rounded" />
        <div className="skeleton h-3 w-4/5 rounded" />
      </div>
    );
  }

  if (variant === "row") {
    return (
      <div
        aria-hidden="true"
        className={`flex items-center gap-4 rounded-xl border border-white/10 bg-ink-850/50 p-4 ${className}`}
      >
        <div className="skeleton h-10 w-10 shrink-0 rounded-lg" />
        <div className="flex-1 space-y-2">
          <div className="skeleton h-3 w-1/3 rounded" />
          <div className="skeleton h-2.5 w-2/3 rounded" />
        </div>
      </div>
    );
  }

  return <div aria-hidden="true" className={`skeleton rounded-lg ${className}`} />;
}