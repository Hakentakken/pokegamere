import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import PageWrapper from "../components/PageWrapper";
import HackCard from "../components/HackCard";

export default function HackDetail() {
  const { id } = useParams();
  const [hack, setHack] = useState<any>(null);
  const [related, setRelated] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // ✅ NEW STATE (only addition)
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

      console.log("RAW screenshots:", data.screenshots);

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

  // 🔥 ARRAY PARSER (UNCHANGED)
  const getArray = (val: any): string[] => {
    if (!val) return [];

    const clean = (url: string) =>
      url.trim().replace(/^"|"$/g, "");

    if (Array.isArray(val)) {
      return val.map(clean).filter((v) => v !== "");
    }

    if (typeof val === "string") {
      const inner = val.replace(/^\{|\}$/g, "");
      if (!inner) return [];
      return inner
        .split(",")
        .map(clean)
        .filter((v) => v !== "");
    }

    return [];
  };

  // ⭐ Rating (UNCHANGED)
  const renderRating = (rating: any) => {
    const num = parseFloat(rating) || 0;
    const full = Math.floor(num);
    const half = num % 1 >= 0.5;
    const empty = 5 - full - (half ? 1 : 0);

    return (
      <div className="flex items-center gap-2">
        <div className="flex text-yellow-400 text-xl">
          {"★".repeat(full)}
          {half ? "½" : ""}
          <span className="text-gray-600">
            {"★".repeat(empty)}
          </span>
        </div>
        <span className="text-gray-400 text-sm">
          {num}/5
        </span>
      </div>
    );
  };

  if (loading) {
    return <div className="text-white text-center mt-20">Loading...</div>;
  }

  if (!hack) {
    return <div className="text-white text-center mt-20">Hack not found</div>;
  }

  const screenshots = getArray(hack.screenshots);
  const features = getArray(hack.features);

  console.log("PARSED screenshots:", screenshots);

  const SectionHeading = ({ children }: { children: React.ReactNode }) => (
    <div className="mt-10 mb-4">
      <h2 className="text-2xl font-bold text-white">{children}</h2>
      <div className="h-0.5 bg-gray-700 mt-2" />
    </div>
  );

  return (
    <PageWrapper>
      <div className="p-4 max-w-5xl mx-auto text-white">

        {/* MAIN INFO */}
        <div className="grid md:grid-cols-2 gap-8">
          <img
            src={hack.cover_image || "https://placehold.co/500x300"}
            alt={hack.title}
            className="w-full rounded-xl object-cover max-h-80 md:max-h-full"
          />

          <div className="space-y-4">
            <h1 className="text-3xl font-bold">{hack.title}</h1>
            <p className="text-gray-400">by {hack.author || "Unknown"}</p>

            <div className="flex gap-2 flex-wrap text-sm">
              {hack.base_game && (
                <span className="bg-red-500 px-2 py-1 rounded">
                  {hack.base_game}
                </span>
              )}
              {hack.platform && (
                <span className="bg-blue-500 px-2 py-1 rounded">
                  {hack.platform}
                </span>
              )}
              {hack.status && (
                <span className="bg-green-500 px-2 py-1 rounded">
                  {hack.status}
                </span>
              )}
            </div>

            {renderRating(hack.rating)}

            {/* 🔥 UPDATED DOWNLOAD BUTTON */}
            {hack.download_link ? (
              <button
                onClick={() => handleDownload(hack.download_link)}
                className="block w-full text-center bg-red-500 hover:bg-red-600 px-6 py-3 rounded-lg font-semibold"
              >
                {downloading ? "Preparing Download..." : "Download ROM / Patch"}
              </button>
            ) : (
              <div className="text-gray-400">🚧 No download link</div>
            )}
          </div>
        </div>

        {/* DESCRIPTION */}
        <SectionHeading>📖 Description</SectionHeading>
        <p className="text-gray-300">
          {hack.description || "No description available."}
        </p>

        {/* FEATURES */}
        {features.length > 0 && (
          <>
            <SectionHeading>✨ Features</SectionHeading>
            <ul className="space-y-2">
              {features.map((f, i) => (
                <li key={i} className="flex gap-2 text-gray-300">
                  <span className="text-red-400">▸</span>
                  {f}
                </li>
              ))}
            </ul>
          </>
        )}

        {/* SCREENSHOTS */}
        <SectionHeading>🖼️ Screenshots</SectionHeading>

        {screenshots.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {screenshots.map((src, i) => (
              <img
                key={i}
                src={src}
                alt={`Screenshot ${i}`}
                className="rounded-lg w-full object-cover aspect-video bg-gray-800"
                loading="lazy"
                onError={(e) => {
                  const target = e.currentTarget;
                  target.onerror = null;
                  target.src = "https://placehold.co/300x180?text=Image+Error";
                }}
              />
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No screenshots available.</p>
        )}

        {/* HOW TO PLAY */}
        <SectionHeading>🎮 How to Play</SectionHeading>
        <ol className="list-decimal list-inside text-gray-300 space-y-2">
          <li>Download base ROM</li>
          <li>Download patch</li>
          <li>Use patcher tool</li>
          <li>Run in emulator</li>
        </ol>

        {/* RELATED */}
        <SectionHeading>🕹️ Related Hacks</SectionHeading>

        {related.length === 0 ? (
          <p className="text-gray-400">No related hacks</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {related.map((h) => (
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
              />
            ))}
          </div>
        )}

      </div>
    </PageWrapper>
  );
}