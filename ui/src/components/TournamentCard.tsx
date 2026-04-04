"use client";

import Link from "next/link";
import type { TournamentSummary } from "@/types/models";
import { AgentAvatar } from "./AgentAvatar";

function formatDate(iso: string): string {
  const d = new Date(iso);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
}

export function TournamentCard({
  tournament,
}: {
  tournament: TournamentSummary;
}) {
  const isCompleted = tournament.status === "completed";
  const isRunning = tournament.status === "running";

  const card = (
    <div
      className={`rounded-xl border p-6 transition-all ${
        isCompleted
          ? "border-border bg-surface hover:border-accent/40 hover:bg-surface-2 cursor-pointer"
          : "border-border/50 bg-surface/50 opacity-60 cursor-default"
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Tournament #{tournament.id}</h3>
        {isRunning && (
          <span className="text-xs px-2.5 py-1 rounded-full bg-accent/20 text-accent font-medium">
            In Progress
          </span>
        )}
        {isCompleted && (
          <span className="text-xs px-2.5 py-1 rounded-full bg-cooperate/20 text-cooperate font-medium">
            Completed
          </span>
        )}
      </div>

      <div className="text-sm text-muted mb-4">
        {tournament.totalRounds} rounds •{" "}
        {formatDate(tournament.createdAt)}
      </div>

      {/* Agent avatars */}
      <div className="flex gap-2 mb-4">
        {tournament.agents.map((agent) => (
          <div key={agent.id} className="flex flex-col items-center gap-1">
            <AgentAvatar name={agent.name} size={32} />
            <span className="text-[10px] text-muted truncate w-16 text-center">
              {agent.name}
            </span>
          </div>
        ))}
      </div>

      {/* Winner */}
      {tournament.winner && (
        <div className="flex items-center gap-2 pt-3 border-t border-border">
          <span className="text-sm text-muted">Winner:</span>
          <span className="text-sm font-semibold text-cooperate">
            {tournament.winner.name}
          </span>
          <span className="text-sm font-mono text-muted">
            ({tournament.winner.score} pts)
          </span>
        </div>
      )}
    </div>
  );

  if (isCompleted) {
    return <Link href={`/tournament/${tournament.id}`}>{card}</Link>;
  }

  return card;
}
