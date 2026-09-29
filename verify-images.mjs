// TEMPORARY verification harness — runs the REAL src/lib modules (via Vite's
// SSR module loader) against the REAL database rows and the REAL network.
// No mocks: every URL produced by the app is fetched for real.
import { readFileSync, writeFileSync } from "node:fs";
import { createServer } from "vite";
import { createClient } from "@supabase/supabase-js";

const env = Object.fromEntries(
  readFileSync(new URL("./.env", import.meta.url), "utf8")
    .split(/\r?\n/)
    .filter((l) => l.includes("=") && !l.trim().startsWith("#"))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    })
);

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY, {
  global: { fetch: (i, init = {}) => fetch(i, { ...init, signal: AbortSignal.timeout(15_000) }) },
});

const out = [];
const LOG_FILE = new URL("./verify-images.txt", import.meta.url);
const log = (s) => {
  out.push(s);
  console.log(s);
  writeFileSync(LOG_FILE, out.join("\n"), "utf8"); // incremental so progress is observable
};
let failures = 0;
const check = (label, ok, detail = "") => {
  if (!ok) failures++;
  log(`   ${ok ? "PASS" : "FAIL"} · ${label}${detail ? ` — ${detail}` : ""}`);
};

const probe = async (url) => {
  try {
    const r = await fetch(url, { redirect: "follow", signal: AbortSignal.timeout(15_000) });
    return { status: r.status, type: r.headers.get("content-type") || "" };
  } catch (e) {
    return { status: 0, type: `ERR ${e.message}` };
  }
};

const server = await createServer({ server: { middlewareMode: true }, logLevel: "error" });
const imageUrl = await server.ssrLoadModule("/src/lib/imageUrl.ts");
const imageList = await server.ssrLoadModule("/src/lib/imageList.ts");

const {
  normalizeImageUrl, getImageFallbackUrl, extractGoogleDriveId, isGoogleDriveUrl,
  COVER_PLACEHOLDER, stripUrlArtifacts,
} = imageUrl;
const { parseImageList, parseTextList, serializeImageList, splitImageUrlInput } = imageList;

log("=========== 1. URL TYPE MATRIX (task §21) ===========");
const FILE_A = "1W9xaMbzESxiKgCKChmfo1qrqIbGMlEen";
const cases = [
  ["drive /file/d/ID/view", `https://drive.google.com/file/d/${FILE_A}/view?usp=sharing`, `https://lh3.googleusercontent.com/d/${FILE_A}=w1000`],
  ["drive /file/d/ID (no view)", `https://drive.google.com/file/d/${FILE_A}`, `https://lh3.googleusercontent.com/d/${FILE_A}=w1000`],
  ["drive open?id=", `https://drive.google.com/open?id=${FILE_A}`, `https://lh3.googleusercontent.com/d/${FILE_A}=w1000`],
  ["drive uc?export=view&id=", `https://drive.google.com/uc?export=view&id=${FILE_A}`, `https://lh3.googleusercontent.com/d/${FILE_A}=w1000`],
  ["drive thumbnail?id=", `https://drive.google.com/thumbnail?id=${FILE_A}&sz=w1000`, `https://lh3.googleusercontent.com/d/${FILE_A}=w1000`],
  ["drive.usercontent download?id=", `https://drive.usercontent.google.com/download?id=${FILE_A}&export=view`, `https://lh3.googleusercontent.com/d/${FILE_A}=w1000`],
  ["already-direct lh3 …=w1000", `https://lh3.googleusercontent.com/d/${FILE_A}=w1000`, `https://lh3.googleusercontent.com/d/${FILE_A}=w1000`],
  ["already-direct lh3 no size", `https://lh3.googleusercontent.com/d/${FILE_A}`, `https://lh3.googleusercontent.com/d/${FILE_A}`],
  ["supabase storage (unchanged)", "https://rpznamshbijuoagakrye.supabase.co/storage/v1/object/public/hacks/covers/x.jpg", "https://rpznamshbijuoagakrye.supabase.co/storage/v1/object/public/hacks/covers/x.jpg"],
  ["plain external image (unchanged)", "https://example.com/image.jpg", "https://example.com/image.jpg"],
  ["url with query commas (unchanged)", "https://example.com/a.png?w=1,2&h=3", "https://example.com/a.png?w=1,2&h=3"],
  ["empty", "", ""],
  ["garbage", "not a url at all", "not a url at all"],
  ["docs.google.com (not an image)", "https://docs.google.com/document/d/abc1234567890/edit", "https://docs.google.com/document/d/abc1234567890/edit"],
  ["drive folder (not an image)", "https://drive.google.com/drive/folders/1AbCdEfGhIjKlMnOp", "https://drive.google.com/drive/folders/1AbCdEfGhIjKlMnOp"],
  ["stray artefacts stripped", `  ["https://drive.google.com/file/d/${FILE_A}/view"]  `, `https://lh3.googleusercontent.com/d/${FILE_A}=w1000`],
];
for (const [label, input, expected] of cases) {
  const actual = normalizeImageUrl(input);
  check(label, actual === expected, actual === expected ? "" : `got ${JSON.stringify(actual)}`);
}

log("");
log("=========== 2. HELPERS ===========");
check("extractGoogleDriveId on share link", extractGoogleDriveId(cases[0][1]) === FILE_A);
check("extractGoogleDriveId on non-drive", extractGoogleDriveId("https://example.com/x.jpg") === null);
check("isGoogleDriveUrl true", isGoogleDriveUrl(cases[0][1]) === true);
check("isGoogleDriveUrl false", isGoogleDriveUrl("https://example.com/x.jpg") === false);
check("fallback for direct lh3 url", getImageFallbackUrl(`https://lh3.googleusercontent.com/d/${FILE_A}=w1000`) === `https://drive.google.com/thumbnail?id=${FILE_A}&sz=w1000`);
check("fallback null for non-google", getImageFallbackUrl("https://example.com/x.jpg") === null);
check("no throw on malformed input", stripUrlArtifacts("") === "" && normalizeImageUrl("::::") === "::::");

