/**
 * Single source of truth for turning whatever an admin pastes (or whatever an
 * old database row contains) into an URL an <img> element can actually render.
 *
 * Why this exists — Google Drive:
 *   A Drive *share* URL such as
 *     https://drive.google.com/file/d/<ID>/view?usp=sharing
 *   is an HTML viewer page, not an image, so <img src> can never render it.
 *   The endpoint
 *     https://lh3.googleusercontent.com/d/<ID>=w1000
 *   serves the raw bytes of a *publicly shared* Drive file and is the exact
 *   format the existing `hacks.screenshots` rows already use.
 *
 * Scope: this module ONLY transforms URLs. It never touches Supabase queries,
 * storage, RLS or the database — screenshots stay stored exactly as entered so
 * an admin can always re-read and re-edit what they typed.
 */

/** Google Drive file id charset (safe subset). */
const DRIVE_ID = "[a-zA-Z0-9_-]{10,}";

/** Hosts that serve raw Drive image bytes directly. */
const GOOGLE_IMAGE_HOST_RE = /^https?:\/\/lh[3-6]\.googleusercontent\.com\/d\/([a-zA-Z0-9_-]+)/i;

/** Drive "share/viewer" URL shapes that carry a file id in the path. */
const DRIVE_PATH_ID_RE = new RegExp(`/file/d/(${DRIVE_ID})`, "i");

/** Drive "share/viewer" URL shapes that carry a file id as a query param. */
const DRIVE_QUERY_ID_RE = new RegExp(`[?&]id=(${DRIVE_ID})`, "i");

/** Hosts that host a Drive viewer page (i.e. NOT an image). */
const DRIVE_VIEWER_HOST_RE = /^https?:\/\/(?:drive|docs)\.google\.com\//i;
const DRIVE_CONTENT_HOST_RE = /^https?:\/\/drive\.usercontent\.google\.com\//i;

/** Width hint used for normalised Drive images (matches existing records). */
const DRIVE_IMAGE_WIDTH = "w1000";

/** Shown in the admin panel when a Google Drive image cannot be loaded. */
export const DRIVE_PUBLIC_HINT =
  "Google Drive images only render when the file is shared publicly: open the file, click Share, and set General access to “Anyone with the link”.";

