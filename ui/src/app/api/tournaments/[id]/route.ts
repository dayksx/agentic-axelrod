import { NextResponse } from "next/server";
import { fetchTournamentData } from "@/lib/queries.server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const tournamentId = Number(id);
  if (!Number.isInteger(tournamentId)) {
    return NextResponse.json({ error: "Invalid tournament id" }, { status: 400 });
  }
  try {
    return NextResponse.json(await fetchTournamentData(tournamentId));
  } catch (e) {
    console.error(`GET /api/tournaments/${id} failed:`, e);
    return NextResponse.json({ error: "Failed to load tournament" }, { status: 500 });
  }
}
