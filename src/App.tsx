import { lazy, Suspense } from "react";
import { Routes, Route, useLocation } from "react-router-dom";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import BackToTop from "./components/BackToTop";
import ScrollToTop from "./components/ScrollToTop";
const Login = lazy(() => import("./pages/Login"));
import About from "./pages/About";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Contact from "./pages/Contact";
import Home from "./pages/Home";
import Hacks from "./pages/Hacks";
import HackDetail from "./pages/HackDetail";
import Cheats from "./pages/Cheats";
import Emulators from "./pages/Emulators";
import QA from "./pages/QA";
import NotFound from "./pages/NotFound";
const Admin = lazy(() => import("./pages/Admin"));
import Editorial from "./pages/Editorial";
import Guides from "./pages/Guides";

export default function App() {
  const { pathname } = useLocation();
  return (
      <div className="flex min-h-screen flex-col bg-ink-950 text-neutral-200">
        <ScrollToTop />
        <Navbar />

        <main className="relative min-w-0 flex-1">
          <Suspense fallback={<p className="shell py-24">Loading...</p>}>
          <Routes>
            <Route path="/about" element={<About />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/editorial" element={<Editorial />} />
            <Route path="/guides" element={<Guides />} />
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<Home />} />
            <Route path="/hacks" element={<Hacks />} />
            {/* Canonical hack detail URL: readable slug, resolved to the DB id at runtime. */}
            <Route path="/hacks/:slug" element={<HackDetail key={pathname} />} />
            {/* Legacy UUID URLs — still work, and redirect to the canonical slug. */}
            <Route path="/hack/:id" element={<HackDetail key={pathname} />} />
            <Route path="/cheats" element={<Cheats />} />
            <Route path="/emulators" element={<Emulators />} />
            {/* No public patcher route. Its source is retained for future use. */}
            <Route path="/qa" element={<QA />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          </Suspense>
        </main>

        <Footer />
        <BackToTop />
      </div>
  );
}
