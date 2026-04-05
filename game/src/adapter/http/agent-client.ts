import type { ArenaAnnouncement, Cooperation } from "../../domain/model/types.js";

const REQUEST_TIMEOUT_MS = 120_000;

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.replace(/\/$/, "");
}

/**
 * AI `POST /message/send` (load phase + arena announcements) requires names ending in `.eth`.
 * Config / DB often use bare labels; normalize so agents accept the payload.
 */
export function ensNameForAgentApi(name: string): string {
  const t = name.trim();
  if (t.length === 0) return t;
  return t.endsWith(".eth") ? t : `${t}.eth`;
}

/** A2A load body requires `domain`; derive from ENS name (`alice.eth` → `https://alice.local`). */
function domainFromEnsName(name: string): string {
  if (!name.endsWith(".eth")) {
    throw new Error(
      `internal: domainFromEnsName expected *.eth, got "${name}"`,
    );
  }
  return `https://${name.slice(0, -".eth".length)}.local`;
}

function errorTextFromBody(parsed: unknown, fallback: string): string {
  if (
    parsed !== null &&
    typeof parsed === "object" &&
    "error" in parsed &&
    typeof (parsed as { error: unknown }).error === "string"
  ) {
    return (parsed as { error: string }).error;
  }
  return fallback;
}

async function postMessageSend(
  baseUrl: string,
  body: unknown,
  label: string,
): Promise<unknown> {
  const url = `${normalizeBaseUrl(baseUrl)}/message/send`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  const text = await res.text();
  let parsed: unknown;
  try {
    parsed = text.length > 0 ? JSON.parse(text) : null;
  } catch {
    throw new Error(
      `${label} at ${url}: ${res.status} non-JSON body: ${text.slice(0, 200)}`,
    );
  }

  if (!res.ok) {
    throw new Error(
      `${label} failed (${res.status}): ${errorTextFromBody(parsed, text)}`,
    );
  }

  if (parsed !== null && typeof parsed === "object") {
    const o = parsed as Record<string, unknown>;
    if (typeof o.error === "string" && o.phase === undefined) {
      throw new Error(`${label} error: ${o.error}`);
    }
  }

  return parsed;
}

export interface PostAgentLoadParams {
  name: string;
  strategy: string;
  tournamentId: number;
  rosterRole?: "new" | "carryover";
}

export async function postAgentLoad(
  baseUrl: string,
  params: PostAgentLoadParams,
): Promise<void> {
  const name = ensNameForAgentApi(params.name);
  await postMessageSend(
    baseUrl,
    {
      phase: "load" as const,
      name,
      domain: domainFromEnsName(name),
      strategy: params.strategy,
      tournamentId: params.tournamentId,
      ...(params.rosterRole !== undefined ? { rosterRole: params.rosterRole } : {}),
    },
    "Agent load",
  );
}

export interface PostAgentChatParams {
  message: string;
  /** Passed to the agent as round / iteration context (tournament round index). */
  iteration: number;
  /** Full snapshot of arena-scoped announcements accumulated so far in the tournament (GM syncs on chat/decision/announce). */
  arenaAnnouncements?: readonly ArenaAnnouncement[];
}

export async function postAgentChat(
  baseUrl: string,
  params: PostAgentChatParams,
): Promise<string> {
  const body: Record<string, unknown> = {
    phase: "chat" as const,
    message: params.message,
    iteration: params.iteration,
  };
  if (params.arenaAnnouncements !== undefined) {
    body.arenaAnnouncements = params.arenaAnnouncements;
  }
  const parsed = await postMessageSend(baseUrl, body, "Agent chat");
  if (
    parsed === null ||
    typeof parsed !== "object" ||
    (parsed as { phase?: unknown }).phase !== "chat" ||
    typeof (parsed as { reply?: unknown }).reply !== "string"
  ) {
    throw new Error(
      `Agent chat: expected { phase: "chat", reply: string }, got ${JSON.stringify(parsed)?.slice(0, 200)}`,
    );
  }
  return (parsed as { reply: string }).reply;
}

export async function postAgentAnnounce(
  baseUrl: string,
  params: {
    tournamentId: number;
    roundNumber: number;
    arenaId: number;
    arenaAnnouncements: readonly ArenaAnnouncement[];
  },
): Promise<string> {
  const parsed = await postMessageSend(
    baseUrl,
    {
      phase: "announce" as const,
      tournamentId: params.tournamentId,
      roundNumber: params.roundNumber,
      arenaId: params.arenaId,
      arenaAnnouncements: params.arenaAnnouncements,
    },
    "Agent announce",
  );
  if (
    parsed === null ||
    typeof parsed !== "object" ||
    (parsed as { phase?: unknown }).phase !== "announce" ||
    typeof (parsed as { announcement?: unknown }).announcement !== "string"
  ) {
    throw new Error(
      `Agent announce: expected { phase: "announce", announcement: string }, got ${JSON.stringify(parsed)?.slice(0, 200)}`,
    );
  }
  return (parsed as { announcement: string }).announcement;
}

export async function postAgentDecision(
  baseUrl: string,
  options?: { arenaAnnouncements?: readonly ArenaAnnouncement[] },
): Promise<Cooperation> {
  const body: Record<string, unknown> = { phase: "decision" as const };
  if (options?.arenaAnnouncements !== undefined) {
    body.arenaAnnouncements = options.arenaAnnouncements;
  }
  const parsed = await postMessageSend(baseUrl, body, "Agent decision");
  if (
    parsed === null ||
    typeof parsed !== "object" ||
    (parsed as { phase?: unknown }).phase !== "decision" ||
    ((parsed as { cooperation?: unknown }).cooperation !== "cooperate" &&
      (parsed as { cooperation?: unknown }).cooperation !== "defect")
  ) {
    throw new Error(
      `Agent decision: expected { phase: "decision", cooperation: "cooperate"|"defect" }, got ${JSON.stringify(parsed)?.slice(0, 200)}`,
    );
  }
  return (parsed as { cooperation: Cooperation }).cooperation;
}

export interface AgentRevealPayload {
  round: number;
  yourMove: Cooperation;
  adversaryMove: Cooperation;
  yourScore: number;
  adversaryScore: number;
}

export async function postAgentReveal(
  baseUrl: string,
  reveal: AgentRevealPayload,
): Promise<void> {
  await postMessageSend(
    baseUrl,
    {
      phase: "reveal" as const,
      reveal: {
        round: reveal.round,
        yourMove: reveal.yourMove,
        adversaryMove: reveal.adversaryMove,
        yourScore: reveal.yourScore,
        adversaryScore: reveal.adversaryScore,
      },
    },
    "Agent reveal",
  );
}

/** Clears in-graph tournament announcements (and related thread state) on the agent. */
export async function postAgentEnd(baseUrl: string): Promise<void> {
  await postMessageSend(baseUrl, { phase: "end" as const }, "Agent end");
}
