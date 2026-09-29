import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import HackCard from "../components/HackCard";
import PageWrapper from "../components/PageWrapper";
import PageHero from "../components/PageHero";
import Skeleton from "../components/Skeleton";
import CtaBand from "../components/CtaBand";
import { supabase } from "../lib/supabase";
import { DUR, EASE } from "../lib/motion";

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

/**
 * The library.
 *
 * The query is unchanged. Two frontend improvements ride on top of the same
 * data: the base-game filter is built from the games that actually exist
 * (instead of two hard-coded options), and it can be pre-selected from the
 * URL so the homepage category panels link straight into a filtered view.
 */
export default function Hacks() {
  const [hacks, setHacks] = useState<Hack[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const [filter, setFilter] = useState(searchParams.get("base") || "All");
  const [sort, setSort] = useState("name");

  const fetchHacks = async () => {
    const { data, error } = await supabase.from("hacks").select("*");

    setLoading(false);
    if (error) {
      console.error(error);
      return;
    }

    // 🔥 Map DB → Frontend format
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

    setHacks(formatted);
  };

  useEffect(() => {
    void fetchHacks();
  }, []);

  /** Base games present in the catalogue, so the filter never hides a game. */
  const baseGames = useMemo(() => {
    const found = new Set<string>();
    for (const hack of hacks) if (hack.baseGame) found.add(hack.baseGame);
    return [...found].sort((a, b) => a.localeCompare(b));
  }, [hacks]);

  // If the URL asked for a game that does not exist, fall back to "All".
  const activeFilter = filter !== "All" && !baseGames.includes(filter) && !loading ? "All" : filter;

  const filtered = hacks.filter((hack) =>
    activeFilter === "All" ? true : hack.baseGame === activeFilter
  );

  const sorted = [...filtered].sort((a, b) => {
    if (sort === "name") return a.title.localeCompare(b.title);
    if (sort === "rating") return b.rating - a.rating;
    return 0;
  });

  return (
    <PageWrapper>
      <PageHero
        eyebrow="Library"
        title="ROM Hacks"
        lede="Fan-made Pokémon adventures — filter by base game, sort by rating, and dive in."
      />

      <div className="shell band-tight">
        {/* Filters toolbar */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: DUR.component, delay: 0.1, ease: EASE.out }}
          className="glass sticky top-20 z-30 flex flex-wrap items-center gap-x-5 gap-y-3 rounded-2xl px-5 py-4"
        >
          <span className="type-overline text-neutral-500">Refine</span>

          <select
            aria-label="Filter by base game"
            className="input w-auto cursor-pointer"
            value={activeFilter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="All">All Games</option>
            {baseGames.map((game) => (
              <option key={game} value={game}>
                {game}
              </option>
            ))}
          </select>

          <select
            aria-label="Sort hacks"
            className="input w-auto cursor-pointer"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            <option value="name">Sort by Name</option>
            <option value="rating">Sort by Rating</option>
          </select>

          <span className="ml-auto font-mono text-[11px] tracking-widest text-neutral-500 uppercase">
            {sorted.length} {sorted.length === 1 ? "hack" : "hacks"}
          </span>
        </motion.div>

        {/* Grid */}
        {loading ? (
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} variant="card" className="h-full" />
            ))}
          </div>
        ) : sorted.length === 0 ? (
          <div className="panel mt-10 flex flex-col items-center gap-3 px-6 py-16 text-center">
            <span className="text-3xl" aria-hidden="true">
              🕹️
            </span>
            <p className="text-neutral-400">No hacks match this filter yet.</p>
          </div>
        ) : (
          <motion.div
            key={`${activeFilter}-${sort}`}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: DUR.component, ease: EASE.out }}
            className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
          >
            {sorted.map((hack, i) => (
              <HackCard key={hack.id} {...hack} index={i} />
            ))}
          </motion.div>
        )}
      </div>

      <CtaBand
        eyebrow="Not sure where to start?"
        title="Get the basics first"
        lede="Patching takes two minutes once you know how. The Q&A covers the rest."
        primary={{ label: "Read the Q&A", to: "/qa" }}
        secondary={{ label: "Open the patcher", to: "/patcher" }}
      />
    </PageWrapper>
  );
}