log("");
log("=========== 3. LIST CODEC (every encoding that exists in the DB) ===========");
const SHADOW_RAW = `["[\\"https://lh3.googleusercontent.com/d/AAAABBBBCCCC=w1000\\",\\"https://lh3.googleusercontent.com/d/DDDDEEEEFFFF=w1000\\"]"]`;
const encCases = [
  ["js array (text[] column)", ["https://a.example/1.jpg", "https://a.example/2.jpg"], 2],
  ["json array text", `["https://a.example/1.jpg","https://a.example/2.jpg"]`, 2],
  ["json array text w/ spaces", `[ "https://a.example/1.jpg" , "https://a.example/2.jpg" ]`, 2],
  ["double encoded", JSON.stringify([JSON.stringify(["https://a.example/1.jpg", "https://a.example/2.jpg"])]), 2],
  ["postgres literal {a,b}", "{https://a.example/1.jpg,https://a.example/2.jpg}", 2],
  ["postgres literal quoted", `{"https://a.example/1.jpg","https://a.example/2.jpg"}`, 2],
  ["empty json array []", "[]", 0],
  ["null", null, 0],
  ["undefined", undefined, 0],
  ["newline separated", "https://a.example/1.jpg\nhttps://a.example/2.jpg", 2],
  ["real legacy double-encoded value", SHADOW_RAW, 2],
];
for (const [label, input, expectedCount] of encCases) {
  const list = parseImageList(input);
  check(label, list.length === expectedCount, `count=${list.length} ${JSON.stringify(list).slice(0, 130)}`);
}
check("serializeImageList → parseImageList round trip", (() => {
  const urls = ["https://drive.google.com/file/d/1AbCdEfGhIjKlMnOpQ/view?usp=sharing", "https://x.example/a.png"];
  const back = parseImageList(serializeImageList(urls));
  return back.length === 2 && back[0] === urls[0] && back[1] === urls[1];
})());
check("re-saving never adds a corruption layer", (() => {
  const once = serializeImageList(parseImageList(SHADOW_RAW));
  const twice = serializeImageList(parseImageList(once));
  return once === twice && parseImageList(once).length === 2;
})());
check("features text list keeps entries whole", parseTextList(["Gen 1-9, all regions", "Physical/Special Split"]).length === 2);
check("splitImageUrlInput separates junk", (() => {
  const { valid, invalid } = splitImageUrlInput(["https://a.example/1.jpg", "", "junk", "  "]);
  return valid.length === 1 && invalid.length === 1;
})());

log("");
log("=========== 4. REAL DATABASE ROWS → REAL HTTP REQUESTS ===========");
const { data: rows, error } = await supabase.from("hacks").select("*").order("created_at", { ascending: false });
if (error) throw error;
log(`rows: ${rows.length}`);

let totalShots = 0;
let totalOk = 0;
let totalFallback = 0;
for (const row of rows) {
  log("");
  log(`--- ${row.title} ---`);
  log(`   stored: ${JSON.stringify(row.screenshots).slice(0, 110)}`);

  const list = parseImageList(row.screenshots);
  totalShots += list.length;

  const dirty = list.filter((u) => !/^https:\/\//.test(u) || /["\\[\]{}]/.test(u));
  check(`all ${list.length} parsed entries are clean URLs`, dirty.length === 0, dirty.slice(0, 2).join(" | "));

  let rowOk = 0;
  for (const raw of list) {
    const primary = normalizeImageUrl(raw);
    const fallback = getImageFallbackUrl(raw);
    const res = await probe(primary);
    let ok = res.status === 200 && res.type.startsWith("image/");
    if (!ok && fallback) {
      const res2 = await probe(fallback);
      if (res2.status === 200 && res2.type.startsWith("image/")) {
        ok = true;
        totalFallback++;
        log(`   · primary failed (HTTP ${res.status}) but Drive fallback worked: ${primary.slice(0, 90)}`);
      }
    }
    if (ok) rowOk++;
    else log(`   !! NOT AN IMAGE: ${primary.slice(0, 100)} → HTTP ${res.status} ${res.type}`);
  }
  totalOk += rowOk;
  check(`all ${list.length} screenshots render`, rowOk === list.length, `${rowOk}/${list.length}`);

  const cover = normalizeImageUrl(row.cover_image);
  const coverRes = await probe(cover);
  check("cover image loads", coverRes.status === 200 && coverRes.type.startsWith("image/"), `HTTP ${coverRes.status} ${coverRes.type}`);

  const dl = row.download_link || "";
  check("download destination untouched", /^https?:\/\//.test(dl), dl.slice(0, 72));
}

log("");
log(`TOTAL screenshots: ${totalShots} · rendered: ${totalOk} · needed Google fallback endpoint: ${totalFallback}`);
check("placeholder is network-free", COVER_PLACEHOLDER.startsWith("data:image/svg+xml"));

log("");
log(failures === 0 ? "ALL VERIFICATION CHECKS PASSED" : `${failures} CHECK(S) FAILED`);

await server.close();
writeFileSync(new URL("./verify-images.txt", import.meta.url), out.join("\n"), "utf8");
process.exit(failures === 0 ? 0 : 1);

