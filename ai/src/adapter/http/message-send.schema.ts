/**
 * Structured request body for `POST /message/send` — discriminated union on `phase`
 * (same idea as typed LangGraph state / tool args: validate before invoke).
 */
import z from "zod";
import type { WorkflowPhase } from "../../domain/types.js";
import { WORKFLOW_PHASES } from "../../domain/types.js";

export const WORKFLOW_PHASE_ALIASES: Readonly<Record<string, WorkflowPhase>> = {
  configure: "load",
  decide: "decision",
  discussion: "chat",
  game_end: "end",
};

export function workflowPhaseHintText(): string {
  const canonical = WORKFLOW_PHASES.join(", ");
  const aliasHint = Object.entries(WORKFLOW_PHASE_ALIASES)
    .map(([alias, phase]) => `${alias}→${phase}`)
    .join(", ");
  return `body.phase must be one of: ${canonical}. Accepted aliases: ${aliasHint}.`;
}

const CooperationSchema = z.enum(["cooperate", "defect"]);

const EnsNameSchema = z
  .string()
  .min(1)
  .refine((s) => s.endsWith(".eth"), {
    message: "name must end with .eth",
  });

export const RevealRoundPayloadSchema = z.object({
  round: z.number().finite(),
  yourMove: CooperationSchema,
  adversaryMove: CooperationSchema,
  yourScore: z.number().finite(),
  adversaryScore: z.number().finite(),
});

/**
 * Canonical HTTP body after `phase` normalization and optional `reveal` lifting.
 * `.strict()` rejects unknown keys per variant (helps catch typos).
 */
export const MessageSendRequestSchema = z.discriminatedUnion("phase", [
  z
    .object({
      phase: z.literal("load"),
      name: EnsNameSchema,
      domain: z.string().min(1),
      strategy: z.string(),
    })
    .strict(),
  z
    .object({
      phase: z.literal("chat"),
      message: z.string().min(1),
      iteration: z.number().finite().optional(),
    })
    .strict(),
  z.object({ phase: z.literal("decision") }).strict(),
  z.object({ phase: z.literal("end") }).strict(),
  z
    .object({
      phase: z.literal("reveal"),
      reveal: RevealRoundPayloadSchema,
    })
    .strict(),
]);

export type MessageSendRequest = z.infer<typeof MessageSendRequestSchema>;

/** Lowercase canonical phase or map alias → canonical. */
function normalizePhaseAliases(data: unknown): unknown {
  if (data === null || typeof data !== "object") return data;
  const o = { ...(data as Record<string, unknown>) };
  const raw = o.phase;
  if (typeof raw !== "string") return data;
  const s = raw.trim().toLowerCase();
  if ((WORKFLOW_PHASES as readonly string[]).includes(s)) {
    o.phase = s;
    return o;
  }
  const mapped = WORKFLOW_PHASE_ALIASES[s];
  if (mapped !== undefined) {
    o.phase = mapped;
    return o;
  }
  return data;
}

/**
 * Accept legacy shape: `phase: "reveal"` with round fields at top level instead of under `reveal`.
 */
function liftRevealPayload(data: unknown): unknown {
  if (data === null || typeof data !== "object") return data;
  const b = data as Record<string, unknown>;
  if (b.phase !== "reveal") return data;
  if (
    b.reveal !== undefined &&
    b.reveal !== null &&
    typeof b.reveal === "object"
  ) {
    return data;
  }
  const keys = [
    "round",
    "yourMove",
    "adversaryMove",
    "yourScore",
    "adversaryScore",
  ] as const;
  for (const k of keys) {
    if (!(k in b)) return data;
  }
  return {
    phase: "reveal",
    reveal: {
      round: b.round,
      yourMove: b.yourMove,
      adversaryMove: b.adversaryMove,
      yourScore: b.yourScore,
      adversaryScore: b.adversaryScore,
    },
  };
}

export function preprocessMessageSendBody(raw: unknown): unknown {
  return liftRevealPayload(normalizePhaseAliases(raw));
}

function phaseRecognized(data: unknown): boolean {
  if (data === null || typeof data !== "object") return false;
  const p = (data as Record<string, unknown>).phase;
  return (
    typeof p === "string" && (WORKFLOW_PHASES as readonly string[]).includes(p)
  );
}

export type ParseMessageSendResult =
  | { ok: true; body: MessageSendRequest }
  | {
      ok: false;
      status: 400;
      error: string;
      issues?: z.core.$ZodIssue[];
    };

/** Validate and narrow to {@link MessageSendRequest}. */
export function parseMessageSendBody(raw: unknown): ParseMessageSendResult {
  const preprocessed = preprocessMessageSendBody(raw);
  if (!phaseRecognized(preprocessed)) {
    return {
      ok: false,
      status: 400,
      error: workflowPhaseHintText(),
    };
  }
  const result = MessageSendRequestSchema.safeParse(preprocessed);
  if (!result.success) {
    return {
      ok: false,
      status: 400,
      error: "Invalid message/send body for this phase",
      issues: result.error.issues,
    };
  }
  return { ok: true, body: result.data };
}
