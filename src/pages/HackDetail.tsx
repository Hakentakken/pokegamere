import { Link, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import PageWrapper from "../components/PageWrapper";
import HackCard from "../components/HackCard";
import Loader from "../components/Loader";
import SectionHeader from "../components/SectionHeader";
import DetailHero from "../components/hack/DetailHero";
import ScreenshotGallery from "../components/ScreenshotGallery";
import DownloadBand from "../components/hack/DownloadBand";
import { parseImageList, parseTextList } from "../lib/imageList";

const HOW_TO_PLAY = ["Download base ROM", "Download patch", "Use patcher tool", "Run in emulator"];

export default function HackDetail() {
  const { id } = useParams();
  const [hack, setHack] = useState<any>(null);
  const [related, setRelated] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    fetchHack();
  }, [id]);

  const fetchHack = async () => {
    try {
      const { data, error } = await supabase
        .from("hacks")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;

      setHack(data);

      const { data: relatedData } = await supabase
        .from("hacks")
        .select("*")
        .neq("id", id)
        .limit(3);

      setRelated(relatedData || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

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