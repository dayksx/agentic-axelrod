import { NextResponse } from "next/server";
import { fetchPlayerQueue } from "@/lib/queries.server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json(await fetchPlayerQueue());
  } catch (e) {
    console.error("GET /api/players failed:", e);
    return NextResponse.json({ error: "Failed to load player queue" }, { status: 500 });
  }
}