/** Internal placeholder for covers that are missing or fail to load. */
export const COVER_PLACEHOLDER =
  "data:image/svg+xml;charset=utf-8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="250" viewBox="0 0 400 250">
       <defs>
         <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
           <stop offset="0" stop-color="#111114"/>
           <stop offset="1" stop-color="#1b1b20"/>
         </linearGradient>
       </defs>
       <rect width="400" height="250" fill="url(#g)"/>
       <g stroke="#ffffff" stroke-opacity="0.06" stroke-width="1">
         <path d="M0 62.5h400M0 125h400M0 187.5h400M100 0v250M200 0v250M300 0v250"/>
       </g>
       <text x="200" y="132" fill="#71717a" font-family="ui-monospace,SFMono-Regular,Menlo,monospace"
             font-size="13" letter-spacing="3" text-anchor="middle">NO COVER ART</text>
     </svg>`
  );

/**
 * Removes quoting/whitespace artefacts left behind by legacy encodings
 * (e.g. `["https://…"]` or `"https://…"` stored as text).
 * A real URL never starts or ends with these characters, so this is safe.
 */
export function stripUrlArtifacts(value: string): string {
  return value
    .trim()
    .replace(/^[\s"'`\\[{]+/, "")
    .replace(/[\s"'`\\\]}]+$/, "");
}

/** True for `http://`, `https://` or root-relative image references. */
export function isRenderableImageRef(value: string): boolean {
  return /^(https?:\/\/|\/)/i.test(value.trim());
}

/* ---------------------------------------------------------------------------
 * Reference vetting
 *
 * Production rows hold at least two image values that are not image links: one
 * `screenshots` cell is an entire ChatGPT answer (fences, content-references,
 * headings) and it also contains a HackDex *catalogue* URL. That is data, so it
 * is never rewritten in the database — it is sorted out at runtime, in the one
 * place every image flows through.
 * ------------------------------------------------------------------------- */

/** Pattern for pulling a URL out of surrounding text / markdown. */
const EMBEDDED_URL_PATTERN = /https?:\/\/[^\s"'`<>[\]{}]+/gi;

/**
 * Links that are web *pages*, not image bytes. Handing one to an `<img>` is
 * how a broken tile ends up on a public page.
 *
 * Kept deliberately short: anything uncertain is allowed through, because a
 * genuinely non-image URL still degrades gracefully through each component's
 * `onError` fallback — whereas a false positive would hide a good screenshot.
 */
const NON_IMAGE_URL_PATTERNS: RegExp[] = [
  // HackDex catalogue detail routes (its real images live on `images.hackdex.app`).
  /(?:^|\/\/)(?:www\.)?hackdex\.app\/hack\//i,
  // Server-rendered documents.
  /\.(?:html?|php|aspx?|jsp)(?:[?#]|$)/i,
];

/** True when the value is an absolute/root-relative link that is not known to be a page. */
export function isImageRef(value: string): boolean {
  if (!isRenderableImageRef(value)) return false;
  return !NON_IMAGE_URL_PATTERNS.some((pattern) => pattern.test(value));
}

/**
 * First usable image URL found inside a noisy value, or `""`.
 * Candidates are tested in order, so the link heading the blob wins over
 * anything buried further down.
 */
export function extractImageUrl(value: string): string {
  const found = String(value ?? "").match(EMBEDDED_URL_PATTERN);
  if (!found) return "";

  for (const candidate of found) {
    const cleaned = stripUrlArtifacts(candidate);
    if (cleaned && isImageRef(cleaned)) return cleaned;
  }

  return "";
}

/** True when the value looks like a Google Drive viewer/share URL. */
export function isGoogleDriveUrl(url: string): boolean {
  const value = stripUrlArtifacts(url || "");
  return DRIVE_VIEWER_HOST_RE.test(value) || DRIVE_CONTENT_HOST_RE.test(value);
}

/** Pulls the Drive file id out of any supported public Drive URL shape. */
export function extractGoogleDriveId(url: string): string | null {
  const value = stripUrlArtifacts(url || "");
  if (!value) return null;

  if (!isGoogleDriveUrl(value)) return null;

  const queryMatch = value.match(DRIVE_QUERY_ID_RE);
  if (queryMatch) return queryMatch[1];

  const pathMatch = value.match(DRIVE_PATH_ID_RE);
  if (pathMatch) return pathMatch[1];

  return null;
}

/** Builds the raw-bytes URL Google serves for a publicly shared file. */
export function googleDriveImageUrl(fileId: string, width = DRIVE_IMAGE_WIDTH): string {
  return `https://lh3.googleusercontent.com/d/${fileId}=${width}`;
}

/**
 * Normalises any supported input into an <img>-renderable URL.
 *
 *  - Google Drive share link        → https://lh3.googleusercontent.com/d/<ID>=w1000
 *  - already-direct Drive image URL → returned untouched (never double-converted)
 *  - Supabase Storage / external    → returned untouched (never corrupted)
 *  - pasted text / markdown around a link → the first real image URL inside it
 *  - a link that can only be a web page   → "" (never a broken tile)
 *  - empty / malformed              → "" (callers fall back gracefully)
 */
export function normalizeImageUrl(raw?: string | null): string {
  if (!raw) return "";

  let value = stripUrlArtifacts(String(raw));
  if (!value) return "";

  // Raw whitespace inside a URL means this is a blob of pasted text rather than
  // a link — production has a `screenshots` cell holding an entire ChatGPT
  // answer. Salvage the first real image URL out of it; nothing is rewritten in
  // the database, this only decides what an <img> is allowed to load.
  if (/\s/.test(value)) {
    value = extractImageUrl(value);
    if (!value) return "";
  } else if (!isImageRef(value)) {
    // Tidy-looking, but it can only ever be a page (catalogue route, `.html`, …).
    return "";
  }

  // Already a direct Google image URL — leave exactly as stored.
  if (GOOGLE_IMAGE_HOST_RE.test(value)) return value;

  // Drive share/viewer link → convert to the raw-bytes endpoint.
  const driveId = extractGoogleDriveId(value);
  if (driveId) return googleDriveImageUrl(driveId);

  // Everything else (Supabase Storage, plain https images, root-relative) is
  // already usable as an image source.
  return value;
}

/**
 * A second, independent URL to try when the normalised one fails to load.
 * Only Google-hosted images have an alternate endpoint; otherwise `null`
 * (callers then show the graceful "Screenshot unavailable" state).
 */
export function getImageFallbackUrl(raw?: string | null): string | null {
  if (!raw) return null;

  const value = stripUrlArtifacts(String(raw));
  if (!value) return null;

  const directId = value.match(GOOGLE_IMAGE_HOST_RE);
  const fileId = directId ? directId[1] : extractGoogleDriveId(value);

  if (!fileId) return null;

  return `https://drive.google.com/thumbnail?id=${fileId}&sz=${DRIVE_IMAGE_WIDTH}`;
}

/* ---------------------------------------------------------------------------
 * Server-side sizing (Supabase Storage image transformations)
 *
 * Covers in the live catalogue are mostly raw uploads — one is 3264×1836 and
 * 2.7 MB — yet they are drawn at a few hundred CSS pixels. Storage's render
 * endpoint re-encodes them at the size they are displayed in. Measured across
 * every Supabase-hosted cover, this takes 4.75 MB down to 0.42 MB (−91%).
 *
 * Verified for this project:
 *   - `render/image/public/…` answers 200 with `image/webp` and needs no
 *     apikey/Authorization header, so a plain `<img src>` is enough;
 *   - `resize=contain` is required. Bare `width` behaves like a crop (a
 *     2560×1441 cover came back 1200×1441), while `contain` keeps the aspect
 *     ratio (1200×675);
 *   - originals are never enlarged — a 225×225 cover stays 225×225.
 * ------------------------------------------------------------------------- */

/**
 * The one width each surface renders at.
 *
 * Deliberately *one width per surface* instead of a srcset: the same artwork
 * then resolves to the same URL whichever component draws it, so the browser
 * fetches each image once per page rather than once per component.
 */
export const IMAGE_WIDTH = {
  /** Cards, the featured moment and the detail key art — all one URL. */
  cover: 1200,
  /** Gallery stage and full-screen lightbox (the lightbox reuses the stage bytes). */
  shot: 1280,
  /** Thumbnail rail and admin previews. */
  thumb: 320,
} as const;

export type ImageSize = { width?: number; quality?: number };

/** Public Storage objects: `…/storage/v1/object/public/<bucket>/<path>`. */
const SUPABASE_PUBLIC_OBJECT_RE =
  /^(https?:\/\/[^/]+\.supabase\.co)\/storage\/v1\/object\/public\/([^?#]+)([?#].*)?$/i;
/** Already-sized URLs: `…/storage/v1/render/image/public/<bucket>/<path>`. */
const SUPABASE_RENDER_OBJECT_RE =
  /^(https?:\/\/[^/]+\.supabase\.co)\/storage\/v1\/render\/image\/public\/([^?#]+)/i;
/** Query keys this module owns; anything else on the URL is carried over untouched. */
const TRANSFORM_PARAM_KEYS = ["width", "height", "quality", "format", "resize"];

/**
 * Ask Supabase Storage to resize + re-encode an image at the edge.
 *
 * Only public Storage objects can be transformed this way, so every other host
 * (Drive, X, GitHub, self-hosted blogs …) is returned unchanged. Idempotent:
 * an already-sized URL only has its width refreshed, so any stored value can be
 * piped through here without ever double-encoding.
 */
export function optimizeImageUrl(
  raw: string | null | undefined,
  size: ImageSize = {}
): string {
  const value = stripUrlArtifacts(String(raw ?? ""));
  if (!value) return "";

  const origin = value.match(SUPABASE_RENDER_OBJECT_RE)?.[1] ?? value.match(SUPABASE_PUBLIC_OBJECT_RE)?.[1];
  const objectPath =
    value.match(SUPABASE_RENDER_OBJECT_RE)?.[2] ?? value.match(SUPABASE_PUBLIC_OBJECT_RE)?.[2];
  if (!origin || !objectPath) return value; // not a public Storage object

  // Preserve any pre-existing query (cache-busting, …) minus the keys we own.
  const queryIndex = value.indexOf("?");
  const search = queryIndex >= 0 ? value.slice(queryIndex + 1).split("#")[0] : "";
  const params = new URLSearchParams(search);
  for (const key of TRANSFORM_PARAM_KEYS) params.delete(key);

  params.set("width", String(size.width ?? IMAGE_WIDTH.cover));
  params.set("resize", "contain"); // keeps aspect ratio — never crops
  params.set("quality", String(size.quality ?? 80));
  params.set("format", "webp");

  return `${origin}/storage/v1/render/image/public/${objectPath}?${params.toString()}`;
}

/** Normalise (Drive, contamination …) then size for delivery — the one call components need. */
export function resolveImageUrl(
  raw: string | null | undefined,
  size: ImageSize = {}
): string {
  return optimizeImageUrl(normalizeImageUrl(raw), size);
}
