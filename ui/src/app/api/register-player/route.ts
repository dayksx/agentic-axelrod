import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

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

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceKey = process.env.SUPABASE_SECRET_KEY?.trim();

  const playerPayload = {
    name: nameRaw,
    prompt: promptRaw,
    walletAddress: walletAddress ?? "",
    ensName: ensName ?? "",
  };

  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({
      ok: true,
      persisted: false,
      message:
        "Received. Add SUPABASE_SECRET_KEY to ui/.env (server-only) to persist rows to agents.",
      player: playerPayload,
      agent: null,
    });
  }

  const supabase = createClient(supabaseUrl, serviceKey);

  const { data: inserted, error } = await supabase
    .from("agents")
    .insert({
      name: nameRaw,
      strategy_prompt: promptRaw,
      url: PENDING_AGENT_URL,
      wallet_address: walletAddress,
      ens_name: ensName,
    })
    .select("id, name, strategy_prompt, wallet_address, ens_name, created_at")
    .single();

  if (error) {
    const msg = error.message ?? "Database error";
    if (msg.includes("duplicate") || error.code === "23505") {
      return NextResponse.json(
        { error: "That player name is already taken." },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    persisted: true,
    message: "Player registered in the database.",
    player: playerPayload,
    agent: inserted,
  });
}
