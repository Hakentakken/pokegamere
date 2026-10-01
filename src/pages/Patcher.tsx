import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import PageWrapper from "../components/PageWrapper";
import Atmosphere from "../components/Atmosphere";
import SplitHeading from "../components/SplitHeading";
import Reveal from "../components/Reveal";
import PatcherRoom, {
  type PatcherRoomHandle,
} from "../components/patcher/PatcherRoom";
import type { RoomStationId } from "../components/patcher/roomLayout";
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

type RoomStation = RoomStationId;

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

  /* Presentation-only camera state. The room component owns the 3D scene and the
     drag-to-look interaction; the page only tracks which station the camera has
     settled on so the chips can reflect it. Nothing here touches patching. */
  const [roomStation, setRoomStation] = useState<RoomStation>("center");
  const [roomReduced, setRoomReduced] = useState(false);
  const roomRef = useRef<PatcherRoomHandle | null>(null);
  const roomScrollRef = useRef(false);
  const roomStationsRef = useRef<Partial<Record<RoomStation, HTMLLIElement | null>>>({});
  // The three station mounts: real DOM the room projects every frame.
  const leftMount = useRef<HTMLDivElement | null>(null);
  const centerMount = useRef<HTMLDivElement | null>(null);
  const rightMount = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setRoomReduced(mq.matches);
    apply();
    mq.addEventListener?.("change", apply);
    return () => mq.removeEventListener?.("change", apply);
  }, []);

  /* Presentation only: when WebGL is unavailable the room falls back to a plain
     list, and a deliberate turn (chip or finished drag) scrolls that station
     into view. Never runs on load. */
  useEffect(() => {
    if (!roomScrollRef.current) return;
    roomScrollRef.current = false;
    const node = roomStationsRef.current[roomStation];
    node?.scrollIntoView({ behavior: roomReduced ? "auto" : "smooth", block: "center" });
  }, [roomStation, roomReduced]);

  const lookAtStation = (station: RoomStation) => {
    roomRef.current?.lookAt(station);
    setRoomStation(station);
    roomScrollRef.current = true;
  };

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
          {/* Station status chips — pure decoration, zero logic. Kept in the same
              place and order, with the glow dialled right down so the page
              reads as a control room rather than a neon cloud. */}
          <Reveal as="up" delay={0.32}>
            <div className="mt-7 flex flex-wrap justify-center gap-2 font-mono text-[11px] font-medium uppercase tracking-[0.22em]">
              <span className="inline-flex items-center gap-2 rounded-sm border border-emerald-400/20 bg-emerald-400/[0.05] px-4 py-1.5 text-emerald-300/90">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400/80" />
                In-browser
              </span>
              <span className="inline-flex items-center gap-2 rounded-sm border border-sky-400/20 bg-sky-400/[0.05] px-4 py-1.5 text-sky-300/90">
                <span className="h-1.5 w-1.5 rounded-full bg-sky-400/80" />
                No uploads
              </span>
              <span className="inline-flex items-center gap-2 rounded-sm border border-white/10 bg-white/[0.03] px-4 py-1.5 text-neutral-400">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-400/80" />
                IPS · BPS · UPS · APS · PPF
              </span>
            </div>
          </Reveal>

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
            <div className="glass patcher-panel relative mx-auto mt-9 max-w-3xl overflow-hidden rounded-xl p-5 text-left">
              <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-transparent via-brand-500/80 to-transparent" />
              <div className="flex items-center justify-between gap-3">
                <span className="type-overline font-mono text-neutral-500">Cartridge select</span>
                {/* Slot indicator — quiet hardware read-out, not an LED show. */}
                <span className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-500">
                  <span
                    aria-hidden="true"
                    className={`h-1.5 w-1.5 rounded-full ${
                      selectedHack ? "bg-brand-400" : "bg-neutral-600"
                    }`}
                  />
                  Slot A
                </span>
              </div>
              <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
                <select
                  className="input patcher-select font-mono text-[13px] tracking-wide"
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

          {/* Three patching stations inside a real 3D room (WebGL). The cards below
              are the page's own markup, mounted exactly once and positioned each
              frame by projecting their console anchors through the room camera —
              so every id, ref, drag/drop handler and the patch engine stay intact.
              Click-and-drag (or finger-drag) turns the camera. */}
          <Reveal as="up" delay={0.4}>
            <div className="patcher-room-shell">
              <div
                className="patcher-room-nav"
                role="group"
                aria-label="Look at a patching station"
              >
                {(["left", "center", "right"] as RoomStation[]).map((station, idx) => (
                  <button
                    key={station}
                    type="button"
                    aria-pressed={roomStation === station}
                    onClick={() => lookAtStation(station)}
                    className={`patcher-room-dot${roomStation === station ? " patcher-room-dot--on" : ""}`}
                  >
                    <span aria-hidden="true" className="patcher-room-dot-pip" />
                    <span>
                      0{idx + 1} ·{" "}
                      {station === "left" ? "ROM" : station === "center" ? "Patch" : "Apply"}
                    </span>
                  </button>
                ))}
                <span className="patcher-room-hint">
                  {roomReduced ? "Drag to look around" : "Click and drag to look around"}
                </span>
              </div>

              <PatcherRoom
                ref={roomRef}
                reduced={roomReduced}
                mounts={{
                  left: leftMount,
                  center: centerMount,
                  right: rightMount,
                }}
                tones={{
                  left: rom ? "ready" : "idle",
                  center: patchName ? "ready" : "idle",
                  right: output ? "done" : "idle",
                }}
                onSettle={(id) => {
                  setRoomStation(id);
                  roomScrollRef.current = true;
                }}
              >
                <ol className="patcher-room-list">
                  {STAGES.map((stage, i) => {
                    const station: RoomStation = i === 0 ? "left" : i === 1 ? "center" : "right";
                    const mount = i === 0 ? leftMount : i === 1 ? centerMount : rightMount;
                    return (
                      <motion.li
                        key={stage.label}
                        ref={(node: HTMLLIElement | null) => {
                          roomStationsRef.current[station] = node;
                        }}
                        initial={{ opacity: 0, y: 18 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          duration: DUR.component,
                          delay: 0.5 + stagger(i, 0.12),
                          ease: EASE.out,
                        }}
                        className="patcher-station"
                      >
                        <div ref={mount} className="patcher-mount">
                          <div
                            className={`patcher-step patcher-panel3d glass relative overflow-hidden rounded-xl p-5 ${
                              rom && i === 0 ? "patcher-step--ready" : ""
                            } ${patchName && i === 1 ? "patcher-step--ready" : ""} ${
                              output && i === 2 ? "patcher-step--done" : ""
                            }`}
                          >
                  <span aria-hidden="true" className="patcher-step-num">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-transparent via-brand-500/70 to-transparent" />
                  <div
                    onDragOver={i < 2 ? allowDrop : undefined}
                    onDrop={i === 0 ? makeDrop("rom") : i === 1 ? makeDrop("patch") : undefined}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="type-overline font-mono text-neutral-500">Step {i + 1}</span>
                      <span
                        className={`patcher-led font-mono text-[10px] uppercase tracking-[0.2em] ${
                          (i === 0 && rom) || (i === 1 && patchName) || (i === 2 && output)
                            ? "patcher-led--on"
                            : ""
                        }`}
                      >
                        {(i === 0 && rom) || (i === 1 && patchName) || (i === 2 && output)
                          ? "Loaded"
                          : "Empty"}
                      </span>
                    </div>
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
                          className="input patcher-file mt-3 w-full cursor-pointer"
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
                          className="input patcher-file mt-3 w-full cursor-pointer"
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
                          className="btn-hero patcher-apply mt-3 w-full font-mono uppercase tracking-[0.18em] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <span aria-hidden="true" className="patcher-apply-fill" />
                          <span className="relative">Apply patch</span>
                        </button>
                        <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-600">
                          Press start
                        </p>
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
                          </div>
                        </div>
                      </motion.li>
                    );
                  })}
                </ol>
              </PatcherRoom>
            </div>
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