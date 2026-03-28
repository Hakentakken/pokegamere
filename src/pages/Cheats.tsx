import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import PageWrapper from "../components/PageWrapper";

export default function Cheats() {
  const [cheats, setCheats] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchCheats();
  }, []);

  const fetchCheats = async () => {
    const { data } = await supabase.from("cheats").select("*");
    setCheats(data || []);
  };

  const filtered = cheats.filter(
    (c) =>
      c.title?.toLowerCase().includes(search.toLowerCase()) ||
      c.game?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <PageWrapper>
      <div className="min-h-screen bg-black text-white p-6 max-w-5xl mx-auto">

        <h1 className="text-3xl font-bold mb-6 text-red-500">
          Cheat Codes
        </h1>

        {/* SEARCH */}
        <input
          placeholder="Search cheats..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full p-2 mb-6 bg-gray-800 rounded"
        />

        {/* EMPTY STATE */}
        {cheats.length === 0 ? (
          <div className="text-center mt-20 text-gray-400 text-xl">
            🚧 Cheats Coming Soon...
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((c) => (
              <div key={c.id} className="glass p-4 rounded-xl">

                <h2 className="text-lg font-bold">{c.title}</h2>
                <p className="text-sm text-gray-400">{c.game}</p>

                <pre className="bg-gray-900 p-3 rounded mt-2 text-sm overflow-auto">
                  {c.code}
                </pre>

                <p className="text-gray-300 mt-2 text-sm">
                  {c.description}
                </p>

                <button
                  onClick={() => navigator.clipboard.writeText(c.code)}
                  className="mt-3 bg-red-500 px-3 py-1 rounded text-sm"
                >
                  Copy Code
                </button>

              </div>
            ))}
          </div>
        )}

      </div>
    </PageWrapper>
  );
}