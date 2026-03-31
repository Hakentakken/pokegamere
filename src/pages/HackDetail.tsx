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

  if (loading) {
    return <div className="text-white text-center mt-20">Loading...</div>;
  }

  if (!hack) {
    return <div className="text-white text-center mt-20">Hack not found</div>;
  }

  // ---- HELPERS ----

  // Safely parse arrays (handles both real arrays and null/undefined)
  const getArray = (val: any): string[] => {
    if (Array.isArray(val)) return val.filter((v) => typeof v === "string" && v.trim() !== "");
    return [];
  };

  // Rating stars — no repeat(0) bug
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
          <span className="text-gray-600">{"★".repeat(empty)}</span>
        </div>
        <span className="text-gray-400 text-sm">{num}/5</span>
      </div>
    );
  };

  const screenshots = getArray(hack.screenshots);
  const features = getArray(hack.features);

  // Section heading style
  const SectionHeading = ({ children }: { children: React.ReactNode }) => (
    <div className="mt-10 mb-4">
      <h2 className="text-2xl font-bold text-white">{children}</h2>
      <div className="h-0.5 bg-gray-700 mt-2" />
    </div>
  );

  return (
    <PageWrapper>
      <div className="p-4 max-w-5xl mx-auto text-white">

        {/* ---- MAIN INFO ---- */}
        <div className="grid md:grid-cols-2 gap-8">

          <img
            src={hack.cover_image || "https://via.placeholder.com/500x300"}
            alt={hack.title}
            className="w-full rounded-xl object-cover max-h-80 md:max-h-full"
          />

          <div className="space-y-4">
            <h1 className="text-3xl font-bold">{hack.title}</h1>

            <p className="text-gray-400">by {hack.author || "Unknown"}</p>

            {/* BADGES */}
            <div className="flex gap-2 text-sm flex-wrap">
              {hack.base_game && (
                <span className="bg-red-500 px-2 py-1 rounded">{hack.base_game}</span>
              )}
              {hack.platform && (
                <span className="bg-blue-500 px-2 py-1 rounded">{hack.platform}</span>
              )}
              {hack.status && (
                <span className="bg-green-500 px-2 py-1 rounded">{hack.status}</span>
              )}
            </div>

            {/* RATING */}
            {renderRating(hack.rating)}

            {/* DOWNLOAD */}
            {hack.download_link ? (
              <a
                href={hack.download_link}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-center bg-red-500 hover:bg-red-600 px-6 py-3 rounded-lg font-semibold transition"
              >
                Download ROM / Patch
              </a>
            ) : (
              <div className="text-gray-400">🚧 Download link not available</div>
            )}
          </div>
        </div>

        {/* ---- DESCRIPTION ---- */}
        <SectionHeading>📖 Description</SectionHeading>
        <p className="text-gray-300 leading-relaxed">
          {hack.description || "No description available."}
        </p>

        {/* ---- FEATURES ---- */}
        {features.length > 0 && (
          <>
            <SectionHeading>✨ Features</SectionHeading>
            <ul className="space-y-2">
              {features.map((f, i) => (
                <li key={i} className="flex items-start gap-2 text-gray-300">
                  <span className="text-red-400 mt-1">▸</span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </>
        )}

        {/* ---- SCREENSHOTS ---- */}
        <SectionHeading>🖼️ Screenshots</SectionHeading>
        {screenshots.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {screenshots.map((src, i) => (
              <img
                key={i}
                src={src}
                alt={`Screenshot ${i + 1}`}
                className="rounded-lg w-full object-cover aspect-video bg-gray-800"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "https://via.placeholder.com/300x180?text=No+Image";
                }}
              />
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No screenshots available.</p>
        )}

        {/* ---- HOW TO PLAY ---- */}
        <SectionHeading>🎮 How to Play</SectionHeading>
        <ol className="list-decimal list-inside space-y-2 text-gray-300">
          <li>Download the base ROM for the game</li>
          <li>Download the patch / ROM file above</li>
          <li>Use our <a href="/patcher" className="text-red-400 hover:underline">Patcher tool</a> to apply the patch (if it's a .ips/.bps file)</li>
          <li>Open the patched ROM in your emulator</li>
          <li>If it's a fan game (.exe), no emulator needed — run directly on PC</li>
          <li>On Android, use <span className="text-red-400">JoiPlay</span> for fan games</li>
        </ol>

        {/* ---- RELATED HACKS ---- */}
        <SectionHeading>🕹️ Related Hacks</SectionHeading>
        {related.length === 0 ? (
          <p className="text-gray-400">No related hacks found.</p>
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