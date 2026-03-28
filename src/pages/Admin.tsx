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
  const [downloadLink, setDownloadLink] = useState(""); // ✅ NEW

  // 🧩 CHEAT FORM
  const [cheatTitle, setCheatTitle] = useState("");
  const [cheatGame, setCheatGame] = useState("");
  const [cheatCode, setCheatCode] = useState("");
  const [cheatDesc, setCheatDesc] = useState("");

  // 🎮 EMULATOR FORM
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

  // 📦 FETCH DATA
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

  // 🚀 UPLOAD HACK (UPDATED)
  const uploadHack = async () => {
    if (!coverFile || !downloadLink) {
      alert("Upload cover + add download link");
      return;
    }

    try {
      // Upload cover
      const coverPath = `covers/${Date.now()}-${coverFile.name}`;
      await supabase.storage.from("hacks").upload(coverPath, coverFile);

      const coverUrl = supabase.storage
        .from("hacks")
        .getPublicUrl(coverPath).data.publicUrl;

      // Insert DB
      await supabase.from("hacks").insert({
        title,
        author,
        base_game: baseGame,
        platform,
        status,
        rating,
        description,
        cover_image: coverUrl,
        download_link: downloadLink, // ✅ NEW
      });

      alert("Hack uploaded 🚀");

      // Reset form
      setTitle("");
      setAuthor("");
      setBaseGame("");
      setPlatform("");
      setStatus("");
      setRating(0);
      setDescription("");
      setCoverFile(null);
      setDownloadLink("");

      fetchAll();
    } catch (err) {
      console.error(err);
      alert("Upload failed ❌");
    }
  };

  // 🧩 ADD CHEAT
  const addCheat = async () => {
    await supabase.from("cheats").insert({
      title: cheatTitle,
      game: cheatGame,
      code: cheatCode,
      description: cheatDesc,
    });

    alert("Cheat added");
    fetchAll();
  };

  // 🎮 ADD EMULATOR
  const addEmu = async () => {
    await supabase.from("emulators").insert({
      name: emuName,
      platform: emuPlatform,
      description: emuDesc,
      download_link: emuLink,
    });

    alert("Emulator added");
    fetchAll();
  };

  if (loading) {
    return <div className="text-white text-center mt-20">Loading...</div>;
  }

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
            className="bg-gray-700 px-4 py-2 rounded hover:bg-gray-600"
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
              className={`px-4 py-2 rounded ${
                activeTab === tab ? "bg-red-500" : "bg-gray-700"
              }`}
            >
              {tab.toUpperCase()}
            </button>
          ))}
        </div>

        {/* ================= HACKS ================= */}
        {activeTab === "hack" && (
          <>
            <h2 className="text-xl font-bold mb-4">Existing Hacks</h2>

            {hacks.length === 0 ? (
              <p className="text-gray-400 mb-6">No hacks uploaded yet</p>
            ) : (
              hacks.map((h) => (
                <div key={h.id} className="glass p-3 mb-3 rounded flex justify-between">
                  <span>{h.title}</span>
                  <button
                    onClick={() => deleteItem("hacks", h.id)}
                    className="bg-red-500 px-3 py-1 rounded hover:bg-red-600"
                  >
                    Delete
                  </button>
                </div>
              ))
            )}

            <h2 className="text-xl font-bold mt-8 mb-2">Upload Hack</h2>

            <div className="space-y-2">
              <input placeholder="Title" onChange={(e)=>setTitle(e.target.value)} className="input"/>
              <input placeholder="Author" onChange={(e)=>setAuthor(e.target.value)} className="input"/>
              <input placeholder="Base Game" onChange={(e)=>setBaseGame(e.target.value)} className="input"/>
              <input placeholder="Platform" onChange={(e)=>setPlatform(e.target.value)} className="input"/>
              <input placeholder="Status" onChange={(e)=>setStatus(e.target.value)} className="input"/>
              <textarea placeholder="Description" onChange={(e)=>setDescription(e.target.value)} className="input"/>

              <p>Cover Image</p>
              <input type="file" onChange={(e)=>setCoverFile(e.target.files?.[0]||null)} />

              <input
                placeholder="Download Link (Drive / MEGA)"
                onChange={(e)=>setDownloadLink(e.target.value)}
                className="input"
              />
            </div>

            <button onClick={uploadHack} className="btn mt-4">
              Upload Hack
            </button>
          </>
        )}

        {/* KEEP CHEATS + EMULATORS SAME */}
      </div>
    </PageWrapper>
  );
}