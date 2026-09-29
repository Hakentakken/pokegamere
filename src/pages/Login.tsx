import { useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "../lib/supabase";
import Atmosphere from "../components/Atmosphere";
import { DUR, EASE } from "../lib/motion";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      alert("Enter email and password");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      alert(error.message);
    } else {
      window.location.href = "/admin";
    }
  };

  return (
    <div className="relative flex min-h-[80svh] items-center justify-center overflow-hidden px-4 py-16">
      <Atmosphere tone="hero" />

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: DUR.section, ease: EASE.emphasis }}
        className="glass edge-lit relative w-full max-w-sm rounded-2xl p-7 shadow-panel"
      >
        <span className="light-layer" aria-hidden="true" />

        <div className="relative flex flex-col items-center text-center">
          <span className="h-12 w-12 overflow-hidden rounded-full border border-white/15 shadow-glow-sm">
            <img src="/logo.jpeg" alt="" className="h-full w-full object-cover" />
          </span>

          <h1 className="mt-4 font-display text-2xl font-bold text-white">Admin Login</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Restricted area — authorized personnel only.
          </p>
        </div>

        <div className="relative mt-6 space-y-4">
          <div>
            <label
              htmlFor="admin-email"
              className="mb-1.5 block text-xs font-medium tracking-wider text-neutral-500 uppercase"
            >
              Email
            </label>
            <input
              id="admin-email"
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
            />
          </div>

          <div>
            <label
              htmlFor="admin-password"
              className="mb-1.5 block text-xs font-medium tracking-wider text-neutral-500 uppercase"
            >
              Password
            </label>
            <input
              id="admin-password"
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input"
            />
          </div>

          <button
            onClick={handleLogin}
            disabled={loading}
            className="btn-hero w-full disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}