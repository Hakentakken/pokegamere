import { useState } from "react";
import { DRIVE_PUBLIC_HINT, getImageFallbackUrl, IMAGE_WIDTH, resolveImageUrl } from "../lib/imageUrl";

type ScreenshotProps = {
  /** Raw value from the database or the admin input (any supported URL shape). */
  src: string;
  alt: string;
  /** `grid` = public screenshot wall · `preview` = compact admin thumbnail · `lightbox` = contain-fit, full bleed */
  variant?: "grid" | "preview" | "lightbox";
  /** Delivered-width override — normally you want the variant's own width. */
  width?: number;
  className?: string;
  /** Text shown when the URL cannot be rendered. Defaults to "Screenshot unavailable". */
  unavailableLabel?: string;
  /** Above the fold: skip lazy loading. */
  priority?: boolean;
};

type FrameProps = {
  /** Already normalised image URL. */
  source: string;
  /** Alternate URL to try once if the primary fails (Google-hosted images only). */
  fallback: string | null;
  alt: string;
  variant: "grid" | "preview" | "lightbox";
  className: string;
  unavailableLabel: string;
  priority: boolean;
};

/**
 * Renders one screenshot / image reference.
 *
 * - Google Drive share links are normalised to a renderable URL (see
 *   `src/lib/imageUrl.ts`) so a pasted public Drive link just works.
 * - Supabase Storage art is resized at the edge to this variant's width (see
 *   `SHOT_WIDTH`), so a 128px thumbnail never downloads the full-size original.
 * - Plain external URLs render untouched.
 * - If the URL still cannot be fetched (private file, deleted file, typo) the
 *   frame degrades to a tidy "Screenshot unavailable" state instead of a broken
 *   browser icon, and the box keeps its aspect ratio so nothing jumps.
 */

/**
 * One delivered width per variant.
 *
 * `lightbox` deliberately matches `grid`, so opening the lightbox reuses bytes
 * the stage has already fetched instead of downloading the same picture a
 * second time. `preview` is small because the rail draws 128px-wide thumbnails.
 */
const SHOT_WIDTH: Record<NonNullable<ScreenshotProps["variant"]>, number> = {
  grid: IMAGE_WIDTH.shot,
  preview: IMAGE_WIDTH.thumb,
  lightbox: IMAGE_WIDTH.shot,
};

export default function Screenshot(props: ScreenshotProps) {
  const variant = props.variant ?? "grid";
  const source = resolveImageUrl(props.src, { width: props.width ?? SHOT_WIDTH[variant] });
  const fallback = getImageFallbackUrl(props.src);

  // Keying the frame on the resolved URLs restarts the load chain whenever the
  // admin types a different link — no effect and no extra render pass needed.
  return (
    <Frame
      key={`${source}::${fallback ?? ""}`}
      source={source}
      fallback={fallback}
      alt={props.alt}
      variant={variant}
      className={props.className ?? ""}
      unavailableLabel={props.unavailableLabel ?? "Screenshot unavailable"}
      priority={props.priority ?? false}
    />
  );
}

function Frame({
  source,
  fallback,
  alt,
  variant,
  className,
  unavailableLabel,
  priority,
}: FrameProps) {
  const [stage, setStage] = useState<"primary" | "fallback" | "failed">("primary");
  const [loaded, setLoaded] = useState(false);

  const isPreview = variant === "preview";
  const isLightbox = variant === "lightbox";
  const current = stage === "primary" ? source : (fallback ?? "");

  const frame = [
    "relative overflow-hidden border border-white/10 bg-ink-900",
    isLightbox
      ? "flex max-h-[78vh] w-auto items-center justify-center rounded-xl"
      : "rounded-lg",
    isPreview ? "h-20 w-32 shrink-0" : isLightbox ? "" : "aspect-video w-full",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const imgClass = isLightbox
    ? "max-h-[78vh] w-auto object-contain"
    : "h-full w-full object-cover";

  if (stage === "failed" || !current) {
    return (
      <div
        className={`${frame} flex flex-col items-center justify-center gap-1 p-2 text-center`}
        title={DRIVE_PUBLIC_HINT}
      >
        <span className="text-base opacity-50" aria-hidden="true">
          🖼️
        </span>
        <span className="font-mono text-[10px] leading-tight tracking-[0.16em] text-neutral-500 uppercase">
          {unavailableLabel}
        </span>
        {isPreview && (
          <span className="font-mono text-[9px] leading-tight tracking-wide text-neutral-600">
            check the link is public
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={frame}>
      {!loaded && !isLightbox && (
        <span className="absolute inset-0 animate-pulse-soft bg-white/[0.04]" aria-hidden="true" />
      )}

      <img
        src={current}
        alt={alt}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        referrerPolicy="no-referrer"
        draggable={false}
        onLoad={() => setLoaded(true)}
        onError={() => setStage((prev) => (prev === "primary" && fallback ? "fallback" : "failed"))}
        className={`transition duration-700 ease-cinematic ${imgClass} ${
          loaded ? "opacity-100" : "opacity-0"
        }`}
      />
    </div>
  );
}
