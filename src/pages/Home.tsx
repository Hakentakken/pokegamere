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

        {/* 🔥 HERO */}
        <div className="text-center py-20 px-4 bg-gradient-to-b from-black via-gray-900 to-black">
          
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4 text-red-500">
            PokéSmith
          </h1>

          <p className="text-gray-300 text-lg mb-4">
            Discover Amazing Pokémon ROM Hacks
          </p>

          <p className="text-gray-400 max-w-2xl mx-auto mb-6">
            Explore fan-made Pokémon adventures, download patches, cheats, and emulators — all in one place.
          </p>

          <div className="flex justify-center gap-4 flex-wrap">
            <button
              onClick={() => navigate("/hacks")}
              className="bg-red-500 px-6 py-3 rounded-lg hover:bg-red-600 transition"
            >
              Browse ROM Hacks
            </button>

            <button
              onClick={() => navigate("/patcher")}
              className="border border-white/20 px-6 py-3 rounded-lg hover:bg-white hover:text-black transition"
            >
              ROM Patcher
            </button>
          </div>
        </div>

        {/* 🎥 YOUTUBE PROMO */}
        <div className="py-12 border-t border-white/10 border-b border-white/10">

  <h2 className="text-2xl font-bold text-center text-red-500 mb-8">
    Our YouTube Channel
  </h2>

  <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-8 items-center">

    {/* 🎥 VIDEO */}
    <div className="w-full aspect-video">
      <iframe
        className="w-full h-full rounded-xl"
        src="https://www.youtube.com/embed/rECqu6ywMnY"
        title="YouTube video"
        allowFullScreen
      ></iframe>
    </div>

    {/* 📺 CHANNEL INFO */}
    <div className="glass p-6 rounded-2xl space-y-4 text-center md:text-left">

      <h3 className="text-xl font-bold">
        @InvincibleGreninjaIsHere
      </h3>

      <p className="text-gray-400">
        Watch gameplay, ROM hacks, tutorials, and more Pokémon content.
      </p>

      <a
        href="https://www.youtube.com/@InvincibleGreninjaIsHere"
        target="_blank"
        className="inline-block bg-red-500 px-6 py-3 rounded-lg hover:bg-red-600 transition"
      >
        Visit Channel
      </a>

    </div>

  </div>
</div>
       

        {/* 🚀 LATEST HACKS */}
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

          {/* EMPTY STATE */}
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

        {/* 🔻 FOOTER (ADS READY) */}
        <div className="border-t border-white/10 py-6 text-center text-sm text-gray-400">
          <p>© {new Date().getFullYear()} PokéSmith</p>

          <div className="flex justify-center gap-4 mt-2 flex-wrap">
            <button onClick={() => navigate("/about")} className="hover:text-white">
              About
            </button>
            <button onClick={() => navigate("/privacy")} className="hover:text-white">
              Privacy
            </button>
            <button onClick={() => navigate("/contact")} className="hover:text-white">
              Contact
            </button>
          </div>
        </div>

      </div>
    </PageWrapper>
  );
}