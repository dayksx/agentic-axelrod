import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { nextId, findOneByField } from "@/lib/firestore-writes";

export const runtime = "nodejs";

const NAME_MAX = 100;
const PROMPT_MAX = 500;
/** Placeholder until an agent HTTP URL exists for this registration */
const PENDING_AGENT_URL = "https://wallet-test.agentic-axelrod/pending";

function isEthAddress(s: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(s);
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (
    typeof body !== "object" ||
    body === null ||
    !("name" in body) ||
    !("prompt" in body)
  ) {
    return NextResponse.json(
      { error: "Expected JSON body with name and prompt" },
      { status: 400 },
    );
  }

  const nameRaw = typeof body.name === "string" ? body.name.trim() : "";
  const promptRaw = typeof body.prompt === "string" ? body.prompt.trim() : "";
  const walletRaw =
    "walletAddress" in body &&
    body.walletAddress !== null &&
    typeof body.walletAddress === "string"
      ? body.walletAddress.trim()
      : "";

  if (nameRaw.length === 0 || nameRaw.length > NAME_MAX) {
    return NextResponse.json(
      { error: `Player name must be 1–${NAME_MAX} characters` },
      { status: 400 },
    );
  }
  if (promptRaw.length === 0 || promptRaw.length > PROMPT_MAX) {
    return NextResponse.json(
      { error: `Prompt must be 1–${PROMPT_MAX} characters` },
      { status: 400 },
    );
  }

  const walletAddress =
    walletRaw !== "" && isEthAddress(walletRaw) ? walletRaw : null;

  const ensRaw =
    "ensName" in body &&
    body.ensName !== null &&
    typeof body.ensName === "string"
      ? body.ensName.trim()
      : "";
  const ensName = ensRaw !== "" ? ensRaw.slice(0, 255) : null;

  const playerPayload = {
    name: nameRaw,
    prompt: promptRaw,
    walletAddress: walletAddress ?? "",
    ensName: ensName ?? "",
  };

  try {
    // name is UNIQUE in the original schema — enforce it explicitly.
    const clash = await findOneByField<{ id: number }>("agents", "name", nameRaw);
    if (clash) {
      return NextResponse.json(
        { error: "That player name is already taken." },
        { status: 409 },
      );
    }

    const id = await nextId("agents");
    const agent = {
      id,
      name: nameRaw,
      strategy_prompt: promptRaw,
      url: PENDING_AGENT_URL,
      wallet_address: walletAddress,
      ens_name: ensName,
      created_at: new Date().toISOString(),
    };
    await adminDb.collection("agents").doc(String(id)).set(agent);

    return NextResponse.json({
      ok: true,
      persisted: true,
      message: "Player registered in the database.",
      player: playerPayload,
      agent,
    });
  } catch (e) {
    console.error("register-player failed:", e);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}
