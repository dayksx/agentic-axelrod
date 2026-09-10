import "server-only";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { initializeApp, getApps, cert, type App } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// Server-only Firestore access via the Admin SDK. The service-account key path
// comes from FIREBASE_SERVICE_ACCOUNT (relative paths resolve from the ui root).
// Admin access bypasses security rules, so the database is never exposed to the
// browser: the UI reads through /api routes, never Firestore directly.
function initAdmin(): App {
  const existing = getApps();
  if (existing.length) return existing[0];

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) throw new Error("FIREBASE_SERVICE_ACCOUNT is not set");
  const keyPath = resolve(process.cwd(), raw);
  const sa = JSON.parse(readFileSync(keyPath, "utf8"));
  return initializeApp({ credential: cert(sa), projectId: sa.project_id });
}

export const adminDb = getFirestore(initAdmin());
