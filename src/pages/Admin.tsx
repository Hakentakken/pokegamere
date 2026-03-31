import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import PageWrapper from "../components/PageWrapper";

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

  // 🔐 AUTH
  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        window.location.href = "/login";
      } else {
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

  // ✏️ OPEN EDIT
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
    setEditScreenshots(
      Array.isArray(hack.screenshots) && hack.screenshots.length > 0
        ? hack.screenshots
        : [""]
    );
    setEditFeatures(
      Array.isArray(hack.features) && hack.features.length > 0
        ? hack.features
        : [""]
    );
  };

  // 💾 SAVE EDIT
  const saveEdit = async () => {
    if (!editingHack) return;
    const { error } = await supabase
      .from("hacks")
      .update({
        title: editTitle,
        author: editAuthor,
        base_game: editBaseGame,
        platform: editPlatform,
        status: editStatus,
        rating: editRating,
        description: editDescription,
        download_link: editDownloadLink,
        screenshots: editScreenshots.filter((s) => s.trim() !== ""),
        features: editFeatures.filter((f) => f.trim() !== ""),
      })
      .eq("id", editingHack.id);

    if (error) {
      alert("Update failed ❌");
      console.error(error);
    } else {
      alert("Hack updated ✅");
      setEditingHack(null);
      fetchAll();
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
    if (!coverFile || !downloadLink) {
      alert("Upload cover + add download link");
      return;
    }
    try {
      const coverPath = `covers/${Date.now()}-${coverFile.name}`;
      await supabase.storage.from("hacks").upload(coverPath, coverFile);
      const coverUrl = supabase.storage
        .from("hacks")
        .getPublicUrl(coverPath).data.publicUrl;

      const { error } = await supabase.from("hacks").insert({
        title,
        author,
        base_game: baseGame,
        platform,
        status,
        rating,
        description,
        cover_image: coverUrl,
        download_link: downloadLink,
        screenshots: screenshots.filter((s) => s.trim() !== ""),
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
      setDownloadLink(""); setScreenshots([""]); setFeatures([""]);
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
    const { error } = await supabase.from("emulators").insert({
      name: emuName,
      platform: emuPlatform,
      description: emuDesc,
      download_link: emuLink,
    });
    if (error) { alert("Failed ❌"); return; }
    alert("Emulator added ✅");
    setEmuName(""); setEmuPlatform(""); setEmuDesc(""); setEmuLink("");
    fetchAll();
  };

  if (loading) {
    return <div className="text-white text-center mt-20">Loading...</div>;
  }

  // ---- SHARED INPUT STYLES ----
  const inputCls = "w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white placeholder-gray-500 mt-2 focus:outline-none focus:border-red-500";
  const labelCls = "block text-gray-400 text-sm mt-4 mb-1";
  const btnCls = "bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded font-semibold";

  return (
    <PageWrapper>
      <div className="min-h-screen bg-black text-white p-6 max-w-6xl mx-auto">

        {/* HEADER */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-red-500">Admin Panel</h1>
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              window.location.href = "/";
            }}
            className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded"
          >
            Logout
          </button>
        </div>

        {/* TABS */}
        <div className="flex gap-4 mb-8">
          {["hack", "cheat", "emulator"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded font-semibold ${
                activeTab === tab ? "bg-red-500" : "bg-gray-700 hover:bg-gray-600"
              }`}
            >
              {tab.toUpperCase()}
            </button>
          ))}
        </div>

        {/* ================= HACKS ================= */}
        {activeTab === "hack" && (
          <>
            {/* EDIT MODAL */}
            {editingHack && (
              <div className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-start justify-center overflow-y-auto py-10">
                <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 w-full max-w-2xl mx-4">
                  <h2 className="text-xl font-bold text-red-500 mb-4">
                    Edit: {editingHack.title}
                  </h2>

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
                  {editScreenshots.map((s, i) => (
                    <input key={i} value={s}
                      onChange={(e) => handleEditScreenshotChange(i, e.target.value)}
                      placeholder={`Screenshot URL ${i + 1}`} className={inputCls} />
                  ))}
                  <button onClick={() => setEditScreenshots([...editScreenshots, ""])}
                    className="text-blue-400 text-sm mt-1 hover:underline">
                    + Add Screenshot
                  </button>

                  <div className="flex gap-3 mt-6">
                    <button onClick={saveEdit} className={btnCls}>Save Changes</button>
                    <button onClick={() => setEditingHack(null)}
                      className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded">
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* EXISTING HACKS LIST */}
            <h2 className="text-xl font-bold mb-4">Existing Hacks ({hacks.length})</h2>
            {hacks.length === 0 && (
              <p className="text-gray-500 mb-4">No hacks yet.</p>
            )}
            {hacks.map((h) => (
              <div key={h.id} className="bg-gray-800 border border-gray-700 rounded-lg p-4 mb-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0 mr-4">
                    <p className="font-semibold text-white">{h.title}</p>
                    <p className="text-gray-400 text-sm">
                      <span className="text-gray-500">Author:</span> {h.author}
                    </p>
                    <p className="text-gray-400 text-sm">
                      <span className="text-gray-500">Base Game:</span> {h.base_game} &nbsp;|&nbsp;
                      <span className="text-gray-500">Platform:</span> {h.platform} &nbsp;|&nbsp;
                      <span className="text-gray-500">Status:</span> {h.status} &nbsp;|&nbsp;
                      <span className="text-gray-500">Rating:</span> {h.rating}/5
                    </p>
                    {Array.isArray(h.features) && h.features.length > 0 && (
                      <p className="text-gray-400 text-sm mt-1">
                        <span className="text-gray-500">Features:</span>{" "}
                        {h.features.join(", ")}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => openEdit(h)}
                      className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm">
                      Edit
                    </button>
                    <button onClick={() => deleteItem("hacks", h.id)}
                      className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm">
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {/* UPLOAD NEW HACK */}
            <h2 className="text-xl font-bold mt-10 mb-2">Upload New Hack</h2>
            <div className="bg-gray-900 border border-gray-700 rounded-xl p-6">

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
              <input type="file" accept="image/*"
                onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
                className="block w-full text-sm text-gray-300 mt-2
                  file:mr-4 file:py-2 file:px-4 file:rounded file:border-0
                  file:text-sm file:font-semibold file:bg-red-500 file:text-white
                  hover:file:bg-red-600 cursor-pointer" />
              {coverFile && (
                <p className="text-green-400 text-sm mt-1">Selected: {coverFile.name}</p>
              )}

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
              {screenshots.map((s, i) => (
                <input key={i} value={s}
                  onChange={(e) => handleScreenshotChange(i, e.target.value)}
                  placeholder={`Screenshot URL ${i + 1}`} className={inputCls} />
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
            <h2 className="text-xl font-bold mb-4">Existing Cheats ({cheats.length})</h2>
            {cheats.length === 0 && <p className="text-gray-500 mb-4">No cheats yet.</p>}
            {cheats.map((c) => (
              <div key={c.id} className="bg-gray-800 border border-gray-700 rounded-lg p-4 mb-3 flex justify-between items-start">
                <div>
                  <p className="font-semibold">{c.title}</p>
                  <p className="text-gray-400 text-sm">
                    <span className="text-gray-500">Game:</span> {c.game}
                  </p>
                  <p className="text-gray-400 text-sm">
                    <span className="text-gray-500">Description:</span> {c.description}
                  </p>
                </div>
                <button onClick={() => deleteItem("cheats", c.id)}
                  className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm shrink-0 ml-4">
                  Delete
                </button>
              </div>
            ))}

            <h2 className="text-xl font-bold mt-10 mb-2">Add Cheat</h2>
            <div className="bg-gray-900 border border-gray-700 rounded-xl p-6">
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
            <h2 className="text-xl font-bold mb-4">Existing Emulators ({emulators.length})</h2>
            {emulators.length === 0 && <p className="text-gray-500 mb-4">No emulators yet.</p>}
            {emulators.map((e) => (
              <div key={e.id} className="bg-gray-800 border border-gray-700 rounded-lg p-4 mb-3 flex justify-between items-start">
                <div>
                  <p className="font-semibold">{e.name}</p>
                  <p className="text-gray-400 text-sm">
                    <span className="text-gray-500">Platform:</span> {e.platform}
                  </p>
                  <p className="text-gray-400 text-sm">
                    <span className="text-gray-500">Description:</span> {e.description}
                  </p>
                </div>
                <button onClick={() => deleteItem("emulators", e.id)}
                  className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm shrink-0 ml-4">
                  Delete
                </button>
              </div>
            ))}

            <h2 className="text-xl font-bold mt-10 mb-2">Add Emulator</h2>
            <div className="bg-gray-900 border border-gray-700 rounded-xl p-6">
              <label className={labelCls}>Name</label>
              <input value={emuName} placeholder="e.g. mGBA"
                onChange={(e) => setEmuName(e.target.value)} className={inputCls} />

              <label className={labelCls}>Platform</label>
              <input value={emuPlatform} placeholder="e.g. GBA"
                onChange={(e) => setEmuPlatform(e.target.value)} className={inputCls} />

              <label className={labelCls}>Description</label>
              <textarea value={emuDesc} placeholder="Describe the emulator..."
                onChange={(e) => setEmuDesc(e.target.value)} rows={3} className={inputCls} />

              <label className={labelCls}>Download Link</label>
              <input value={emuLink} placeholder="https://..."
                onChange={(e) => setEmuLink(e.target.value)} className={inputCls} />

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