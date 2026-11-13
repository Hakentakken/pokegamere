import { createContext, useContext, useEffect } from "react";

/**
 * Document-head SEO for the SPA — titles, meta description, canonical URLs,
 * robots directives, Open Graph tags and JSON-LD, without adding a head
 * library. Everything this hook writes is scoped per page: each page declares
 * its own values, and route changes simply overwrite them.
 *
 * The request-scoped collector emits these tags in server-rendered HTML.
 * The effect keeps the same metadata up to date during client navigation.
 */

export const SITE_URL = "https://pokesmith.com";

export type SeoOptions = {
  /** Document title, without the site suffix (added automatically when distinct). */
  title: string;
  /** Meta description — one accurate sentence drawn from the page's real content. */
  description?: string;
  /** Path of the canonical URL for this page, e.g. "/hacks/pokemon-gaia". */
  canonicalPath?: string;
  /** Robots directive; defaults to "index, follow". Use "noindex, nofollow" for private pages. */
  robots?: string;
  /** Open Graph type; defaults to "website". */
  ogType?: string;
  /** One JSON-LD object (or array) injected as <script type="application/ld+json">. */
  jsonLd?: unknown;
};

const SITE_NAME = "PokéSmith";
// Request-scoped collector for initial HTML; never a module-global mutable object.
export const SeoContext = createContext<{ current?: SeoOptions } | null>(null);

/** Insert-or-update a <meta>/<link> tag keyed by `key` (a selector attribute pair). */
function upsertTag(tagName: "meta" | "link", key: { name?: string; property?: string; rel?: string }, attrs: Record<string, string>) {
  const selector =
    key.rel ? `link[rel="${key.rel}"]` : key.name ? `meta[name="${key.name}"]` : `meta[property="${key.property}"]`;
  let el = document.head.querySelector<HTMLMetaElement | HTMLLinkElement>(selector);
  if (!el) {
    el = document.createElement(tagName);
    for (const [k, v] of Object.entries(key)) if (v) el.setAttribute(k, v);
    document.head.appendChild(el);
  }
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
}

const JSON_LD_ID = "pokesmith-jsonld";

export function useSeo({
  title,
  description,
  canonicalPath,
  robots = "index, follow",
  ogType = "website",
  jsonLd,
}: SeoOptions) {
  const collector = useContext(SeoContext);
  if (collector) collector.current = { title, description, canonicalPath, robots, ogType, jsonLd };
  useEffect(() => {
    const fullTitle = title === SITE_NAME || title.endsWith(`| ${SITE_NAME}`) ? title : `${title} | ${SITE_NAME}`;
    document.title = fullTitle;

    upsertTag("meta", { name: "description" }, { content: description || '' });

    upsertTag("meta", { name: "robots" }, { content: robots });

    const canonical = canonicalPath ? new URL(canonicalPath, SITE_URL).href : undefined;
    if (canonical) upsertTag("link", { rel: "canonical" }, { href: canonical });
    else document.head.querySelector('link[rel="canonical"]')?.remove();

    upsertTag("meta", { property: "og:title" }, { content: fullTitle });
    upsertTag("meta", { property: "og:site_name" }, { content: SITE_NAME });
    upsertTag("meta", { property: "og:type" }, { content: ogType });
    upsertTag("meta", { property: "og:description" }, { content: description || '' });
    if (canonical) upsertTag("meta", { property: "og:url" }, { content: canonical });
    upsertTag("meta", { name: "twitter:card" }, { content: "summary" });

    // JSON-LD: one script per page, replaced on navigation, removed when the
    // next page does not provide any (so stale structured data never lingers).
    const existing = document.getElementById(JSON_LD_ID);
    if (jsonLd === undefined || jsonLd === null) {
      existing?.remove();
    } else {
      const script = existing ?? Object.assign(document.createElement("script"), { id: JSON_LD_ID });
      script.setAttribute('type', 'application/ld+json');
      script.textContent = JSON.stringify(jsonLd);
      if (!existing) document.head.appendChild(script);
    }
  }, [title, description, canonicalPath, robots, ogType, jsonLd]);
}
