import { useEffect, useState } from "react";
import HackCard from "../components/HackCard";
import PageWrapper from "../components/PageWrapper";
import { supabase } from "../lib/supabase";

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

export default function Hacks() {
  const [hacks, setHacks] = useState<Hack[]>([]);
  const [filter, setFilter] = useState("All");
  const [sort, setSort] = useState("name");

  useEffect(() => {
    fetchHacks();
  }, []);

  const fetchHacks = async () => {
    const { data, error } = await supabase.from("hacks").select("*");

    if (error) {
      console.error(error);
      return;
    }

    // 🔥 Map DB → Frontend format
    const formatted: Hack[] = data.map((hack: any) => ({
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

    setHacks(formatted);
  };

  // 🔎 Filter
  const filtered = hacks.filter((hack) =>
    filter === "All" ? true : hack.baseGame === filter
  );

  // 🔃 Sort
  const sorted = [...filtered].sort((a, b) => {
    if (sort === "name") return a.title.localeCompare(b.title);
    if (sort === "rating") return b.rating - a.rating;
    return 0;
  });

  return (
    <PageWrapper>
      <div className="p-4">
        
        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          
          <select
            className="bg-gray-800 p-2 rounded"
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="All">All Games</option>
            <option value="FireRed">FireRed</option>
            <option value="Emerald">Emerald</option>
          </select>

          <select
            className="bg-gray-800 p-2 rounded"
            onChange={(e) => setSort(e.target.value)}
          >
            <option value="name">Sort by Name</option>
            <option value="rating">Sort by Rating</option>
          </select>

        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {sorted.map((hack) => (
            <HackCard key={hack.id} {...hack} />
          ))}
        </div>

      </div>
    </PageWrapper>
  );
}