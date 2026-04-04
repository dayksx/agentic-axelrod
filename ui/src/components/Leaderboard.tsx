"use client";

import type { LeaderboardEntry } from "@/types/models";
import { AgentAvatar } from "./AgentAvatar";

export function Leaderboard({ entries }: { entries: LeaderboardEntry[] }) {
  return (
    <div className="p-4">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-muted mb-4">
        Leaderboard
      </h2>
      <div className="space-y-1">
        {entries.map((entry) => (
          <div
            key={entry.agentName}
            className="flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-500"
            style={{ order: entry.rank }}
          >
            <span className="w-5 text-right text-sm font-mono text-muted">
              {entry.rank}
            </span>
            <AgentAvatar name={entry.agentName} size={28} />
            <span className="flex-1 text-sm font-medium truncate">
              {entry.agentName}
            </span>
            <span className="font-mono text-sm font-semibold tabular-nums">
              {entry.score}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
