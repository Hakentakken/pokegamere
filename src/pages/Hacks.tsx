import { useEffect, useMemo, useRef, useState } from "react";
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
  /** Supabase `created_at` — ISO timestamp that drives the "Latest" sort. */
  createdAt: string;
};

/**
 * Search normalisation — NFD-decomposes and strips combining marks so "é"
 * and "e" match each other, lowercases, collapses every run of whitespace to
 * a single space and trims the ends, so "  PokéMon   GAIA " still matches a
 * stored "Pokemon Gaia". Applied to both the query and the fields and matched
 * with `includes`, so matching is case-, accent- and whitespace-tolerant
 * anywhere inside a word or a sentence, on either side.
 */
const normalize = (value: string | null | undefined) =>
  (value || "")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

/**
 * Upload time in epoch ms — missing or unparseable timestamps fall back to 0,
 * so rows without a date simply sink to the bottom of a newest-first sort
 * instead of producing a NaN comparator (which would scramble the list).
 */
const uploadTime = (hack: Hack) => {
  const t = Date.parse(hack.createdAt);
  return Number.isNaN(t) ? 0 : t;
};

/**
 * The library.
 *
 * The query is unchanged. Three frontend improvements ride on top of the same
 * data: the base-game filter is built from the games that actually exist
 * (instead of two hard-coded options), it can be pre-selected from the
 * URL so the homepage category panels link straight into a filtered view,
 * and the toolbar search narrows the same records (title, base game,
 * description, author, platform, status) as the visitor types.
 */
export default function Hacks() {
  const [hacks, setHacks] = useState<Hack[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const [filter, setFilter] = useState(searchParams.get("base") || "All");
  const [sort, setSort] = useState("name");
  const [query, setQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  /** Clear the query and hand focus back to the field, so typing can continue. */
  const clearSearch = () => {
    setQuery("");
    searchRef.current?.focus();
  };

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
      createdAt: hack.created_at || "",
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

  /** The active query, normalised once so every field compares the same way. */
  const searchTerm = normalize(query);

  const filtered = hacks.filter((hack) => {
    // The base-game filter and the search box narrow the list together.
    if (activeFilter !== "All" && hack.baseGame !== activeFilter) return false;
    if (!searchTerm) return true;
    return [
      hack.title,
      hack.baseGame,
      hack.description,
      hack.author,
      hack.platform,
      hack.status,
    ].some((field) => normalize(field).includes(searchTerm));
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sort === "name") return a.title.localeCompare(b.title);
    if (sort === "rating") return b.rating - a.rating;
    // Newest upload first (same direction as every other page's created_at
    // order); title breaks ties so equal timestamps keep a stable order.
    if (sort === "date")
      return uploadTime(b) - uploadTime(a) || a.title.localeCompare(b.title);
    return 0;
  });

  return (
    <PageWrapper>
      <PageHero
        eyebrow="Library"
        title="ROM Hacks"
        lede="Fan-made Pokémon adventures — search, filter by base game, sort by rating, and dive in."
      />

      <div className="shell band-tight">
        {/* Filters toolbar */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: DUR.component, delay: 0.1, ease: EASE.out }}
          className="glass sticky top-20 z-30 flex flex-wrap items-center gap-x-5 gap-y-3 rounded-2xl px-5 py-4"
        >
          {/* SEARCH — instant filter across every searchable field */}
          <div className="relative w-full sm:w-72 lg:w-80">
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-neutral-500"
            >
              <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.5" />
              <path d="m10.5 10.5 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>

            <input
              ref={searchRef}
              type="search"
              placeholder="Search by name, game, author..."
              aria-label="Search ROM hacks by title, base game, author or description"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape" && query) clearSearch();
              }}
              className="input pl-11 pr-9 [&::-webkit-search-cancel-button]:appearance-none"
            />

            {query && (
              <button
                type="button"
                onClick={clearSearch}
                aria-label="Clear search"
                className="absolute top-1/2 right-2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-neutral-500 transition-colors duration-300 hover:bg-white/10 hover:text-white"
              >
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
                  <path d="M1 1l8 8M9 1 1 9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
              </button>
            )}
          </div>

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
            <option value="date">Latest</option>
          </select>

          <span
            aria-live="polite"
            className="ml-auto font-mono text-[11px] tracking-widest text-neutral-500 uppercase"
          >
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
              {searchTerm ? "🔍" : "🕹️"}
            </span>
            <p className="text-neutral-400">
              {searchTerm ? (
                <>
                  No hacks match{" "}
                  <span className="font-medium text-neutral-200">“{query.trim()}”</span>.
                </>
              ) : (
                "No hacks match this filter yet."
              )}
            </p>
            {searchTerm && (
              <button
                type="button"
                onClick={clearSearch}
                className="mt-1 rounded-lg border border-white/15 px-4 py-2 text-sm font-medium text-neutral-200 transition duration-300 hover:border-white/40 hover:bg-white/10"
              >
                Clear search
              </button>
            )}
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