import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import BackToTop from "./components/BackToTop";
import ScrollToTop from "./components/ScrollToTop";
import Login from "./pages/Login";
import About from "./pages/About";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Contact from "./pages/Contact";
import Home from "./pages/Home";
import Hacks from "./pages/Hacks";
import HackDetail from "./pages/HackDetail";
import Cheats from "./pages/Cheats";
import Emulators from "./pages/Emulators";
import Patcher from "./pages/Patcher";
import QA from "./pages/QA";
import NotFound from "./pages/NotFound";
import Admin from "./pages/Admin";

export default function App() {
  return (
    <Router>
      <div className="flex min-h-screen flex-col bg-ink-950 text-neutral-200">
        <ScrollToTop />
        <Navbar />

        <main className="relative min-w-0 flex-1">
          <Routes>
            <Route path="/about" element={<About />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<Home />} />
            <Route path="/hacks" element={<Hacks />} />
            <Route path="/hack/:id" element={<HackDetail />} />
            <Route path="/cheats" element={<Cheats />} />
            <Route path="/emulators" element={<Emulators />} />
            <Route path="/patcher" element={<Patcher />} />
            <Route path="/qa" element={<QA />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>

        <Footer />
        <BackToTop />
      </div>
    </Router>
  );
}