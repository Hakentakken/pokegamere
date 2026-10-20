import { readFileSync } from "node:fs";

const env = Object.fromEntries(
  readFileSync(new URL("./.env", import.meta.url), "utf8")
    .split(/\r?\n/)
    .filter((l) => l.includes("=") && !l.trim().startsWith("#"))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    })
);

const url = env.VITE_SUPABASE_URL;
const key = env.VITE_SUPABASE_ANON_KEY;
const headers = { apikey: key, Authorization: `Bearer ${key}` };

// 1. Sample hack rows: id + title, to see the id format
const r1 = await fetch(`${url}/rest/v1/hacks?select=id,title,created_at&limit=12&order=created_at.asc`, { headers });
const rows = await r1.json();
console.log("=== hacks sample (id | title) ===");
for (const row of rows) console.log(`${row.id} | ${row.title} | ${row.created_at}`);

// 2. Check for a slug column by probing select
const r2 = await fetch(`${url}/rest/v1/hacks?select=slug&limit=1`, { headers });
console.log("\n=== slug column probe ===");
console.log("status:", r2.status, "|", (await r2.text()).slice(0, 200));

// 3. Total count + duplicate titles
const r3 = await fetch(`${url}/rest/v1/hacks?select=id,title`, { headers });
const all = await r3.json();
console.log("\n=== total hacks:", all.length, "===");
const byTitle = {};
for (const h of all) {
  const t = (h.title || "").trim().toLowerCase();
  (byTitle[t] ||= []).push(h.id);
}
const dupes = Object.entries(byTitle).filter(([, ids]) => ids.length > 1);
console.log("duplicate titles:", dupes.length ? JSON.stringify(dupes) : "none");
const missingTitle = all.filter((h) => !h.title || !String(h.title).trim());
console.log("missing/empty titles:", missingTitle.length, JSON.stringify(missingTitle));
