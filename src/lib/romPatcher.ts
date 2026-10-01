/**
 * Client-side loader for the bundled RomPatcher.js engine
 * (`public/rom-patcher-js/`, served at `/rom-patcher-js/` in dev AND in the
 * production build — Vite copies `public/` verbatim).
 *
 * The webapp script is a classic script whose top-level `const RomPatcherWeb`
 * lives in the global *lexical* scope (not on `window`), so it is referenced
 * here as a bare global and only declared for TypeScript.
 *
 * Nothing here runs at module evaluation: the script tag is injected on first
 * call from a client effect, guarded so React Strict Mode can never load or
 * initialize the engine twice. The engine resolves its own module/worker
 * dependencies relative to the injected script's directory, so an absolute
 * `/rom-patcher-js/...` URL keeps every asset path correct on any route.
 */
declare global {
  const RomPatcherWeb: RomPatcherWebAPI;
  const RomPatcher: RomPatcherAPI;
  const BinFile: BinFileConstructor;
}

/** The slice of a `BinFile` this app touches (engine + worker hand these out). */
export type RpBinFile = {
  fileName: string;
  fileSize: number;
  _u8array: Uint8Array;
  setName(newName: string): string;
  setExtension(newExtension: string): string;
};

/** Settings accepted by `RomPatcherWeb.initialize` / `setSettings`. */
export type RpSettings = {
  language?: string;
  requireValidation?: boolean;
  allowDropFiles?: boolean;
  outputSuffix?: boolean;
  oninitialize?: (api: unknown) => void;
  onloadrom?: (romFile: RpBinFile) => void;
  onvalidaterom?: (romFile: RpBinFile, valid: boolean) => void;
  onloadpatch?: (binFile: RpBinFile, embededPatchInfo: unknown, parsedPatch: unknown) => void;
  onpatch?: (patchedRom: RpBinFile) => void;
};

export type RomPatcherWebAPI = {
  initialize(settings: RpSettings): void;
  isInitialized(): boolean;
  setSettings(settings: RpSettings): void;
  provideRomFile(binFile: unknown, transferFakeFile?: boolean): void;
  providePatchFile(binFile: unknown, transferFakeFile?: boolean): void;
  applyPatch(): void;
  setErrorMessage(message?: string, className?: string): void;
  getEmbededPatches(): unknown;
};

export type RomPatcherAPI = {
  parsePatchFile(binFile: unknown): unknown;
};

export type BinFileConstructor = new (
  file: File | Blob,
  callback?: (binFile: RpBinFile) => void
) => RpBinFile;

const SCRIPT_ID = "rp-webapp-script";

let webappPromise: Promise<void> | null = null;

/** Loads `RomPatcher.webapp.js` once; resolves when the engine API is usable. */
export function loadRomPatcherWeb(): Promise<void> {
  if (!webappPromise) {
    webappPromise = new Promise<void>((resolve, reject) => {
      const existing = document.getElementById(SCRIPT_ID);
      if (existing) {
        // Another caller already injected it — wait for that same tag.
        existing.addEventListener("load", () => resolve());
        existing.addEventListener("error", () => reject(new Error("Failed to load RomPatcher.js")));
        return;
      }

      const script = document.createElement("script");
      script.id = SCRIPT_ID;
      script.async = true;
      script.src = "/rom-patcher-js/RomPatcher.webapp.js";
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Failed to load RomPatcher.js"));
      document.head.appendChild(script);
    });
  }
  return webappPromise;
}
