import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import HackCard from "../components/HackCard";
import PageWrapper from "../components/PageWrapper";
import { useNavigate } from "react-router-dom";

type Hack = {
  id: string;
  title: string;
  author: string;
  rating: number;
  baseGame: string;
  platform: string;
  status: string;
  coverImage: string;
  description: string;
};

export default function Home() {
  const [latestHacks, setLatestHacks] = useState<Hack[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchLatest();
  }, []);

  const fetchLatest = async () => {
    const { data, error } = await supabase
      .from("hacks")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(4);

    if (error) {
      console.error(error);
      return;
    }

    // 🔥 FIX: MAP DATA LIKE HACKS PAGE
    const formatted: Hack[] = (data || []).map((hack: any) => ({
      id: String(hack.id),
      title: hack.title,
      author: hack.author,
      rating: hack.rating || 0,
      baseGame: hack.base_game || "",
      platform: hack.platform || "",
      status: hack.status || "",
      coverImage: hack.cover_image || "",
      description: hack.description || "",
    }));

    setLatestHacks(formatted);
  };

  return (
    <PageWrapper>
      <div className="min-h-screen bg-black text-white">

        {/* HERO */}
        <div className="text-center py-20 px-4 bg-gradient-to-b from-black via-gray-900 to-black">
          
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4 text-red-500">
            Discover Amazing Pokémon ROM Hacks
          </h1>

          <p className="text-gray-400 max-w-2xl mx-auto mb-6">
            Explore fan-made Pokémon adventures, download patches and join the community
          </p>

          <div className="flex justify-center gap-4">
            <button
              onClick={() => navigate("/hacks")}
              className="bg-red-500 px-6 py-3 rounded-lg hover:bg-red-600"
            >
              Browse ROM Hacks
            </button>

            <button
              onClick={() => navigate("/patcher")}
              className="border border-white/20 px-6 py-3 rounded-lg hover:bg-white hover:text-black"
            >
              Patch a ROM
            </button>
          </div>
        </div>

        {/* LATEST HACKS */}
        <div className="max-w-6xl mx-auto px-4 py-12">

          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-red-500">
              Latest Hacks
            </h2>

            <button
              onClick={() => navigate("/hacks")}
              className="text-sm text-gray-400 hover:text-white"
            >
              View All →
            </button>
          </div>

          {latestHacks.length === 0 ? (
            <div className="text-center text-gray-400 mt-10">
              🚧 No hacks uploaded yet
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {latestHacks.map((hack) => (
                <HackCard key={hack.id} {...hack} />
              ))}
            </div>
          )}

        </div>

      </div>
    </PageWrapper>
  );
}