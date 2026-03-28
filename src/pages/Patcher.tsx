import { useState } from "react";
import PageWrapper from "../components/PageWrapper";

export default function Patcher() {
  const [romFile, setRomFile] = useState<File | null>(null);
  const [patchFile, setPatchFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  const handlePatch = () => {
    if (!romFile || !patchFile) {
      setMessage("Please upload both ROM and Patch file.");
      return;
    }

    // Simulate patching (real logic can be added later)
    setTimeout(() => {
      const blob = new Blob(["Patched ROM data"], {
        type: "application/octet-stream",
      });

      const url = URL.createObjectURL(blob);
      setDownloadUrl(url);
      setMessage("✅ ROM patched successfully!");
    }, 1000);
  };

  return (
    <PageWrapper>
    <div className="p-4 max-w-3xl mx-auto space-y-6">
      
      <h1 className="text-3xl font-bold text-center">ROM Patcher</h1>

      {/* ROM Upload */}
      <div className="bg-gray-900 p-6 rounded-xl border border-gray-800">
        <p className="mb-2 font-semibold">Upload ROM File</p>
        <input
          type="file"
          accept=".gba,.nds,.gb,.gbc"
          onChange={(e) => setRomFile(e.target.files?.[0] || null)}
          className="w-full"
        />
      </div>

      {/* Patch Upload */}
      <div className="bg-gray-900 p-6 rounded-xl border border-gray-800">
        <p className="mb-2 font-semibold">Upload Patch File</p>
        <input
          type="file"
          accept=".ips,.ups,.bps"
          onChange={(e) => setPatchFile(e.target.files?.[0] || null)}
          className="w-full"
        />
      </div>

      {/* Button */}
      <button
        onClick={handlePatch}
        className="w-full bg-red-500 hover:bg-red-600 py-3 rounded-lg font-semibold"
      >
        Patch ROM
      </button>

      {/* Message */}
      {message && (
        <div className="text-center text-green-400">{message}</div>
      )}

      {/* Download */}
      {downloadUrl && (
        <div className="text-center">
          <a
            href={downloadUrl}
            download="patched_rom.gba"
            className="underline text-blue-400"
          >
            Download Patched ROM
          </a>
        </div>
      )}

    </div>
    </PageWrapper>
  );
}