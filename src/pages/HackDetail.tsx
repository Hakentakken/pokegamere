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
      // 🔥 FETCH MAIN HACK
      const { data, error } = await supabase
        .from("hacks")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;

      setHack(data);

      // 🔥 FETCH RELATED (exclude current)
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

  return (
    <PageWrapper>
      <div className="p-4 max-w-5xl mx-auto text-white">

        {/* MAIN */}
        <div className="grid md:grid-cols-2 gap-6">

          <img
            src={hack.cover_image || "https://via.placeholder.com/500x300"}
            alt={hack.title}
            className="w-full rounded-xl object-cover"
          />

          <div className="space-y-4">
            <h1 className="text-3xl font-bold">{hack.title}</h1>

            <p className="text-gray-400">
              by {hack.author || "Unknown"}
            </p>

            {/* BADGES */}
            <div className="flex gap-2 text-sm flex-wrap">
              <span className="bg-red-500 px-2 py-1 rounded">
                {hack.base_game || "Unknown"}
              </span>
              <span className="bg-blue-500 px-2 py-1 rounded">
                {hack.platform || "Unknown"}
              </span>
              <span className="bg-green-500 px-2 py-1 rounded">
                {hack.status || "Unknown"}
              </span>
            </div>

            {/* RATING */}
            <div className="text-yellow-400 text-lg">
              {"⭐".repeat(Math.round(hack.rating || 0))} ({hack.rating || 0})
            </div>

            {/* DESCRIPTION */}
            <p className="text-gray-300">
              {hack.description || "No description available."}
            </p>

            {/* 🔥 DOWNLOAD BUTTON (UPDATED) */}
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
              <div className="text-gray-400">
                🚧 Download link not available
              </div>
            )}

          </div>
        </div>

        {/* SCREENSHOTS */}
        <div className="mt-10">
          <h2 className="text-2xl font-bold mb-4">Screenshots</h2>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <img src="https://via.placeholder.com/300" className="rounded" />
            <img src="https://via.placeholder.com/300" className="rounded" />
            <img src="https://via.placeholder.com/300" className="rounded" />
          </div>
        </div>

        {/* HOW TO PLAY */}
        <div className="mt-10">
          <h2 className="text-2xl font-bold mb-4">How to Play</h2>

          <ol className="list-decimal list-inside space-y-2 text-gray-300">
            <li>Download base ROM</li>
            <li>Download patch / ROM</li>
            <li>Use patcher tool (if needed)</li>
            <li>Play on emulator</li>
          </ol>
        </div>

        {/* RELATED HACKS */}
        <div className="mt-10">
          <h2 className="text-2xl font-bold mb-4">Related Hacks</h2>

          {related.length === 0 ? (
            <p className="text-gray-400">No related hacks found</p>
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

      </div>
    </PageWrapper>
  );
}