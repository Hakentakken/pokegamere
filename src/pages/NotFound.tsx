import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import Atmosphere from "../components/Atmosphere";
import SplitHeading from "../components/SplitHeading";
import Reveal from "../components/Reveal";
import { DUR, EASE } from "../lib/motion";

const SUGGESTIONS = [
  { to: "/hacks", label: "ROM Hacks" },
  { to: "/patcher", label: "ROM Patcher" },
  { to: "/cheats", label: "Cheats" },
  { to: "/emulators", label: "Emulators" },
];

export default function NotFound() {
  return (
    <div className="relative flex min-h-[75svh] flex-col items-center justify-center overflow-hidden px-6 text-center">
      <Atmosphere tone="hero" grid={false} />

      <div className="relative">
        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: DUR.component, ease: EASE.out }}
          className="type-overline text-brand-400"
        >
          Error
        </motion.p>

        <SplitHeading
          as="h1"
          text="404"
          className="type-hero mt-4 font-display font-bold text-white"
        />

        <Reveal as="up" delay={0.15}>
          <p className="type-lede mx-auto mt-5 max-w-md">
            This route is not in the catalogue. It may have moved, or never existed at all.
          </p>
        </Reveal>

        <Reveal as="up" delay={0.25}>
          <Link to="/" className="btn-hero mt-9">
            Back to home
          </Link>
        </Reveal>

        <Reveal as="up" delay={0.35}>
          <div className="mt-12">
            <p className="type-overline text-neutral-600">Try one of these</p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {SUGGESTIONS.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-neutral-300 transition-[border-color,color,transform] duration-500 ease-cinematic hover:-translate-y-0.5 hover:border-brand/50 hover:text-white"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </div>
  );
}