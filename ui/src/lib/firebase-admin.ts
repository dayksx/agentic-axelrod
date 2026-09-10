import "server-only";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { initializeApp, getApps, cert, type App } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// Server-only Firestore access via the Admin SDK. Admin access bypasses security
// rules, so the database is never exposed to the browser: the UI reads through
// /api routes, never Firestore directly.
//
// Credential resolution (in order):
//   1. FIREBASE_SERVICE_ACCOUNT_JSON — the key as raw JSON or base64 (use this on
//      Vercel / any serverless host, where there is no key file on disk).
//   2. FIREBASE_SERVICE_ACCOUNT — path to the key file (local dev; relative paths
//      resolve from the ui root).
type RawServiceAccount = {
  project_id: string;
  client_email: string;
  private_key: string;
};

function loadServiceAccount(): RawServiceAccount {
  const inline = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim();
  if (inline) {
    const json = inline.startsWith("{")
      ? inline
      : Buffer.from(inline, "base64").toString("utf8");
    return JSON.parse(json) as RawServiceAccount;
  }
  const path = process.env.FIREBASE_SERVICE_ACCOUNT?.trim();
  if (path) {
    return JSON.parse(readFileSync(resolve(process.cwd(), path), "utf8")) as RawServiceAccount;
  }
  throw new Error(
    "No Firebase credential: set FIREBASE_SERVICE_ACCOUNT_JSON (prod) or FIREBASE_SERVICE_ACCOUNT (local path)",
  );
}

function initAdmin(): App {
  const existing = getApps();
  if (existing.length) return existing[0]!;
  const sa = loadServiceAccount();
  return initializeApp({
    credential: cert({
      projectId: sa.project_id,
      clientEmail: sa.client_email,
      privateKey: sa.private_key,
    }),
    projectId: sa.project_id,
  });
}

export const adminDb = getFirestore(initAdmin());
