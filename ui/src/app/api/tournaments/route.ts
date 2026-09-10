import { NextResponse } from "next/server";
import { fetchTournamentList } from "@/lib/queries.server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json(await fetchTournamentList());
  } catch (e) {
    console.error("GET /api/tournaments failed:", e);
    return NextResponse.json({ error: "Failed to load tournaments" }, { status: 500 });
  }
}
