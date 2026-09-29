import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "../lib/supabase";
import PageWrapper from "../components/PageWrapper";
import Loader from "../components/Loader";
import Screenshot from "../components/Screenshot";
import { parseTextList, serializeImageList, splitImageUrlInput } from "../lib/imageList";
import { DRIVE_PUBLIC_HINT, isRenderableImageRef } from "../lib/imageUrl";
import { SPRING } from "../lib/motion";

export default function Admin() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("hack");

  const [hacks, setHacks] = useState<any[]>([]);
  const [cheats, setCheats] = useState<any[]>([]);
  const [emulators, setEmulators] = useState<any[]>([]);

  // 🔥 HACK FORM
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [baseGame, setBaseGame] = useState("");
  const [platform, setPlatform] = useState("");
  const [status, setStatus] = useState("");
  const [rating, setRating] = useState(0);
  const [description, setDescription] = useState("");
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverUrl, setCoverUrl] = useState("");
  const [downloadLink, setDownloadLink] = useState("");
  const [screenshots, setScreenshots] = useState<string[]>([""]);
  const [features, setFeatures] = useState<string[]>([""]);

  // ✏️ EDIT STATE
  const [editingHack, setEditingHack] = useState<any | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editAuthor, setEditAuthor] = useState("");
  const [editBaseGame, setEditBaseGame] = useState("");
  const [editPlatform, setEditPlatform] = useState("");
  const [editStatus, setEditStatus] = useState("");
  const [editRating, setEditRating] = useState(0);
  const [editDescription, setEditDescription] = useState("");
  const [editDownloadLink, setEditDownloadLink] = useState("");
  const [editCoverUrl, setEditCoverUrl] = useState("");
  const [editCoverFile, setEditCoverFile] = useState<File | null>(null);
  const [editScreenshots, setEditScreenshots] = useState<string[]>([""]);
  const [editFeatures, setEditFeatures] = useState<string[]>([""]);

  // 🧩 CHEAT
  const [cheatTitle, setCheatTitle] = useState("");
  const [cheatGame, setCheatGame] = useState("");
  const [cheatCode, setCheatCode] = useState("");
  const [cheatDesc, setCheatDesc] = useState("");

  // 🎮 EMULATOR
  const [emuName, setEmuName] = useState("");
  const [emuPlatform, setEmuPlatform] = useState("");
  const [emuDesc, setEmuDesc] = useState("");
  const [emuLink, setEmuLink] = useState("");
  // 🔎 does `emulators.download_link` exist in the DB? (probed on mount)
  const [hasEmuLinkCol, setHasEmuLinkCol] = useState(true);

  // 🔐 AUTH
  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        window.location.href = "/login";
      } else {
        // probe optional column so a missing column never breaks the insert
        const { error } = await supabase.from("emulators").select("download_link").limit(1);
        setHasEmuLinkCol(!error);
        fetchAll();
        setLoading(false);
      }
    };
    init();
  }, []);

  // 📦 FETCH
  const fetchAll = async () => {
    const { data: hacksData } = await supabase
      .from("hacks")
      .select("*")
      .order("created_at", { ascending: false });
    const { data: cheatsData } = await supabase.from("cheats").select("*");
    const { data: emuData } = await supabase.from("emulators").select("*");
    setHacks(hacksData || []);
    setCheats(cheatsData || []);
    setEmulators(emuData || []);
  };

  // ❌ DELETE
  const deleteItem = async (table: string, id: number) => {
    if (!confirm("Delete this item?")) return;
    await supabase.from(table).delete().eq("id", id);
    fetchAll();
  };

  // 🔧 PARSE LIST COLUMNS — shared codec (src/lib/imageList.ts) understands real
  // JS arrays, JSON text, the legacy double-encoded values and `{url1,url2}`
  // literals, so existing records keep working with no database migration.
  const parseList = (val: unknown): string[] => {
    const parsed = parseTextList(val);
    return parsed.length > 0 ? parsed : [""];
  };

  // 🔧 SCREENSHOT SAVE PREP — stores a canonical JSON array and reports anything
  // that is not a usable image link, instead of silently saving junk that would
  // render as a broken tile on the public page.
  const prepareScreenshots = (list: string[], label: string): string => {
    const { valid, invalid } = splitImageUrlInput(list);
    if (invalid.length > 0) {
      alert(
        `${label}: skipped ${invalid.length} entr${invalid.length === 1 ? "y" : "ies"} that is not a valid image URL:\n\n` +
          invalid.slice(0, 3).join("\n")
      );
    }
    return serializeImageList(valid);
  };

  const removeAt = (list: string[], setList: (next: string[]) => void, index: number) => {
    const next = list.filter((_, i) => i !== index);
    setList(next.length > 0 ? next : [""]);
  };

  // ✏️ OPEN EDIT — parses every stored list encoding + loads the current cover
  const openEdit = (hack: any) => {
    setEditingHack(hack);
    setEditTitle(hack.title || "");
    setEditAuthor(hack.author || "");
    setEditBaseGame(hack.base_game || "");
    setEditPlatform(hack.platform || "");
    setEditStatus(hack.status || "");
    setEditRating(hack.rating || 0);
    setEditDescription(hack.description || "");
    setEditDownloadLink(hack.download_link || "");
    setEditCoverUrl(hack.cover_image || "");
    setEditCoverFile(null);
    setEditScreenshots(parseList(hack.screenshots));
    setEditFeatures(parseList(hack.features));
  };

  // 💾 SAVE EDIT
  const saveEdit = async () => {
    if (!editingHack) return;

    const typedCover = editCoverUrl.trim();
    if (!editCoverFile && typedCover !== "" && !isRenderableImageRef(typedCover)) {
      alert("Cover image URL must start with https:// (or choose a file instead)");
      return;
    }

    const payload: Record<string, unknown> = {
      title: editTitle,
      author: editAuthor,
      base_game: editBaseGame,
      platform: editPlatform,
      status: editStatus,
      rating: editRating,
      description: editDescription,
      download_link: editDownloadLink,
      screenshots: prepareScreenshots(editScreenshots, "Screenshots"),
      features: editFeatures.filter((f) => f.trim() !== ""),
    };

    try {
      // A newly picked file replaces the cover; an untouched field leaves the
      // stored cover image exactly as it is.
      if (editCoverFile) {
        const coverPath = `covers/${Date.now()}-${editCoverFile.name}`;
        const { error: uploadError } = await supabase.storage
          .from("hacks")
          .upload(coverPath, editCoverFile);
        if (uploadError) {
          alert("Cover upload failed ❌");
          console.error(uploadError);
          return;
        }
        payload.cover_image = supabase.storage
          .from("hacks")
          .getPublicUrl(coverPath).data.publicUrl;
      } else if (typedCover !== (editingHack.cover_image || "")) {
        payload.cover_image = typedCover;
      }

      const { error } = await supabase
        .from("hacks")
        .update(payload)
        .eq("id", editingHack.id);

      if (error) {
        alert("Update failed ❌");
        console.error(error);
        return;
      }

      alert("Hack updated ✅");
      setEditingHack(null);
      setEditCoverFile(null);
      fetchAll();
    } catch (err) {
      console.error(err);
      alert("Update failed ❌");
    }
  };

  // 🆕 SCREENSHOT HANDLERS
  const handleScreenshotChange = (index: number, value: string) => {
    const updated = [...screenshots];
    updated[index] = value;
    setScreenshots(updated);
  };

  const handleEditScreenshotChange = (index: number, value: string) => {
    const updated = [...editScreenshots];
    updated[index] = value;
    setEditScreenshots(updated);
  };

  // 🆕 FEATURES HANDLERS
  const handleFeatureChange = (index: number, value: string) => {
    const updated = [...features];
    updated[index] = value;
    setFeatures(updated);
  };

  const handleEditFeatureChange = (index: number, value: string) => {
    const updated = [...editFeatures];
    updated[index] = value;
    setEditFeatures(updated);
  };

  // 🚀 UPLOAD HACK
  const uploadHack = async () => {
    const typedCover = coverUrl.trim();

    if (!coverFile && !typedCover) {
      alert("Add a cover image (upload a file or paste an image URL)");
      return;
    }
    if (!coverFile && !isRenderableImageRef(typedCover)) {
      alert("Cover image URL must start with https:// (or choose a file instead)");
      return;
    }
    if (!downloadLink) {
      alert("Add a download link");
      return;
    }

    try {
      // An uploaded file wins; otherwise the pasted URL is stored as-is.
      let resolvedCover = typedCover;
      if (coverFile) {
        const coverPath = `covers/${Date.now()}-${coverFile.name}`;
        const { error: uploadError } = await supabase.storage
          .from("hacks")
          .upload(coverPath, coverFile);
        if (uploadError) {
          alert("Cover upload failed ❌");
          console.error(uploadError);
          return;
        }
        resolvedCover = supabase.storage
          .from("hacks")
          .getPublicUrl(coverPath).data.publicUrl;
      }

      const { error } = await supabase.from("hacks").insert({
        title,
        author,
        base_game: baseGame,
        platform,
        status,
        rating,
        description,
        cover_image: resolvedCover,
        download_link: downloadLink,
        screenshots: prepareScreenshots(screenshots, "Screenshots"),
        features: features.filter((f) => f.trim() !== ""),
      });

      if (error) {
        alert("Upload failed ❌");
        console.error(error);
        return;
      }

      alert("Hack uploaded 🚀");
      setTitle(""); setAuthor(""); setBaseGame(""); setPlatform("");
      setStatus(""); setRating(0); setDescription(""); setCoverFile(null);
      setCoverUrl(""); setDownloadLink(""); setScreenshots([""]); setFeatures([""]);
      fetchAll();
    } catch (err) {
      console.error(err);
      alert("Upload failed ❌");
    }
  };

  // 🧩 ADD CHEAT
  const addCheat = async () => {
    const { error } = await supabase.from("cheats").insert({
      title: cheatTitle,
      game: cheatGame,
      code: cheatCode,
      description: cheatDesc,
    });
    if (error) { alert("Failed ❌"); return; }
    alert("Cheat added ✅");
    setCheatTitle(""); setCheatGame(""); setCheatCode(""); setCheatDesc("");
    fetchAll();
  };

  // 🎮 ADD EMULATOR
  const addEmu = async () => {
    const payload: Record<string, unknown> = {
      name: emuName,
      platform: emuPlatform,
      description: emuDesc,
    };
    if (hasEmuLinkCol) payload.download_link = emuLink;
    const { error } = await supabase.from("emulators").insert(payload);
    if (error) { alert("Failed ❌"); return; }
    alert("Emulator added ✅");
    setEmuName(""); setEmuPlatform(""); setEmuDesc(""); setEmuLink("");
    fetchAll();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-32">
        <Loader />
        <p className="font-mono text-[11px] tracking-[0.3em] text-neutral-500 uppercase">
          Loading admin…
        </p>
      </div>
    );
  }

  // ---- SHARED INPUT STYLES ----
  const inputCls = "input mt-2";
  const labelCls = "type-overline mt-5 mb-1.5 block text-neutral-500";
  const btnCls = "rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-oncolor transition duration-300 hover:bg-brand-600 hover:shadow-glow-sm active:translate-y-px";

  return (
    <PageWrapper>
      <div className="mx-auto max-w-6xl px-6 py-10">

        {/* HEADER */}
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <span className="eyebrow">
              <span className="h-px w-8 bg-brand/70" aria-hidden="true" />
              Control center
            </span>
            <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Admin Panel
            </h1>
            <p className="mt-1 font-mono text-[11px] tracking-widest text-neutral-500 uppercase">
              {hacks.length} hacks · {cheats.length} cheats · {emulators.length} emulators
            </p>
          </div>
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              window.location.href = "/";
            }}
            className="rounded-lg border border-white/15 px-4 py-2 text-sm font-medium text-neutral-300 transition hover:border-white/40 hover:bg-white/10"
          >
            Logout
          </button>
        </div>

        {/* TABS */}
        <div className="mb-8 inline-flex rounded-xl border border-white/10 bg-ink-900/80 p-1">
          {["hack", "cheat", "emulator"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              aria-pressed={activeTab === tab}
              className={`relative rounded-lg px-5 py-2 text-sm font-semibold tracking-wide transition-colors duration-300 ${
                activeTab === tab ? "text-white" : "text-neutral-400 hover:text-white"
              }`}
            >
              {activeTab === tab && (
                <motion.span
                  layoutId="admin-tab-pill"
                  aria-hidden="true"
                  className="absolute inset-0 -z-10 rounded-lg bg-brand shadow-glow-sm"
                  transition={SPRING}
                />
              )}
              {tab.toUpperCase()}
            </button>
          ))}
        </div>

        {/* ================= HACKS ================= */}
        {activeTab === "hack" && (
          <>
            {/* EDIT MODAL */}
            {editingHack && (
              <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/80 py-10 backdrop-blur-sm">
                <motion.div
                  initial={{ opacity: 0, y: 18, scale: 0.99 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  className="mx-4 w-full max-w-2xl rounded-2xl border border-white/10 bg-ink-850 p-6 shadow-panel sm:p-8"
                >
                  <div className="mb-5 border-b border-white/10 pb-4">
                    <span className="font-mono text-[10px] tracking-[0.3em] text-brand-400 uppercase">
                      Edit record
                    </span>
                    <h2 className="mt-1.5 font-display text-xl font-bold text-white">
                      Edit: {editingHack.title}
                    </h2>
                  </div>

                  <label className={labelCls}>Title</label>
                  <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className={inputCls} />

                  <label className={labelCls}>Author</label>
                  <input value={editAuthor} onChange={(e) => setEditAuthor(e.target.value)} className={inputCls} />

                  <label className={labelCls}>Base Game</label>
                  <input value={editBaseGame} onChange={(e) => setEditBaseGame(e.target.value)} className={inputCls} />

                  <label className={labelCls}>Platform</label>
                  <input value={editPlatform} onChange={(e) => setEditPlatform(e.target.value)} className={inputCls} />

                  <label className={labelCls}>Status</label>
                  <select value={editStatus} onChange={(e) => setEditStatus(e.target.value)} className={inputCls}>
                    <option value="">Select status</option>
                    <option value="completed">Completed</option>
                    <option value="beta">Beta</option>
                    <option value="demo">Demo</option>
                  </select>

                  <label className={labelCls}>Rating (0-5)</label>
                  <input type="number" min={0} max={5} step={0.5} value={editRating}
                    onChange={(e) => setEditRating(parseFloat(e.target.value))} className={inputCls} />

                  <label className={labelCls}>Description</label>
                  <textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)}
                    rows={4} className={inputCls} />

                  <label className={labelCls}>Cover Image</label>
                  <div className="flex items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <input value={editCoverUrl}
                        onChange={(e) => setEditCoverUrl(e.target.value)}
                        placeholder="Cover image URL — https://drive.google.com/file/d/…"
                        className="input" />
                      <input type="file" accept="image/*"
                        onChange={(e) => setEditCoverFile(e.target.files?.[0] || null)}
                        className="mt-2 block w-full text-sm text-gray-300
                          file:mr-4 file:py-2 file:px-4 file:rounded file:border-0
                          file:text-sm file:font-semibold file:bg-red-500 file:text-oncolor
                          hover:file:bg-red-600 cursor-pointer" />
                      {editCoverFile ? (
                        <p className="text-green-400 text-sm mt-1">
                          New file selected: {editCoverFile.name} (replaces the cover on save)
                        </p>
                      ) : (
                        <p className="mt-1 font-mono text-[10px] text-neutral-500">
                          Leave unchanged to keep the current cover image.
                        </p>
                      )}
                    </div>
                    {editCoverUrl.trim() !== "" ? (
                      <Screenshot src={editCoverUrl} alt="Cover preview" variant="preview"
                        unavailableLabel="Cover unavailable" />
                    ) : (
                      <div className="h-20 w-32 shrink-0 rounded-lg border border-dashed border-white/10 bg-white/[0.02]"
                        aria-hidden="true" />
                    )}
                  </div>

                  <label className={labelCls}>Download Link</label>
                  <input value={editDownloadLink} onChange={(e) => setEditDownloadLink(e.target.value)} className={inputCls} />

                  <label className={labelCls}>Features</label>
                  {editFeatures.map((f, i) => (
                    <input key={i} value={f}
                      onChange={(e) => handleEditFeatureChange(i, e.target.value)}
                      placeholder={`Feature ${i + 1}`} className={inputCls} />
                  ))}
                  <button onClick={() => setEditFeatures([...editFeatures, ""])}
                    className="text-blue-400 text-sm mt-1 hover:underline">
                    + Add Feature
                  </button>

                  <label className={labelCls}>Screenshots (URLs)</label>
                  <p className="mb-1 font-mono text-[10px] leading-relaxed text-neutral-500">
                    {DRIVE_PUBLIC_HINT}
                  </p>
                  {editScreenshots.map((s, i) => (
                    <div key={i} className="mt-2 flex items-start gap-3">
                      <div className="min-w-0 flex-1">
                        <input value={s}
                          onChange={(e) => handleEditScreenshotChange(i, e.target.value)}
                          placeholder={`Screenshot URL ${i + 1} — https://drive.google.com/file/d/…`}
                          className="input" />
                      </div>
                      {s.trim() !== "" ? (
                        <Screenshot src={s} alt={`Screenshot ${i + 1} preview`} variant="preview" />
                      ) : (
                        <div className="h-20 w-32 shrink-0 rounded-lg border border-dashed border-white/10 bg-white/[0.02]"
                          aria-hidden="true" />
                      )}
                      <button onClick={() => removeAt(editScreenshots, setEditScreenshots, i)}
                        className="shrink-0 rounded-lg border border-white/15 px-3 py-2 text-sm text-neutral-400 transition hover:border-rose-400/40 hover:bg-rose-500/10 hover:text-rose-300">
                        Remove
                      </button>
                    </div>
                  ))}
                  <button onClick={() => setEditScreenshots([...editScreenshots, ""])}
                    className="text-blue-400 text-sm mt-1 hover:underline">
                    + Add Screenshot
                  </button>

                  <div className="mt-6 flex gap-3">
                    <button onClick={saveEdit} className={btnCls}>Save Changes</button>
                    <button onClick={() => setEditingHack(null)}
                      className="rounded-lg border border-white/15 px-4 py-2 text-sm font-medium text-neutral-300 transition duration-300 hover:border-white/40 hover:bg-white/10">
                      Cancel
                    </button>
                  </div>
                </motion.div>
              </div>
            )}

            {/* EXISTING HACKS LIST */}
            <h2 className="mb-4 font-display text-xl font-bold text-white">Existing Hacks ({hacks.length})</h2>
            {hacks.length === 0 && (
              <p className="mb-4 text-neutral-500">No hacks yet.</p>
            )}
            {hacks.map((h) => (
              <div key={h.id} className="glass group mb-3 rounded-xl p-4 transition-[border-color,background-color] duration-300 hover:border-white/20 hover:bg-white/[0.04]">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-white">{h.title}</p>
                    <p className="mt-0.5 text-sm text-neutral-400">
                      <span className="text-neutral-500">Author:</span> {h.author}
                    </p>
                    <p className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-neutral-400">
                      <span>
                        <span className="text-neutral-500">Base:</span> {h.base_game}
                      </span>
                      <span>
                        <span className="text-neutral-500">Platform:</span> {h.platform}
                      </span>
                      <span>
                        <span className="text-neutral-500">Status:</span> {h.status}
                      </span>
                      <span>
                        <span className="text-neutral-500">Rating:</span> {h.rating}/5
                      </span>
                    </p>
                    {Array.isArray(h.features) && h.features.length > 0 && (
                      <p className="mt-1.5 text-sm text-neutral-400">
                        <span className="text-neutral-500">Features:</span>{" "}
                        {h.features.join(", ")}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button onClick={() => openEdit(h)}
                      className="rounded-lg border border-sky-400/30 bg-sky-400/10 px-3 py-1.5 text-sm font-medium text-sky-300 transition hover:bg-sky-400/20">
                      Edit
                    </button>
                    <button onClick={() => deleteItem("hacks", h.id)}
                      className="rounded-lg border border-rose-400/30 bg-rose-500/10 px-3 py-1.5 text-sm font-medium text-rose-300 transition hover:bg-rose-500/20">
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {/* UPLOAD NEW HACK */}
            <h2 className="mt-12 mb-2 font-display text-xl font-bold text-white">Upload New Hack</h2>
            <div className="panel p-6">

              <label className={labelCls}>Title</label>
              <input value={title} placeholder="e.g. Pokemon Radical Red"
                onChange={(e) => setTitle(e.target.value)} className={inputCls} />

              <label className={labelCls}>Author</label>
              <input value={author} placeholder="Hack creator name"
                onChange={(e) => setAuthor(e.target.value)} className={inputCls} />

              <label className={labelCls}>Base Game</label>
              <input value={baseGame} placeholder="e.g. FireRed"
                onChange={(e) => setBaseGame(e.target.value)} className={inputCls} />

              <label className={labelCls}>Platform</label>
              <input value={platform} placeholder="e.g. GBA"
                onChange={(e) => setPlatform(e.target.value)} className={inputCls} />

              <label className={labelCls}>Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputCls}>
                <option value="">Select status</option>
                <option value="completed">Completed</option>
                <option value="beta">Beta</option>
                <option value="demo">Demo</option>
              </select>

              <label className={labelCls}>Rating (0-5)</label>
              <input type="number" min={0} max={5} step={0.5} value={rating}
                onChange={(e) => setRating(parseFloat(e.target.value))} className={inputCls} />

              <label className={labelCls}>Description</label>
              <textarea value={description} placeholder="Describe the hack..."
                onChange={(e) => setDescription(e.target.value)} rows={4} className={inputCls} />

              <label className={labelCls}>Cover Image</label>
              <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <input value={coverUrl}
                    onChange={(e) => setCoverUrl(e.target.value)}
                    placeholder="Cover image URL (optional) — https://drive.google.com/file/d/…"
                    className="input" />
                  <input type="file" accept="image/*"
                    onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
                    className="mt-2 block w-full text-sm text-gray-300
                      file:mr-4 file:py-2 file:px-4 file:rounded file:border-0
                      file:text-sm file:font-semibold file:bg-red-500 file:text-oncolor
                      hover:file:bg-red-600 cursor-pointer" />
                  {coverFile && (
                    <p className="text-green-400 text-sm mt-1">
                      Selected: {coverFile.name} (this file is used instead of the URL)
                    </p>
                  )}
                </div>
                {coverUrl.trim() !== "" ? (
                  <Screenshot src={coverUrl} alt="Cover preview" variant="preview"
                    unavailableLabel="Cover unavailable" />
                ) : (
                  <div className="h-20 w-32 shrink-0 rounded-lg border border-dashed border-white/10 bg-white/[0.02]"
                    aria-hidden="true" />
                )}
              </div>

              <label className={labelCls}>Download Link</label>
              <input value={downloadLink} placeholder="https://..."
                onChange={(e) => setDownloadLink(e.target.value)} className={inputCls} />

              <label className={labelCls}>Features</label>
              {features.map((f, i) => (
                <input key={i} value={f}
                  onChange={(e) => handleFeatureChange(i, e.target.value)}
                  placeholder={`Feature ${i + 1} e.g. "Physical/Special Split"`}
                  className={inputCls} />
              ))}
              <button onClick={() => setFeatures([...features, ""])}
                className="text-blue-400 text-sm mt-1 hover:underline">
                + Add Feature
              </button>

              <label className={labelCls}>Screenshots (URLs)</label>
              <p className="mb-1 font-mono text-[10px] leading-relaxed text-neutral-500">
                {DRIVE_PUBLIC_HINT}
              </p>
              {screenshots.map((s, i) => (
                <div key={i} className="mt-2 flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <input value={s}
                      onChange={(e) => handleScreenshotChange(i, e.target.value)}
                      placeholder={`Screenshot URL ${i + 1} — https://drive.google.com/file/d/…`}
                      className="input" />
                  </div>
                  {s.trim() !== "" ? (
                    <Screenshot src={s} alt={`Screenshot ${i + 1} preview`} variant="preview" />
                  ) : (
                    <div className="h-20 w-32 shrink-0 rounded-lg border border-dashed border-white/10 bg-white/[0.02]"
                      aria-hidden="true" />
                  )}
                  <button onClick={() => removeAt(screenshots, setScreenshots, i)}
                    className="shrink-0 rounded-lg border border-white/15 px-3 py-2 text-sm text-neutral-400 transition hover:border-rose-400/40 hover:bg-rose-500/10 hover:text-rose-300">
                    Remove
                  </button>
                </div>
              ))}
              <button onClick={() => setScreenshots([...screenshots, ""])}
                className="text-blue-400 text-sm mt-1 hover:underline">
                + Add Screenshot
              </button>

              <button onClick={uploadHack} className={`${btnCls} mt-6 w-full`}>
                Upload Hack 🚀
              </button>
            </div>
          </>
        )}

        {/* ================= CHEATS ================= */}
        {activeTab === "cheat" && (
          <>
            <h2 className="mb-4 font-display text-xl font-bold text-white">Existing Cheats ({cheats.length})</h2>
            {cheats.length === 0 && <p className="mb-4 text-neutral-500">No cheats yet.</p>}
            {cheats.map((c) => (
              <div key={c.id} className="glass group mb-3 flex flex-wrap items-start justify-between gap-4 rounded-xl p-4 transition-[border-color,background-color] duration-300 hover:border-white/20 hover:bg-white/[0.04]">
                <div className="min-w-0">
                  <p className="font-semibold text-white">{c.title}</p>
                  <p className="mt-0.5 text-sm text-neutral-400">
                    <span className="text-neutral-500">Game:</span> {c.game}
                  </p>
                  <p className="mt-1 text-sm text-neutral-400">
                    <span className="text-neutral-500">Description:</span> {c.description}
                  </p>
                </div>
                <button onClick={() => deleteItem("cheats", c.id)}
                  className="shrink-0 rounded-lg border border-rose-400/30 bg-rose-500/10 px-3 py-1.5 text-sm font-medium text-rose-300 transition hover:bg-rose-500/20">
                  Delete
                </button>
              </div>
            ))}

            <h2 className="mt-10 mb-2 font-display text-xl font-bold text-white">Add Cheat</h2>
            <div className="panel p-6">
              <label className={labelCls}>Title</label>
              <input value={cheatTitle} placeholder="Cheat name"
                onChange={(e) => setCheatTitle(e.target.value)} className={inputCls} />

              <label className={labelCls}>Game</label>
              <input value={cheatGame} placeholder="e.g. FireRed"
                onChange={(e) => setCheatGame(e.target.value)} className={inputCls} />

              <label className={labelCls}>Cheat Code</label>
              <textarea value={cheatCode} placeholder="Enter cheat code..."
                onChange={(e) => setCheatCode(e.target.value)} rows={3} className={inputCls} />

              <label className={labelCls}>Description</label>
              <textarea value={cheatDesc} placeholder="What does this cheat do?"
                onChange={(e) => setCheatDesc(e.target.value)} rows={2} className={inputCls} />

              <button onClick={addCheat} className={`${btnCls} mt-6 w-full`}>
                Add Cheat
              </button>
            </div>
          </>
        )}

        {/* ================= EMULATORS ================= */}
        {activeTab === "emulator" && (
          <>
            <h2 className="mb-4 font-display text-xl font-bold text-white">Existing Emulators ({emulators.length})</h2>
            {emulators.length === 0 && <p className="mb-4 text-neutral-500">No emulators yet.</p>}
            {emulators.map((e) => (
              <div key={e.id} className="glass group mb-3 flex flex-wrap items-start justify-between gap-4 rounded-xl p-4 transition-[border-color,background-color] duration-300 hover:border-white/20 hover:bg-white/[0.04]">
                <div className="min-w-0">
                  <p className="font-semibold text-white">{e.name}</p>
                  <p className="mt-0.5 text-sm text-neutral-400">
                    <span className="text-neutral-500">Platform:</span> {e.platform}
                  </p>
                  <p className="mt-1 text-sm text-neutral-400">
                    <span className="text-neutral-500">Description:</span> {e.description}
                  </p>
                </div>
                <button onClick={() => deleteItem("emulators", e.id)}
                  className="shrink-0 rounded-lg border border-rose-400/30 bg-rose-500/10 px-3 py-1.5 text-sm font-medium text-rose-300 transition hover:bg-rose-500/20">
                  Delete
                </button>
              </div>
            ))}

            <h2 className="mt-10 mb-2 font-display text-xl font-bold text-white">Add Emulator</h2>
            <div className="panel p-6">
              <label className={labelCls}>Name</label>
              <input value={emuName} placeholder="e.g. mGBA"
                onChange={(e) => setEmuName(e.target.value)} className={inputCls} />

              <label className={labelCls}>Platform</label>
              <input value={emuPlatform} placeholder="e.g. GBA"
                onChange={(e) => setEmuPlatform(e.target.value)} className={inputCls} />

              <label className={labelCls}>Description</label>
              <textarea value={emuDesc} placeholder="Describe the emulator..."
                onChange={(e) => setEmuDesc(e.target.value)} rows={3} className={inputCls} />

              {hasEmuLinkCol ? (
                <>
                  <label className={labelCls}>Download Link</label>
                  <input value={emuLink} placeholder="https://..."
                    onChange={(e) => setEmuLink(e.target.value)} className={inputCls} />
                </>
              ) : (
                <p className="text-yellow-500 text-sm mt-4">
                  ⚠️ The <code>emulators</code> table has no <code>download_link</code> column yet,
                  so the link is not saved. Run this in the Supabase SQL Editor to enable it:
                  <br />
                  <code className="text-gray-300">
                    alter table public.emulators add column if not exists download_link text;
                  </code>
                </p>
              )}

              <button onClick={addEmu} className={`${btnCls} mt-6 w-full`}>
                Add Emulator
              </button>
            </div>
          </>
        )}

      </div>
    </PageWrapper>
  );
}