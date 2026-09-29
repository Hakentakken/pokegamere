import { useEffect, useState } from "react";
import PageWrapper from "../components/PageWrapper";
import Marquee from "../components/Marquee";
import CtaBand from "../components/CtaBand";
import Hero from "../components/home/Hero";
import FeaturedBand from "../components/home/FeaturedBand";
import CategoryBand, { type Category } from "../components/home/CategoryBand";
import ProcessBand from "../components/home/ProcessBand";
import StudioBand from "../components/home/StudioBand";
import { supabase } from "../lib/supabase";
import { normalizeImageUrl } from "../lib/imageUrl";
import type { HackRecord } from "../components/FeaturedHack";

type Stats = { hacks: number; cheats: number; emulators: number } | null;

const TICKER = [
  "ROM Hacks",
  "Cheats",
  "Emulators",
  "ROM Patcher",
  "Q&A",
  "GBA · NDS · Classic",
  "Fan-made adventures",
  "Fresh drops",
];

/**
 * Home — the full arc: arrival → discovery → categories → how it works →
 * studio → call to action.
 *
 * The existing `hacks` query is unchanged. Two extra read-only queries add the
 * category breakdown and the live counts; both are optional, and the page
 * simply omits those bands if they fail.
 */
export default function Home() {
  const [latestHacks, setLatestHacks] = useState<HackRecord[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [stats, setStats] = useState<Stats>(null);
  const [loading, setLoading] = useState(true);

  const fetchLatest = async () => {
    const { data, error } = await supabase
      .from("hacks")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(4);

    if (error) {
      console.error(error);
      setLoading(false);
      return;
    }

    const formatted: HackRecord[] = (data || []).map((hack: any) => ({
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
    setLoading(false);

    // Optional enrichment — never blocks or breaks the page above.
    void loadCategories();
    void loadStats();
  };

  useEffect(() => {
    void fetchLatest();
  }, []);

  /** Base games that actually exist in the catalogue, with counts. */
  const loadCategories = async () => {
    try {
      const { data, error } = await supabase.from("hacks").select("base_game").limit(200);
      if (error || !data) return;

      const counts = new Map<string, number>();
      for (const row of data as any[]) {
        const name = (row.base_game || "").trim();
        if (!name) continue;
        counts.set(name, (counts.get(name) ?? 0) + 1);
      }

      setCategories(
        [...counts.entries()]
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
          .slice(0, 6)
      );
    } catch (err) {
      console.error(err);
    }
  };

  /** Row counts for the hero's stat strip. */
  const loadStats = async () => {
    try {
      const [hacks, cheats, emulators] = await Promise.all([
        supabase.from("hacks").select("id", { count: "exact", head: true }),
        supabase.from("cheats").select("id", { count: "exact", head: true }),
        supabase.from("emulators").select("id", { count: "exact", head: true }),
      ]);
      setStats({
        hacks: hacks.count ?? 0,
        cheats: cheats.count ?? 0,
        emulators: emulators.count ?? 0,
      });
    } catch (err) {
      console.error(err);
    }
  };

  const covers = latestHacks
    .map((hack) => normalizeImageUrl(hack.coverImage))
    .filter(Boolean)
    .slice(0, 3);

  return (
    <PageWrapper>
      <div className="bg-ink-950 text-white">
        <Hero covers={covers} stats={stats} />

        {/* ⚡ ENERGY TICKER */}
        <div className="border-y border-white/10 bg-ink-900/60 py-3">
          <Marquee items={TICKER} label="PokéSmith — ROM hacks, cheats, emulators and patching" />
        </div>

        <FeaturedBand hacks={latestHacks} loading={loading} />
        <CategoryBand categories={categories} loading={loading} />
        <ProcessBand />
        <StudioBand />

        <CtaBand
          primary={{ label: "Browse ROM Hacks", to: "/hacks" }}
          secondary={{ label: "Read the Q&A", to: "/qa" }}
        />
      </div>
    </PageWrapper>
  );
}