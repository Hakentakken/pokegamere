import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function Navbar() {
  const [dark, setDark] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);

  // 🌙 Dark mode
  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  // 🔐 Auth
  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
    };
    checkUser();
  }, []);

  return (
    <>
      {/* NAVBAR */}
      <nav className="sticky top-0 z-50 backdrop-blur-xl bg-black/40 border-b border-white/10">
        <div className="max-w-6xl mx-auto flex justify-between items-center p-4">

          {/* LOGO */}
          <Link
  to="/"
  className="text-2xl font-extrabold text-red-500 tracking-wide transition-all duration-300 hover:text-red-400 hover:scale-105"
>
  Poké<span className="text-white">Smith</span>
</Link>

          {/* DESKTOP */}
          <div className="hidden md:flex gap-6 text-sm text-gray-300 items-center">
            <Link to="/" className="hover:text-red-500">Home</Link>
            <Link to="/hacks" className="hover:text-red-500">Hacks</Link>
            <Link to="/cheats" className="hover:text-red-500">Cheats</Link>
            <Link to="/emulators" className="hover:text-red-500">Emulators</Link>
            <Link to="/patcher" className="hover:text-red-500">Patcher</Link>
            <Link to="/qa" className="hover:text-red-500">Q&A</Link>
            <Link to="/about" className="hover:text-red-500">About</Link>
            <Link to="/privacy" className="hover:text-red-500">Privacy</Link>

            {user ? (
              <Link to="/admin" className="text-green-400">Admin</Link>
            ) : (
              <Link to="/login" className="text-blue-400">Login</Link>
            )}

            <button
              onClick={() => setDark(!dark)}
              className="bg-white/10 px-3 py-1 rounded-lg hover:bg-white/20"
            >
              {dark ? "☀️" : "🌙"}
            </button>
          </div>

          {/* MOBILE BUTTON */}
          <button
            onClick={() => setMenuOpen(true)}
            className="md:hidden text-3xl text-white"
          >
            ☰
          </button>
        </div>
      </nav>

      {/* 🔥 OVERLAY */}
      {menuOpen && (
        <div
          onClick={() => setMenuOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
        />
      )}

      {/* 🚀 SLIDE DRAWER */}
      <div
        className={`fixed top-0 right-0 h-full w-72 bg-black border-l border-white/10 z-50 transform transition-transform duration-300 ${
          menuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* HEADER */}
        <div className="flex justify-between items-center p-4 border-b border-white/10">
          <h2 className="text-lg font-bold text-red-500">Menu</h2>

          <button
            onClick={() => setMenuOpen(false)}
            className="text-xl"
          >
            ✕
          </button>
        </div>

        {/* LINKS */}
        <div className="flex flex-col p-4 gap-4 text-gray-300">

          <Link to="/" onClick={()=>setMenuOpen(false)}>Home</Link>
          <Link to="/hacks" onClick={()=>setMenuOpen(false)}>Hacks</Link>
          <Link to="/cheats" onClick={()=>setMenuOpen(false)}>Cheats</Link>
          <Link to="/emulators" onClick={()=>setMenuOpen(false)}>Emulators</Link>
          <Link to="/patcher" onClick={()=>setMenuOpen(false)}>Patcher</Link>
          <Link to="/qa" onClick={()=>setMenuOpen(false)}>Q&A</Link>

          <hr className="border-white/10"/>

          <Link to="/about" onClick={()=>setMenuOpen(false)}>About</Link>
          <Link to="/privacy" onClick={()=>setMenuOpen(false)}>Privacy</Link>

          <hr className="border-white/10"/>

          {user ? (
            <Link to="/admin" onClick={()=>setMenuOpen(false)} className="text-green-400">
              Admin Panel
            </Link>
          ) : (
            <Link to="/login" onClick={()=>setMenuOpen(false)} className="text-blue-400">
              Login
            </Link>
          )}

          {/* THEME */}
          <button
            onClick={() => setDark(!dark)}
            className="bg-white/10 px-3 py-2 rounded-lg mt-4"
          >
            Toggle Theme
          </button>
        </div>
      </div>
    </>
  );
}