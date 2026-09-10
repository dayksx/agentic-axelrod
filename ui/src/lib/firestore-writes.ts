import "server-only";
import { adminDb } from "./firebase-admin";

// Firestore has no auto-increment. Postgres used `serial` PKs, and the existing
// data + client code rely on integer ids, so we hand out ids from a per-collection
// counter doc (`counters/{collection}`), incremented atomically in a transaction.
export async function nextId(collection: string): Promise<number> {
  const ref = adminDb.collection("counters").doc(collection);
  return adminDb.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const current = (snap.exists ? (snap.get("value") as number) : 0) ?? 0;
    const value = current + 1;
    tx.set(ref, { value }, { merge: true });
    return value;
  });
}

/** Returns the single doc matching field == value, or null. */
export async function findOneByField<T>(
  collection: string,
  field: string,
  value: unknown,
): Promise<T | null> {
  const snap = await adminDb.collection(collection).where(field, "==", value).limit(1).get();
  return snap.empty ? null : (snap.docs[0].data() as T);
}
