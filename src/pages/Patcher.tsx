import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import PageWrapper from "../components/PageWrapper";
import Atmosphere from "../components/Atmosphere";
import SplitHeading from "../components/SplitHeading";
import Reveal from "../components/Reveal";
import { DUR, EASE, stagger } from "../lib/motion";
import { supabase } from "../lib/supabase";
import { loadRomPatcherWeb, type RpBinFile } from "../lib/romPatcher";

const STAGES = [
  { label: "Drag in your legally obtained base ROM", done: true },
  { label: "Drop the patch on top", done: true },
  { label: "Apply, then load the result in an emulator", done: false },
];

/** Native pickers filter by these; the engine itself sniffs the real format. */
const ROM_ACCEPT =
  ".gb,.gbc,.gba,.nds,.ds,.n64,.z64,.v64,.sfc,.smc,.bin,.gen,.md,.gg,.pce,.zip,application/octet-stream";
const PATCH_ACCEPT = ".ips,.bps,.ups,.rup,.aps,.ppf,.bdf,.pmsr,.vcdiff,.xdelta,.zip,application/octet-stream";

type HackRow = {
  id: string;
  title: string;
  base_game: string;
  platform: string;
  download_link: string | null;
};

const formatBytes = (n: number) =>
  n >= 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(2)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`;


/**
 * ROM Patcher — the existing page, now powered by the bundled RomPatcher.js
 * engine (`/rom-patcher-js/`, official embedding API).
 *
 * React owns the UI and state; the engine owns file reading, checksum
 * workers, validation and patch application. They meet through the
 * engine-required elements rendered here and the
 * `oninitialize / onloadrom / onvalidaterom / onloadpatch / onpatch`
 * callbacks that drive the React state.
 *
 * Everything is client-side: the ROM is read locally, patched in a web worker
 * and saved straight back to the user — no upload anywhere. The engine is
 * initialized exactly once (Strict Mode safe) and re-wired to fresh inputs
 * if the user leaves the page and comes back.
 */
export default function Patcher() {
  const navigate = useNavigate();

  const romRef = useRef<HTMLInputElement>(null);
  const patchRef = useRef<HTMLInputElement>(null);
  const applyRef = useRef<HTMLButtonElement>(null);

  const [hacks, setHacks] = useState<HackRow[]>([]);
  const [hackId, setHackId] = useState("");
  const selectedHack = hacks.find((h) => h.id === hackId) ?? null;

  // The engine callbacks are bound once, so they read the latest selection
  // through a ref instead of a stale closure.
  const selectedHackRef = useRef<HackRow | null>(null);
  useEffect(() => {
    selectedHackRef.current = selectedHack;
  }, [selectedHack]);

  const [engineReady, setEngineReady] = useState(false);
  const [engineError, setEngineError] = useState<string | null>(null);
  const [rom, setRom] = useState<{ name: string; size: number } | null>(null);
  const [romValid, setRomValid] = useState<boolean | null>(null);
  const [patchName, setPatchName] = useState<string | null>(null);
  const [output, setOutput] = useState<{ name: string; url: string } | null>(null);
  const outputRef = useRef<{ name: string; url: string } | null>(null);

  const clearOutput = () => {
    if (outputRef.current) {
      URL.revokeObjectURL(outputRef.current.url);
      outputRef.current = null;
    }
    setOutput(null);
  };

  /* Real hacks from the existing table — the picker's options and the
     patched file's output name come from this data, nothing invented. */
  useEffect(() => {
    let alive = true;
    supabase
      .from("hacks")
      .select("id, title, base_game, platform, download_link")
      .order("created_at", { ascending: false })
      .limit(100)
      .then(({ data, error }) => {
        if (!alive || error || !data) return;
        setHacks(
          data.map((row) => ({
            id: String(row.id),
            title: row.title || "Untitled hack",
            base_game: row.base_game || "",
            platform: row.platform || "",
            download_link: row.download_link || null,
          }))
        );
      });
    return () => {
      alive = false;
    };
  }, []);

  /* Load + initialize the engine exactly once, client-side only. */
  useEffect(() => {
    let cancelled = false;
    let detach: (() => void) | null = null;

    const settings = {
      language: "en",
      // Real enforcement: patches embedding a source checksum (BPS/UPS/RUP…)
      // block incompatible ROMs in the UI and in the worker. Formats without
      // one (IPS…) have nothing to enforce — validateRom allows them.
      requireValidation: true,
      // Drops are handled by the React cards, so the engine never binds
      // listeners to DOM nodes React may later destroy.
      allowDropFiles: false,
      outputSuffix: true,
      oninitialize: () => {
        if (!cancelled) setEngineReady(true);
      },
      onloadrom: (romFile: RpBinFile) => {
        if (cancelled) return;
        setRom({ name: romFile.fileName, size: romFile.fileSize });
        setRomValid(null);
        clearOutput();
      },
      onvalidaterom: (_romFile: RpBinFile, valid: boolean) => {
        if (!cancelled) setRomValid(valid);
      },
      onloadpatch: (binFile: RpBinFile) => {
        if (cancelled) return;
        setPatchName(binFile.fileName);
        clearOutput();
      },
      onpatch: (patchedRom: RpBinFile) => {
        if (cancelled) return;
        // Output naming from the selected hack's real metadata; the engine
        // saves (downloads) the file right after this callback returns.
        const hack = selectedHackRef.current;
        if (hack?.title) {
          try {
            patchedRom.setName(hack.title); // keeps the ROM's own extension
          } catch {
            /* keep the engine's default name */
          }
        }
        const url = URL.createObjectURL(
          new Blob([patchedRom._u8array as unknown as BlobPart], { type: "application/octet-stream" })
        );
        const next = { name: patchedRom.fileName, url };
        if (outputRef.current) URL.revokeObjectURL(outputRef.current.url);
        outputRef.current = next;
        setOutput(next);
      },
    };

    loadRomPatcherWeb()
      .then(() => {
        if (cancelled) return;
        const romInput = romRef.current;
        const patchInput = patchRef.current;
        const applyBtn = applyRef.current;
        if (!romInput || !patchInput || !applyBtn) return;
        if (romInput.dataset.rpBound) return; // this DOM already owns engine listeners

        try {
          if (RomPatcherWeb.isInitialized()) {
            // A previous visit initialized the engine against DOM nodes React
            // has since destroyed — re-point its API at the fresh inputs.
            const onRom = () => {
              const file = romInput.files?.[0];
              if (file) new BinFile(file, RomPatcherWeb.provideRomFile);
            };
            const onPatch = () => {
              const file = patchInput.files?.[0];
              if (file) new BinFile(file, RomPatcherWeb.providePatchFile);
            };
            const onApply = () => {
              if (!romInput.files?.length || !patchInput.files?.length) {
                RomPatcherWeb.setErrorMessage("Select a ROM and a patch file first");
                return;
              }
              RomPatcherWeb.applyPatch();
            };
            romInput.addEventListener("change", onRom);
            patchInput.addEventListener("change", onPatch);
            applyBtn.addEventListener("click", onApply);
            detach = () => {
              romInput.removeEventListener("change", onRom);
              patchInput.removeEventListener("change", onPatch);
              applyBtn.removeEventListener("click", onApply);
            };
            // Refresh the callbacks so they belong to THIS React instance.
            RomPatcherWeb.setSettings(settings);
            setEngineReady(true);
          } else {
            RomPatcherWeb.initialize(settings);
          }
          romInput.dataset.rpBound = "1";
          patchInput.dataset.rpBound = "1";
          applyBtn.dataset.rpBound = "1";
        } catch (err) {
          setEngineError(err instanceof Error ? err.message : "Could not start the patcher");
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setEngineError(err instanceof Error ? err.message : "Could not load RomPatcher.js");
        }
      });

    return () => {
      cancelled = true;
      detach?.();
    };
  }, []);

  /* Belt and braces: an incompatible ROM must leave Apply disabled even when
     the engine re-enables everything after loading the patch. */
  useEffect(() => {
    if (engineReady && romValid === false && applyRef.current) {
      applyRef.current.disabled = true;
    }
  }, [engineReady, romValid]);

  useEffect(() => () => clearOutput(), []);

  /* Drag & drop feeds the same engine entry points as the file inputs —
     the stage cards say "drag in" / "drop on top", so they mean it. */
  const allowDrop = (e: React.DragEvent) => e.preventDefault();
  const makeDrop = (target: "rom" | "patch") => (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer?.files?.[0];
    if (!file || !engineReady) return;
    new BinFile(file, (binFile: RpBinFile) => {
      if (target === "patch") {
        RomPatcherWeb.providePatchFile(binFile, true);
        return;
      }
      // Mirror the engine's own drop discrimination: a patch dropped on the
      // ROM step is routed to the patch slot instead of being read as a ROM.
      let looksLikePatch = false;
      try {
        looksLikePatch = !!RomPatcher.parsePatchFile(binFile);
      } catch {
        looksLikePatch = false;
      }
      if (looksLikePatch) RomPatcherWeb.providePatchFile(binFile, true);
      else RomPatcherWeb.provideRomFile(binFile, true);
    });
  };

  return (
    <PageWrapper>
      <section className="grain relative isolate flex min-h-[80svh] items-center overflow-hidden">
        <Atmosphere tone="hero" sweep />

        <div className="shell relative py-28 text-center">
          <motion.span
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: DUR.component, ease: EASE.out }}
            className="eyebrow mx-auto"
          >
            <span className="h-px w-8 bg-brand/70" aria-hidden="true" />
            In your browser
            <span className="h-px w-8 bg-brand/70" aria-hidden="true" />
          </motion.span>

          <SplitHeading
            as="h1"
            text="ROM Patcher"
            sub="Nothing uploaded"
            subClassName="font-display text-xl font-medium text-brand-400 sm:text-2xl"
            className="type-display mt-8 font-display font-bold text-white"
          />

          <Reveal as="up" delay={0.3}>
            <p className="type-lede mx-auto mt-6 max-w-xl">
              Patch a ROM in your browser, with nothing uploaded anywhere. Choose your hack, drop
              in your ROM and its patch, apply, then download the result.
            </p>
          </Reveal>

          {/* Hack picker — real rows from the existing `hacks` table. Choosing
              one names the patched output; "Get the patch file" opens the
              hack's existing download link so the patch can be picked below. */}
          <Reveal as="up" delay={0.35}>
            <div className="glass mx-auto mt-9 max-w-3xl rounded-2xl p-5 text-left">
              <span className="type-overline text-neutral-600">Select hack</span>
              <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
                <select
                  className="input"
                  aria-label="Select hack"
                  value={hackId}
                  onChange={(e) => setHackId(e.target.value)}
                >
                  <option value="">No preference — default output name</option>
                  {hacks.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.title}
                    </option>
                  ))}
                </select>
                {selectedHack?.download_link && (
                  <button
                    type="button"
                    className="btn-hero-ghost shrink-0"
                    onClick={() => window.open(selectedHack.download_link!, "_blank", "noopener")}
                  >
                    Get the patch file
                  </button>
                )}
              </div>
              {selectedHack && (
                <p className="mt-2 text-xs leading-relaxed text-neutral-500">
                  {[selectedHack.base_game, selectedHack.platform].filter(Boolean).join(" · ")}
                  {" — the patched file will be named after this hack."}
                </p>
              )}
            </div>
          </Reveal>

          {/* The real three-step flow — same stage cards, same entrance
              animation, now containing the working patcher controls. */}
          <Reveal as="up" delay={0.4}>
            <ol className="mx-auto mt-12 grid max-w-3xl gap-3 text-left sm:grid-cols-3">
              {STAGES.map((stage, i) => (
                <motion.li
                  key={stage.label}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: DUR.component, delay: 0.5 + stagger(i, 0.12), ease: EASE.out }}
                  className="glass rounded-2xl p-5"
                >
                  <div
                    onDragOver={i < 2 ? allowDrop : undefined}
                    onDrop={i === 0 ? makeDrop("rom") : i === 1 ? makeDrop("patch") : undefined}
                  >
                    <span className="type-overline text-neutral-600">Step {i + 1}</span>
                    <p className="mt-2 text-sm leading-relaxed text-neutral-300">{stage.label}</p>

                    {/* STEP 1 — ROM input (engine-required element) */}
                    {i === 0 && (
                      <>
                        <input
                          ref={romRef}
                          id="rom-patcher-input-file-rom"
                          type="file"
                          accept={ROM_ACCEPT}
                          disabled
                          className="input mt-3 w-full cursor-pointer"
                        />
                        <p className="mt-2 font-mono text-[10px] break-all tracking-[0.12em] text-neutral-600 uppercase">
                          CRC32 <span id="rom-patcher-span-crc32" /> · MD5{" "}
                          <span id="rom-patcher-span-md5" />
                        </p>
                        <div id="rom-patcher-row-info-rom" className="mt-1 text-xs text-neutral-500">
                          <span id="rom-patcher-span-rom-info" />
                        </div>
                        {rom && (
                          <p className="mt-1 truncate text-xs text-neutral-400">
                            {rom.name} · {formatBytes(rom.size)}
                          </p>
                        )}
                        {romValid !== null && (
                          <p
                            className={`mt-1 text-xs ${romValid ? "text-emerald-400" : "text-red-400"}`}
                          >
                            {romValid
                              ? "Base ROM matches this patch"
                              : "Base ROM does not match this patch"}
                          </p>
                        )}
                      </>
                    )}

                    {/* STEP 2 — patch input (engine-required element) */}
                    {i === 1 && (
                      <>
                        <input
                          ref={patchRef}
                          id="rom-patcher-input-file-patch"
                          type="file"
                          accept={PATCH_ACCEPT}
                          disabled
                          className="input mt-3 w-full cursor-pointer"
                        />
                        <div
                          id="rom-patcher-row-patch-description"
                          className="mt-1 text-xs leading-relaxed text-neutral-500"
                        >
                          <span id="rom-patcher-patch-description" />
                        </div>
                        {patchName && (
                          <p className="mt-1 truncate text-xs text-neutral-400">{patchName}</p>
                        )}
                      </>
                    )}

                    {/* STEP 3 — apply, engine status, result */}
                    {i === 2 && (
                      <>
                        <button
                          ref={applyRef}
                          id="rom-patcher-button-apply"
                          type="button"
                          disabled
                          className="btn-hero mt-3 w-full disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Apply patch
                        </button>
                        <div
                          id="rom-patcher-row-error-message"
                          className="mt-3 text-xs leading-relaxed text-red-400"
                        >
                          <span id="rom-patcher-error-message" />
                        </div>
                        {engineError && (
                          <p className="mt-2 text-xs text-red-400">{engineError}</p>
                        )}
                        {output && (
                          <div className="mt-3">
                            <p className="truncate text-xs text-emerald-400">
                              {output.name} is ready — check your downloads.
                            </p>
                            <a
                              href={output.url}
                              download={output.name}
                              className="btn-ghost mt-2 inline-flex"
                            >
                              Download again
                            </a>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </motion.li>
              ))}
            </ol>
          </Reveal>

          <Reveal as="up" delay={0.7}>
            <div className="mt-12 flex flex-wrap justify-center gap-3">
              <button onClick={() => navigate("/qa")} className="btn-hero">
                How to patch by hand
              </button>
              <button onClick={() => navigate("/hacks")} className="btn-hero-ghost">
                Browse hacks
              </button>
            </div>
          </Reveal>
        </div>
      </section>
    </PageWrapper>
  );
}