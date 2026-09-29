import { useState } from "react";
import { COVER_PLACEHOLDER, normalizeImageUrl } from "../lib/imageUrl";

type Props = {
  /** Raw value from the database or the admin input (any supported URL shape). */
  src: string;
  alt: string;
  /** Wrapper element (the positioned, overflowing box). */
  className?: string;
  /** Extra classes for the <img> itself. */
  imgClassName?: string;
  /** Extra classes for the scrim painted over the image. */
  scrimClassName?: string;
  /** Slow zoom once the image has loaded. */
  zoom?: boolean;
  /** Above-the-fold image: skip lazy loading and hint the browser. */
  priority?: boolean;
  /** Draw a hairline accent along the top edge. */
  accent?: boolean;
  /** Object position for cropped art. */
  position?: string;
};

/**
 * The one place cover art is rendered.
 *
 * - Drive / Supabase / plain URLs are all normalised by `normalizeImageUrl`.
 * - A missing or broken link degrades to the bundled placeholder, never to a
 *   broken-image icon.
 * - Images fade and settle in instead of popping, and the box keeps its
 *   aspect ratio so nothing reflows while loading.
 */
export default function CoverImage({
  src,
  alt,
  className = "",
  imgClassName = "",
  scrimClassName = "",
  zoom = true,
  priority = false,
  accent = false,
  position = "center",
}: Props) {
  const [loaded, setLoaded] = useState(false);

  const resolved = normalizeImageUrl(src) || COVER_PLACEHOLDER;

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <img
        src={resolved}
        alt={alt}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        referrerPolicy="no-referrer"
        draggable={false}
        onLoad={() => setLoaded(true)}
        onError={(e) => {
          e.currentTarget.onerror = null;
          e.currentTarget.src = COVER_PLACEHOLDER;
          setLoaded(true);
        }}
        style={{ objectPosition: position }}
        className={`h-full w-full object-cover transition-[opacity,transform] duration-[900ms] ease-cinematic will-change-transform ${
          loaded ? "scale-100 opacity-100" : zoom ? "scale-[1.06] opacity-0" : "opacity-0"
        } ${imgClassName}`}
      />

      {/* Scrim keeps type legible over any artwork */}
      {scrimClassName && <div aria-hidden="true" className={`absolute inset-0 ${scrimClassName}`} />}

      {/* Top accent line */}
      {accent && (
        <span
          aria-hidden="true"
          className="absolute inset-x-0 top-0 z-10 h-px bg-gradient-to-r from-transparent via-brand to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        />
      )}
    </div>
  );
}