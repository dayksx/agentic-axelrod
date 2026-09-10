import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { nextId } from "@/lib/firestore-writes";

export const runtime = "nodejs";

const NAME_MAX = 15;
const PROMPT_MAX = 500;
const NAME_RE = /^[a-zA-Z0-9]+$/;
const ETH_ADDR_RE = /^0x[a-fA-F0-9]{40}$/;
const TX_HASH_RE = /^0x[a-fA-F0-9]{64}$/;

function validate(body: Record<string, unknown>): string | null {
  const name =
    typeof body.agentName === "string" ? body.agentName.trim() : "";
  if (name.length === 0 || name.length > NAME_MAX || !NAME_RE.test(name))
    return `agentName must be 1–${NAME_MAX} alphanumeric characters`;

  const prompt =
    typeof body.strategyPrompt === "string" ? body.strategyPrompt.trim() : "";
  if (prompt.length === 0 || prompt.length > PROMPT_MAX)
    return `strategyPrompt must be 1–${PROMPT_MAX} characters`;

  const hw =
    typeof body.humanWallet === "string" ? body.humanWallet.trim() : "";
  if (!ETH_ADDR_RE.test(hw)) return "humanWallet must be a valid Ethereum address";

  const aw =
    typeof body.agentWallet === "string" ? body.agentWallet.trim() : "";
  if (!ETH_ADDR_RE.test(aw)) return "agentWallet must be a valid Ethereum address";

  const tx = typeof body.txHash === "string" ? body.txHash.trim() : "";
  if (!TX_HASH_RE.test(tx)) return "txHash must be a valid transaction hash";

  return null;
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const validationError = validate(body);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const agentName = (body.agentName as string).trim();
  const strategyPrompt = (body.strategyPrompt as string).trim();
  const humanWallet = (body.humanWallet as string).trim();
  const agentWallet = (body.agentWallet as string).trim();
  const txHash = (body.txHash as string).trim();

  try {
    const id = await nextId("users");
    const user = {
      id,
      agent_name: agentName,
      strategy_prompt: strategyPrompt,
      human_wallet: humanWallet,
      agent_wallet: agentWallet,
      tx_hash: txHash,
      reserved_date: null,
      tournament_date: null,
      created_at: new Date().toISOString(),
    };
    await adminDb.collection("users").doc(String(id)).set(user);

    return NextResponse.json({
      ok: true,
      user: {
        id: user.id,
        agent_name: user.agent_name,
        agent_wallet: user.agent_wallet,
        tx_hash: user.tx_hash,
        created_at: user.created_at,
      },
    });
  } catch (e) {
    console.error("join-tournament failed:", e);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}
