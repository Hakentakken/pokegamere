import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import BackToTop from "./components/BackToTop";
import Login from "./pages/Login";

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
      <div className="min-h-screen flex flex-col bg-black text-white">
        
        <Navbar />

        <main className="flex-1 p-4">
          <Routes>
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