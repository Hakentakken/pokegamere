import { Link, useParams } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabase";
import PageWrapper from "../components/PageWrapper";
import HackCard from "../components/HackCard";
import Loader from "../components/Loader";
import SectionHeader from "../components/SectionHeader";
import DetailHero from "../components/hack/DetailHero";
import ScreenshotGallery from "../components/ScreenshotGallery";
import DownloadBand from "../components/hack/DownloadBand";
import { parseImageList, parseTextList } from "../lib/imageList";
import { getHackSlugIndex, resolveHackSlug } from "../lib/hackSlugs";
import { shortId, slugify } from "../lib/slug";
import { useSeo } from "../lib/seo";

const HOW_TO_PLAY = ["Download base ROM", "Download patch", "Use patcher tool", "Run in emulator"];

/** UUID v4 shape — tells the two route styles apart without a second fetch. */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default function HackDetail() {
  // `/hacks/:slug` supplies `slug`; legacy `/hack/:id` supplies `id` (a UUID).
  const { slug, id } = useParams();
  const [hack, setHack] = useState<any>(null);
  const [canonicalSlug, setCanonicalSlug] = useState<string | null>(null);
  const [related, setRelated] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  // Guards against a slow fetch for one hack painting over the next one when
  // the user navigates between detail pages quickly.
  const requestId = useRef(0);

  useEffect(() => {
    void fetchHack();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, id]);

  const fetchHack = async () => {
    const request = ++requestId.current;
    setLoading(true);
    setHack(null);
    try {
      let recordId: string | null = null;

      if (slug) {
        // Canonical route: resolve the slug against the title index.
        recordId = await resolveHackSlug(slug);
      } else if (id) {
        // Legacy UUID route: use the id directly, then hand off to the slug URL.
        recordId = UUID_RE.test(id) ? id : await resolveHackSlug(id);
      }
      if (!recordId) return;

      const { data, error } = await supabase
        .from("hacks")
        .select(
          "id, created_at, title, author, description, base_game, platform, status, rating, cover_image, download_link, screenshots, features"
        )
        .eq("id", recordId)
        .single();

      if (error) throw error;
      if (request !== requestId.current) return; // superseded by a newer navigation

      // Canonical slug for this record — from the shared index, so it always
      // matches what the listing pages link to (including collision suffixes).
      let canonical: string;
      try {
        canonical = (await getHackSlugIndex()).get(String(data.id))!;
      } catch {
        canonical = slugify(data.title) || `hack-${shortId(String(data.id))}`;
      }
      if (!canonical) canonical = slugify(data.title) || `hack-${shortId(String(data.id))}`;

      // Old UUID URLs (and non-canonical slug spellings) become a client-side
      // permanent redirect: `replace` keeps the history clean, and the
      // canonical <link> set below tells crawlers the preferred URL.
      if (canonical !== slug) {
        window.location.href = `/hacks/${canonical}`;
        return;
      }

      setHack(data);
      setCanonicalSlug(canonical);

      const { data: relatedData } = await supabase
        .from("hacks")
        .select("id, created_at, title, author, description, base_game, platform, status, rating, cover_image")
        .neq("id", recordId)
        .limit(3);

      setRelated(relatedData || []);
    } catch (err) {
      console.error(err);
    } finally {
      if (request === requestId.current) setLoading(false);
    }
  };

  // SEO — accurate values only: the record's own title/description, and the
  // canonical slug URL. A missing record is noindexed, never described.
  useSeo({
    title: hack
      ? `${hack.title} — Pokémon ${hack.platform || "ROM"} Hack`
      : loading
        ? "Loading…"
        : "Hack not found",
    description: hack?.description || undefined,
    canonicalPath: canonicalSlug ? `/hacks/${canonicalSlug}` : undefined,
    robots: hack ? "index, follow" : "noindex, nofollow",
    jsonLd: hack
      ? {
          "@context": "https://schema.org",
          "@type": "VideoGame",
          name: hack.title,
          author: hack.author ? { "@type": "Person", name: hack.author } : undefined,
          description: hack.description || undefined,
          gamePlatform: hack.platform || undefined,
          url: canonicalSlug ? `https://pokesmith.com/hacks/${canonicalSlug}` : undefined,
        }
      : undefined,
  });

  // ✅ NEW DOWNLOAD HANDLER (safe)
  const handleDownload = (link: string) => {
    setDownloading(true);

    setTimeout(() => {
      window.open(link, "_blank");
      setDownloading(false);
    }, 1200);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-32">
        <Loader />
        <p className="font-mono text-[11px] tracking-[0.3em] text-neutral-500 uppercase">
          Loading hack…
        </p>
      </div>
    );
  }

  if (!hack) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-32 text-center">
        <span className="text-4xl" aria-hidden="true">
          🕹️
        </span>
        <p className="font-display text-xl font-bold text-white">Hack not found</p>
        <Link to="/hacks" className="btn-ghost">
          Browse other hacks
        </Link>
      </div>
    );
  }

  // 🔥 ARRAY PARSERS — shared codec that understands every legacy encoding
  // stored in `hacks.screenshots` / `hacks.features` (see src/lib/imageList.ts)
  const screenshots = parseImageList(hack.screenshots);
  const features = parseTextList(hack.features);
  const download = () => hack.download_link && handleDownload(hack.download_link);

  return (
    <PageWrapper>
      <DetailHero hack={hack} downloading={downloading} onDownload={download} />

      {/* DESCRIPTION + FEATURES */}
      <section className="shell band-tight">
        <div className="grid gap-10 lg:grid-cols-[1.3fr_1fr] lg:gap-16">
          <div>
            <SectionHeader eyebrow="The story" title="About this hack" />
            <p className="type-lede mt-6 whitespace-pre-line">
              {hack.description || "No description available."}
            </p>
          </div>

          <div>
            <SectionHeader eyebrow="What's inside" title="Features" />
            {features.length > 0 ? (
              <ul className="mt-6 space-y-3">
                {features.map((feature, i) => (
                  <li key={i} className="flex gap-3 text-neutral-300">
                    <span className="mt-0.5 text-brand-400" aria-hidden="true">▸</span>
                    <span className="leading-relaxed">{feature}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-6 text-neutral-500">No feature list provided.</p>
            )}
          </div>
        </div>
      </section>

      {/* SCREENSHOTS */}
      <section className="relative border-t border-white/10">
        <div className="shell band-tight">
          <SectionHeader
            eyebrow="In motion"
            title="Screenshots"
            lede={
              screenshots.length > 1
                ? "Select any shot to open it full screen — arrow keys work once it is open."
                : undefined
            }
          />
          <div className="mt-10">
            {screenshots.length > 0 ? (
              <ScreenshotGallery images={screenshots} title={hack.title} />
            ) : (
              <p className="text-neutral-500">No screenshots available.</p>
            )}
          </div>
        </div>
      </section>

      {/* HOW TO PLAY + DOWNLOAD */}
      <DownloadBand
        hack={hack}
        downloading={downloading}
        steps={HOW_TO_PLAY}
        onDownload={download}
      />

      {/* RELATED */}
      <section className="relative border-t border-white/10">
        <div className="shell band-tight">
          <SectionHeader
            eyebrow="Keep exploring"
            title="Related hacks"
            action={
              <Link
                to="/hacks"
                className="link-underline text-sm font-medium text-neutral-400 transition-colors duration-300 hover:text-white"
              >
                All hacks →
              </Link>
            }
          />
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((h, i) => (
              <HackCard
                key={h.id}
                id={String(h.id)}
                title={h.title}
                author={h.author}
                rating={h.rating}
                baseGame={h.base_game}
                platform={h.platform}
                status={h.status}
                coverImage={h.cover_image}
                description={h.description}
                index={i}
              />
            ))}
          </div>
        </div>
      </section>
    </PageWrapper>
  );
}