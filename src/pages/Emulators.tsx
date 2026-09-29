import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "../lib/supabase";
import PageWrapper from "../components/PageWrapper";
import PageHero from "../components/PageHero";
import Skeleton from "../components/Skeleton";
import CtaBand from "../components/CtaBand";
import { DUR, EASE, stagger } from "../lib/motion";

export default function Emulators() {
  const [emulators, setEmulators] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEmulators = async () => {
    const { data } = await supabase.from("emulators").select("*");
    setEmulators(data || []);
    setLoading(false);
  };

  useEffect(() => {
    void fetchEmulators();
  }, []);

  return (
    <PageWrapper>
      <PageHero
        eyebrow="Toolkit"
        title="Emulators"
        lede="Everything you need to run your patched adventures on any device."
      />

      <div className="shell band-tight">
        {loading ? (
          <div className="grid gap-6 md:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-64 w-full rounded-2xl" />
            ))}
          </div>
        ) : emulators.length === 0 ? (
          <div className="panel flex flex-col items-center gap-3 px-6 py-16 text-center">
            <span className="text-3xl" aria-hidden="true">
              🚧
            </span>
            <p className="text-lg text-neutral-400">Emulators Coming Soon...</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-3">
            {emulators.map((e, i) => (
              <motion.article
                key={e.id}
                initial={{ opacity: 0, y: 26 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "0px 0px -8% 0px" }}
                transition={{ duration: DUR.section, delay: stagger(i, 0.09), ease: EASE.out }}
                className="group glass edge-lit relative flex h-full flex-col rounded-2xl p-6 transition-[border-color,transform,box-shadow] duration-500 ease-cinematic hover:-translate-y-1 hover:border-white/20 hover:shadow-panel"
              >
                <span className="light-layer" aria-hidden="true" />

                <span className="eyebrow relative">
                  <span className="h-px w-6 bg-brand/70" aria-hidden="true" />
                  {e.platform}
                </span>

                <h2 className="relative mt-3 font-display text-xl font-bold text-white transition-colors duration-300 group-hover:text-brand-400">
                  {e.name}
                </h2>

                <p className="relative mt-2 text-sm leading-relaxed text-neutral-400">
                  {e.description}
                </p>

                <div className="relative mt-auto pt-5">
                  {e.download_link ? (
                    <a
                      href={e.download_link}
                      target="_blank"
                      rel="noreferrer"
                      className="block rounded-lg bg-brand px-4 py-2.5 text-center text-sm font-semibold text-oncolor transition duration-300 hover:bg-brand-600 hover:shadow-glow-sm"
                    >
                      Download
                    </a>
                  ) : (
                    <span className="block rounded-lg border border-white/10 bg-white/[0.03] px-4 py-2.5 text-center text-sm text-neutral-500">
                      Link coming soon
                    </span>
                  )}
                </div>
              </motion.article>
            ))}
          </div>
        )}
      </div>

      <CtaBand
        eyebrow="First time patching?"
        title="Start with a clean base game"
        lede="Grab an emulator, apply a patch to your own copy, and you are playing in minutes."
        primary={{ label: "Browse hacks", to: "/hacks" }}
        secondary={{ label: "Read the Q&A", to: "/qa" }}
      />
    </PageWrapper>
  );
}