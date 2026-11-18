import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "../lib/supabase";
import PageWrapper from "../components/PageWrapper";
import PageHero from "../components/PageHero";
import Skeleton from "../components/Skeleton";
import CtaBand from "../components/CtaBand";
import { DUR, EASE, stagger } from "../lib/motion";
import { useSeo } from "../lib/seo";

type Cheat = { id: string; title: string; game: string; code: string; description: string };
const needsParameters = (code: string) => /\[[^\]]+\]/.test(code);

export default function Cheats() {
  useSeo({
    title: "Pokémon Cheat Codes",
    description: "Search any game, copy a cheat code, and jump straight back into the action.",
    canonicalPath: "/cheats",
  });
  const [cheats, setCheats] = useState<Cheat[]>([]);
  const [search, setSearch] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCheats = async () => {
    const { data, error: queryError } = await supabase
      .from("cheats")
      .select("id, created_at, title, game, code, description");
    if (queryError) setError("The code catalogue could not be loaded. Please try again later.");
    setCheats(data || []);
    setLoading(false);
  };

  useEffect(() => {
    void fetchCheats();
  }, []);

  const filtered = cheats.filter(
    (c) =>
      c.title?.toLowerCase().includes(search.toLowerCase()) ||
      c.game?.toLowerCase().includes(search.toLowerCase())
  );

  const handleCopy = async (c: Cheat) => {
    if (needsParameters(c.code)) return;
    try { await navigator.clipboard.writeText(c.code); }
    catch { setError("Copy failed. Select the code and copy it manually."); return; }
    setCopiedId(c.id);
    window.setTimeout(() => {
      setCopiedId((prev) => (prev === c.id ? null : prev));
    }, 1800);
  };

  return (
    <PageWrapper>
      <PageHero
        eyebrow="Code vault"
        title="Cheat Codes"
        lede="Search any game, copy a code, and jump straight back into the action."
      >
        {/* SEARCH */}
        <div className="relative max-w-md">
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
            placeholder="Search cheats..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search cheats"
            className="input pl-11"
          />
        </div>
      </PageHero>

      <section className="shell pt-10 text-neutral-300 leading-relaxed">
        <div className="max-w-3xl">
          <h2 className="font-display text-2xl font-bold text-white">Check compatibility before enabling a code</h2>
          <p className="mt-4">A hack based on FireRed or Emerald may change the memory locations that a cheat writes to. Sharing a base game does not establish compatibility. These entries are not a test of your specific release; check the creator's instructions and your emulator's supported code formats.</p>
          <ol className="mt-4 list-decimal space-y-3 pl-6"><li>Make an in-game save and keep a separate backup. Never experiment on your only copy of a long playthrough.</li><li>Keep required lines together and enable one documented cheat at a time. Do not combine unrelated teleport destinations or item modifiers.</li><li>If the game freezes or inventory changes unexpectedly, disable the code and restart from the clean backup. Turning a code off may not undo changes already written to a save.</li><li>Bracketed parameters identify incomplete templates. Find the exact value and instructions from the original source before use; copying these entries is disabled.</li></ol>
          {error && <p role="alert" className="mt-5 text-amber-300">{error}</p>}
        </div>
      </section>
      <div className="shell band-tight">
        {loading ? (
          <div className="space-y-4">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} variant="row" />
            ))}
          </div>
        ) : cheats.length === 0 ? (
          <div className="panel flex flex-col items-center gap-3 px-6 py-16 text-center">
            <span className="text-3xl" aria-hidden="true">
              🚧
            </span>
            <p className="text-lg text-neutral-400">Cheats Coming Soon...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="panel flex flex-col items-center gap-3 px-6 py-16 text-center">
            <span className="text-3xl" aria-hidden="true">
              🔍
            </span>
            <p className="text-neutral-400">No cheats match your search.</p>
          </div>
        ) : (
          <motion.div layout className="space-y-4">
            {filtered.map((c, i) => (
              <motion.article
                key={c.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: DUR.component, delay: stagger(i, 0.06), ease: EASE.out }}
                className="group glass edge-lit relative rounded-2xl p-5 transition-[border-color,transform] duration-500 ease-cinematic hover:-translate-y-1 hover:border-white/20"
              >
                <span className="light-layer" aria-hidden="true" />

                <div className="relative flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h2 className="font-display text-lg font-bold text-white transition-colors duration-300 group-hover:text-brand-400">
                      {c.title}
                    </h2>
                    <p className="mt-0.5 text-sm text-neutral-500">{c.game}</p>
                  </div>

                  <button
                    onClick={() => void handleCopy(c)}
                    disabled={needsParameters(c.code)}
                    className={`shrink-0 rounded-lg px-4 py-2 text-sm font-semibold transition duration-300 ${
                      copiedId === c.id
                        ? "bg-emerald-500/90 text-oncolor"
                        : "bg-brand text-oncolor hover:bg-brand-600 hover:shadow-glow-sm"
                    }`}
                  >
                    {needsParameters(c.code) ? "Incomplete template" : copiedId === c.id ? "Copied ✓" : "Copy Code"}
                  </button>
                </div>

                <pre className="relative mt-3 overflow-auto rounded-lg border border-white/10 bg-ink-950/80 p-3 font-mono text-sm leading-relaxed text-brand-300">
                  {c.code}
                </pre>

                {c.description && (
                  <p className="relative mt-3 text-sm leading-relaxed text-neutral-400">
                    {c.description}
                  </p>
                )}
              </motion.article>
            ))}
          </motion.div>
        )}
      </div>

      <CtaBand
        eyebrow="Need a code that isn't here?"
        title="Ask the community"
        lede="The Q&A covers the usual questions, and the channel has walkthroughs for most of the big hacks."
        primary={{ label: "Open the Q&A", to: "/qa" }}
        secondary={{ label: "Back to hacks", to: "/hacks" }}
      />
    </PageWrapper>
  );
}
