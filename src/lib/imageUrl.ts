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
 *  - empty / malformed              → "" (callers fall back gracefully)
 */
export function normalizeImageUrl(raw?: string | null): string {
  if (!raw) return "";

  const value = stripUrlArtifacts(String(raw));
  if (!value) return "";

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
