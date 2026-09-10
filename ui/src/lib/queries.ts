import type { TournamentSummary, TournamentData, UserRow } from "@/types/models";

// Client-side data access. Reads go through server API routes, which hit
// Firestore with the Admin SDK (the browser never talks to the database).

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? `Request failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export function fetchTournamentList(): Promise<TournamentSummary[]> {
  return getJson<TournamentSummary[]>("/api/tournaments");
}

export function fetchTournamentData(tournamentId: number): Promise<TournamentData> {
  return getJson<TournamentData>(`/api/tournaments/${tournamentId}`);
}

export function fetchPlayerQueue(): Promise<UserRow[]> {
  return getJson<UserRow[]>("/api/players");
}
