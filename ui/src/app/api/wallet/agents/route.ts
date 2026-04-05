import { NextResponse } from "next/server";

/**
 * Proxies to the wallet package HTTP server `POST /agents` (e.g. curl to :3210/agents).
 * Browser calls cannot hit localhost:3210 directly without CORS; the UI calls this route instead.
 */
export async function POST(request: Request) {
  const base =
    process.env.WALLET_SERVICE_URL?.replace(/\/$/, "") ?? "http://127.0.0.1:3210";

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (
    typeof body !== "object" ||
    body === null ||
    !("names" in body) ||
    !Array.isArray((body as { names: unknown }).names)
  ) {
    return NextResponse.json(
      { error: 'Expected JSON body: { "names": string[] }' },
      { status: 400 },
    );
  }

  const names = (body as { names: unknown[] }).names
    .map((n) => (typeof n === "string" ? n.trim() : ""))
    .filter((s) => s.length > 0);
  if (names.length === 0) {
    return NextResponse.json(
      { error: "names must contain at least one non-empty string" },
      { status: 400 },
    );
  }

  try {
    const res = await fetch(`${base}/agents`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ names }),
    });

    const text = await res.text();
    let json: unknown;
    try {
      json = text ? JSON.parse(text) : {};
    } catch {
      return NextResponse.json(
        { error: "Wallet service returned non-JSON", raw: text.slice(0, 200) },
        { status: 502 },
      );
    }

    return NextResponse.json(json, { status: res.status });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      {
        error: `Wallet service unreachable at ${base}. Is it running? ${msg}`,
      },
      { status: 502 },
    );
  }
}
