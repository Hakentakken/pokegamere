import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function Navbar() {
  const [dark, setDark] = useState(true);
  const [user, setUser] = useState<any>(null);

  const navigate = useNavigate();

  // 🌙 Force dark mode
  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  // 🔐 Check auth state
  useEffect(() => {
    checkUser();

    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      checkUser();
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const checkUser = async () => {
    const { data } = await supabase.auth.getUser();
    setUser(data.user);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    navigate("/");
  };

  return (
    <nav className="sticky top-0 z-50 backdrop-blur-xl bg-black/40 border-b border-white/10">
      
      <div className="max-w-6xl mx-auto flex justify-between items-center px-4 py-3">

        {/* 🔥 Logo */}
        <h1
          onClick={() => navigate("/")}
          className="text-2xl font-extrabold text-red-500 tracking-wide cursor-pointer hover:scale-105 transition"
        >
          PokéGamere
        </h1>

        {/* 🧭 Links */}
        <div className="hidden md:flex gap-6 text-sm text-gray-300 items-center">
          <Link to="/" className="hover:text-red-500 transition">Home</Link>
          <Link to="/hacks" className="hover:text-red-500 transition">Hacks</Link>
          <Link to="/cheats" className="hover:text-red-500 transition">Cheats</Link>
          <Link to="/emulators" className="hover:text-red-500 transition">Emulators</Link>
          <Link to="/patcher" className="hover:text-red-500 transition">Patcher</Link>
          <Link to="/qa" className="hover:text-red-500 transition">Q&A</Link>
        </div>

        {/* ⚙️ Right Side */}
        <div className="flex items-center gap-3">

          {/* 🌙 Toggle */}
          <button
            onClick={() => setDark(!dark)}
            className="bg-white/10 px-3 py-1 rounded-lg text-sm hover:bg-white/20 transition"
          >
            {dark ? "☀️" : "🌙"}
          </button>

          {/* 🔐 Auth Buttons */}
          {!user ? (
            <button
              onClick={() => navigate("/login")}
              className="bg-red-500 px-4 py-1.5 rounded-lg text-sm hover:bg-red-600 transition"
            >
              Login
            </button>
          ) : (
            <>
              <button
                onClick={() => navigate("/admin")}
                className="bg-green-500 px-4 py-1.5 rounded-lg text-sm hover:bg-green-600 transition"
              >
                Admin
              </button>

              <button
                onClick={handleLogout}
                className="bg-gray-700 px-4 py-1.5 rounded-lg text-sm hover:bg-gray-600 transition"
              >
                Logout
              </button>
            </>
          )}

        </div>
      </div>
    </nav>
  );
}