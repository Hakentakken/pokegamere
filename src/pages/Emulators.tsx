import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import PageWrapper from "../components/PageWrapper";

export default function Emulators() {
  const [emulators, setEmulators] = useState<any[]>([]);

  useEffect(() => {
    fetchEmulators();
  }, []);

  const fetchEmulators = async () => {
    const { data } = await supabase.from("emulators").select("*");
    setEmulators(data || []);
  };

  return (
    <PageWrapper>
      <div className="min-h-screen bg-black text-white p-6 max-w-6xl mx-auto">

        <h1 className="text-3xl font-bold mb-6 text-red-500">
          Emulators
        </h1>

        {/* EMPTY STATE */}
        {emulators.length === 0 ? (
          <div className="text-center mt-20 text-gray-400 text-xl">
            🚧 Emulators Coming Soon...
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-6">
            {emulators.map((e) => (
              <div key={e.id} className="glass p-4 rounded-xl">

                <h2 className="text-xl font-bold">{e.name}</h2>

                <span className="text-sm text-gray-400">
                  {e.platform}
                </span>

                <p className="text-gray-300 mt-2 text-sm">
                  {e.description}
                </p>

                <a
                  href={e.download_link}
                  target="_blank"
                  className="block mt-4 bg-red-500 text-center py-2 rounded hover:bg-red-600"
                >
                  Download
                </a>

              </div>
            ))}
          </div>
        )}

      </div>
    </PageWrapper>
  );
}