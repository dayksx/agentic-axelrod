/**
 * Firestore (Admin SDK) client + id helpers for the Game Master.
 *
 * Postgres used `serial` primary keys; Firestore has no auto-increment, and the
 * existing data + UI rely on integer ids, so ids are handed out from a
 * per-collection counter doc (`counters/{collection}`) mutated atomically.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { initializeApp, getApps, cert, type App } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

let _db: Firestore | null = null;

/** True when persistence is configured (service-account key path is set). */
export function isFirebaseConfigured(): boolean {
  return Boolean(process.env.FIREBASE_SERVICE_ACCOUNT?.trim());
}

function initApp(): App {
  const existing = getApps();
  if (existing.length) return existing[0]!;
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) throw new Error("Missing FIREBASE_SERVICE_ACCOUNT in environment");
  const sa = JSON.parse(readFileSync(resolve(process.cwd(), raw), "utf8"));
  return initializeApp({ credential: cert(sa), projectId: sa.project_id });
}

export function db(): Firestore {
  if (_db) return _db;
  _db = getFirestore(initApp());
  return _db;
}

/** Atomically reserve `n` contiguous ids for a collection; returns them in order. */
export async function reserveIds(collection: string, n: number): Promise<number[]> {
  if (n <= 0) return [];
  const ref = db().collection("counters").doc(collection);
  const start = await db().runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const current = (snap.exists ? (snap.get("value") as number) : 0) ?? 0;
    tx.set(ref, { value: current + n }, { merge: true });
    return current;
  });
  return Array.from({ length: n }, (_, i) => start + i + 1);
}

export async function nextId(collection: string): Promise<number> {
  const [id] = await reserveIds(collection, 1);
  return id!;
}
