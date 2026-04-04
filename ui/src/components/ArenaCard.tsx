"use client";

import Link from "next/link";
import type { DerivedArenaState, Phase } from "@/types/models";
import { AgentAvatar } from "./AgentAvatar";

export function ArenaCard({
  arena,
  phase,
  tournamentId,
}: {
  arena: DerivedArenaState;
  phase: Phase;
  tournamentId: number;
}) {
  const lastMsg =
    arena.visibleMessages.length > 0
      ? arena.visibleMessages[arena.visibleMessages.length - 1]
      : null;

  return (
    <Link
      href={`/tournament/${tournamentId}/arena/${arena.arenaId}`}
      className="block rounded-xl border border-border bg-surface hover:border-accent/40 hover:bg-surface-2 transition-all p-5"
    >
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-semibold text-muted">
          Arena #{arena.arenaId}
        </span>
        <PhaseBadge phase={phase} />
      </div>

      {/* Agents */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <AgentAvatar name={arena.agentA} size={28} />
          <span className="text-sm font-medium">{arena.agentA}</span>
        </div>
        <span className="text-muted text-xs">vs</span>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{arena.agentB}</span>
          <AgentAvatar name={arena.agentB} size={28} />
        </div>
      </div>

      {/* Phase-specific preview */}
      <div className="min-h-[48px]">
        {phase === "chat" && lastMsg && (
          <div className="text-xs text-muted truncate">
            <span className="font-medium text-foreground/70">
              {lastMsg.speaker}:
            </span>{" "}
            {lastMsg.content}
          </div>
        )}

        {(phase === "decision_sealed") && (
          <div className="flex items-center justify-center gap-4">
            <div className="w-8 h-10 bg-surface-2 rounded border border-border animate-pulse-card" />
            <div className="w-8 h-10 bg-surface-2 rounded border border-border animate-pulse-card" />
          </div>
        )}

        {(phase === "decision_revealed" || phase === "scoring" || phase === "announcement") && (
          <div className="flex items-center justify-center gap-6 text-lg font-bold">
            <span className={arena.decisionA === "C" ? "text-cooperate" : "text-defect"}>
              {arena.decisionA}
            </span>
            <span className="text-muted text-xs">vs</span>
            <span className={arena.decisionB === "C" ? "text-cooperate" : "text-defect"}>
              {arena.decisionB}
            </span>
          </div>
        )}

        {(phase === "scoring" || phase === "announcement") &&
          arena.deltaA !== null &&
          arena.deltaB !== null && (
            <div className="flex items-center justify-center gap-8 mt-1 text-sm font-mono">
              <span className={arena.deltaA >= 0 ? "text-cooperate" : "text-defect"}>
                {arena.deltaA >= 0 ? "+" : ""}{arena.deltaA}
              </span>
              <span className={arena.deltaB >= 0 ? "text-cooperate" : "text-defect"}>
                {arena.deltaB >= 0 ? "+" : ""}{arena.deltaB}
              </span>
            </div>
          )}
      </div>
    </Link>
  );
}

function PhaseBadge({ phase }: { phase: Phase }) {
  const labels: Record<Phase, string> = {
    chat: "💬 Chat",
    decision_sealed: "✉️ Deciding",
    decision_revealed: "🔓 Revealed",
    scoring: "📊 Scoring",
    announcement: "📡 Announce",
  };

  return (
    <span className="text-xs px-2 py-0.5 rounded-full bg-surface-2 text-muted">
      {labels[phase]}
    </span>
  );
}
