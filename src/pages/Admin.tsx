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

  // 🆕 Screenshots (links)
  const [screenshots, setScreenshots] = useState<string[]>([""]);

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

  // 🆕 HANDLE SCREENSHOT INPUT
  const handleScreenshotChange = (index: number, value: string) => {
    const updated = [...screenshots];
    updated[index] = value;
    setScreenshots(updated);
  };

  const addScreenshotField = () => {
    setScreenshots([...screenshots, ""]);
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

      await supabase.from("hacks").insert({
        title,
        author,
        base_game: baseGame,
        platform,
        status,
        rating,
        description,
        cover_image: coverUrl,
        download_link: downloadLink,
        screenshots: screenshots.filter((s) => s.trim() !== ""), // ✅ save array
      });

      alert("Hack uploaded 🚀");

      // reset
      setTitle("");
      setAuthor("");
      setBaseGame("");
      setPlatform("");
      setStatus("");
      setRating(0);
      setDescription("");
      setCoverFile(null);
      setDownloadLink("");
      setScreenshots([""]);

      fetchAll();
    } catch (err) {
      console.error(err);
      alert("Upload failed ❌");
    }
  };

  // 🧩 CHEAT
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

  // 🎮 EMULATOR
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
            <h2 className="text-xl font-bold mb-4">Upload Hack</h2>

            <div className="space-y-2">
              <input placeholder="Title" onChange={(e)=>setTitle(e.target.value)} className="input"/>
              <input placeholder="Author" onChange={(e)=>setAuthor(e.target.value)} className="input"/>
              <input placeholder="Base Game" onChange={(e)=>setBaseGame(e.target.value)} className="input"/>
              <input placeholder="Platform" onChange={(e)=>setPlatform(e.target.value)} className="input"/>
              <input placeholder="Status" onChange={(e)=>setStatus(e.target.value)} className="input"/>
              <textarea placeholder="Description" onChange={(e)=>setDescription(e.target.value)} className="input"/>

              <input type="file" onChange={(e)=>setCoverFile(e.target.files?.[0]||null)} />

              <input
                placeholder="Download Link"
                onChange={(e)=>setDownloadLink(e.target.value)}
                className="input"
              />

              {/* 🆕 SCREENSHOTS */}
              <p className="mt-4 font-semibold">Screenshots (Image URLs)</p>
              {screenshots.map((s, i) => (
                <input
                  key={i}
                  value={s}
                  onChange={(e)=>handleScreenshotChange(i, e.target.value)}
                  placeholder={`Screenshot ${i+1}`}
                  className="input"
                />
              ))}

              <button onClick={addScreenshotField} className="text-sm text-blue-400">
                + Add More
              </button>
            </div>

            <button onClick={uploadHack} className="btn mt-4">
              Upload Hack
            </button>
          </>
        )}

        {/* ================= CHEATS ================= */}
        {activeTab === "cheat" && (
          <>
            <h2 className="text-xl font-bold mb-4">Add Cheat</h2>

            <input placeholder="Title" onChange={(e)=>setCheatTitle(e.target.value)} className="input"/>
            <input placeholder="Game" onChange={(e)=>setCheatGame(e.target.value)} className="input"/>
            <textarea placeholder="Code" onChange={(e)=>setCheatCode(e.target.value)} className="input"/>
            <textarea placeholder="Description" onChange={(e)=>setCheatDesc(e.target.value)} className="input"/>

            <button onClick={addCheat} className="btn mt-3">Add Cheat</button>
          </>
        )}

        {/* ================= EMULATORS ================= */}
        {activeTab === "emulator" && (
          <>
            <h2 className="text-xl font-bold mb-4">Add Emulator</h2>

            <input placeholder="Name" onChange={(e)=>setEmuName(e.target.value)} className="input"/>
            <input placeholder="Platform" onChange={(e)=>setEmuPlatform(e.target.value)} className="input"/>
            <textarea placeholder="Description" onChange={(e)=>setEmuDesc(e.target.value)} className="input"/>
            <input placeholder="Download Link" onChange={(e)=>setEmuLink(e.target.value)} className="input"/>

            <button onClick={addEmu} className="btn mt-3">Add Emulator</button>
          </>
        )}

      </div>
    </PageWrapper>
  );
}