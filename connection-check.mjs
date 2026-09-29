import { readFileSync, writeFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

// --- load credentials from .env (never printed) -----------------------------
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
const mask = (s) => (s ? `${s.slice(0, 8)}…(${s.length} chars)` : "MISSING");

// every request gets a hard 10s timeout so the check can never hang
const timedFetch = (input, init = {}) =>
  fetch(input, {
    ...init,
    signal: init.signal ?? AbortSignal.timeout(10_000),
  });

const out = [];
const log = (s) => {
  out.push(s);
  console.log(s);
};

const EXPECTED = {
  hacks: [
    "id", "created_at", "title", "author", "base_game", "platform", "status",
    "rating", "description", "cover_image", "download_link", "screenshots", "features",
  ],
  cheats: ["id", "created_at", "title", "game", "code", "description"],
  emulators: ["id", "created_at", "name", "platform", "description", "download_link"],
};

const main = async () => {
  log(`env: VITE_SUPABASE_URL=${mask(url)}  VITE_SUPABASE_ANON_KEY=${mask(key)}`);
  if (!url || !key) throw new Error("missing env values");

  // 1. app's own client connects
  const supabase = createClient(url, key, { global: { fetch: timedFetch } });
  const { data: sess, error: sessErr } = await supabase.auth.getSession();
  log(
    `1) supabase-js client created: ${
      sessErr ? "ERR " + sessErr.message : "OK (auth: " + (sess?.session ? "signed-in" : "anonymous") + ")"
    }`
  );

  // 2. the exact queries the UI runs
  const queries = [
    ["hacks (Home/Hacks pages)", supabase.from("hacks").select("*", { count: "exact" }).order("created_at", { ascending: false })],
    ["cheats (Cheats page)", supabase.from("cheats").select("*", { count: "exact" })],
    ["emulators (Emulators page)", supabase.from("emulators").select("*", { count: "exact" })],
  ];
  for (const [label, q] of queries) {
    const { count, error } = await q;
    log(`2) ${label}: ${error ? "ERR " + error.message : `OK rows=${count}`}`);
  }

  // 3. verify every column the code reads/writes really exists (per-column probe)
  const spec = await timedFetch(`${url}/rest/v1/`, {
    headers: { apikey: key, Authorization: `Bearer ${key}`, Accept: "application/openapi+json" },
  });
  log(`3) OpenAPI endpoint: HTTP ${spec.status} ${spec.status === 401 ? "(schema not exposed to anon — probing columns instead)" : ""}`);
  for (const [table, expected] of Object.entries(EXPECTED)) {
    const missing = [];
    for (const col of expected) {
      const { error } = await supabase.from(table).select(col).limit(1);
      if (error) missing.push(col);
    }
    log(`   - ${table}: probed ${expected.length} columns → ${missing.length ? `MISSING: ${missing.join(", ")}` : "all present ✓"}`);
  }

  // 4. storage bucket: first hack cover must be publicly readable
  const { data: row } = await supabase.from("hacks").select("cover_image").limit(1).maybeSingle();
  if (row?.cover_image) {
    const img = await timedFetch(row.cover_image, { method: "HEAD" });
    log(`4) storage public cover: HTTP ${img.status} (${row.cover_image.slice(0, 60)}…)`);
  } else {
    log(`4) storage public cover: no cover_image on first hack row (skipped)`);
  }

  log("CONNECTION CHECK DONE");
};

main()
  .catch((e) => log(`FATAL: ${e.message}`))
  .finally(() => {
    writeFileSync(new URL("./connection-check.txt", import.meta.url), out.join("\n"), "utf8");
  });
