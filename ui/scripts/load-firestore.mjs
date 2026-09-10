// Loads the recovered Supabase export (data-export/*.json) into Firestore.
// Usage: node scripts/load-firestore.mjs /path/to/service-account.json
//
// - Each doc id = the row's integer primary key (as string).
// - chat_messages get a denormalized tournament_id (looked up via their match),
//   so the replay UI can fetch a tournament's chat in one query.
// - Seeds a `counters` collection (one doc per table) with the current max id,
//   so the write path can hand out new integer ids atomically.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const here = dirname(fileURLToPath(import.meta.url));
const exportDir = join(here, "..", "..", "data-export");

const saPath = process.argv[2];
if (!saPath) {
  console.error("Usage: node scripts/load-firestore.mjs <service-account.json>");
  process.exit(1);
}
const sa = JSON.parse(readFileSync(saPath, "utf8"));
initializeApp({ credential: cert(sa), projectId: sa.project_id });
const db = getFirestore();

const load = (name) =>
  JSON.parse(readFileSync(join(exportDir, `${name}.json`), "utf8"));

const TABLES = [
  "agents",
  "tournaments",
  "tournament_agents",
  "matches",
  "chat_messages",
  "scores",
  "announcements",
  "tournament_transactions",
  "users",
];

async function commitInChunks(coll, rows, idFor, size = 400) {
  let written = 0;
  for (let i = 0; i < rows.length; i += size) {
    const batch = db.batch();
    for (const row of rows.slice(i, i + size)) {
      batch.set(db.collection(coll).doc(String(idFor(row))), row);
    }
    await batch.commit();
    written += Math.min(size, rows.length - i);
    process.stdout.write(`  ${coll}: ${written}/${rows.length}\r`);
  }
  console.log(`  ${coll}: ${written}/${rows.length} done`);
}

async function main() {
  // Build match_id -> tournament_id map for chat denormalization.
  const matches = load("matches");
  const matchToTournament = new Map(matches.map((m) => [m.id, m.tournament_id]));

  const maxId = {};
  for (const t of TABLES) {
    const rows = load(t);
    maxId[t] = rows.reduce((mx, r) => Math.max(mx, r.id ?? 0), 0);

    if (t === "chat_messages") {
      for (const r of rows) r.tournament_id = matchToTournament.get(r.match_id) ?? null;
    }
    console.log(`Loading ${t} (${rows.length} rows)...`);
    await commitInChunks(t, rows, (r) => r.id);
  }

  // Seed counters for the write path.
  const cbatch = db.batch();
  for (const t of TABLES) {
    cbatch.set(db.collection("counters").doc(t), { value: maxId[t] });
  }
  await cbatch.commit();
  console.log("Seeded counters:", maxId);
  console.log("\nDone. Firestore is loaded.");
}

main().catch((e) => {
  console.error("\nLOAD FAILED:", e.message);
  process.exit(1);
});
