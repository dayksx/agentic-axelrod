"use client";

import { useState } from "react";
import type { LeaderboardEntry, AgentRow } from "@/types/models";
import { useTimeStore } from "@/stores/timeStore";
import { AgentAvatar } from "./AgentAvatar";
import { AgentModal } from "./AgentModal";

export function Leaderboard({ entries }: { entries: LeaderboardEntry[] }) {
  const [selectedAgent, setSelectedAgent] = useState<AgentRow | null>(null);
  const agents = useTimeStore((s) => s.tournamentData?.agents ?? []);
  const transactions = useTimeStore(
    (s) => s.tournamentData?.transactions ?? [],
  );
  const balances = useTimeStore((s) => s.balances);

  return (
    <div className="p-4">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-muted mb-4">
        Leaderboard
      </h2>
      <div className="space-y-1">
        {entries.map((entry) => (
          <div
            key={entry.agentName}
            className="flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-500 cursor-pointer hover:bg-surface-2"
            style={{ order: entry.rank }}
            onClick={() => {
              const agent = agents.find((a) => a.name === entry.agentName);
              if (agent) setSelectedAgent(agent);
            }}
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

      {selectedAgent && (
        <AgentModal
          agent={selectedAgent}
          transactions={transactions}
          balance={balances?.get(selectedAgent.id) ?? null}
          onClose={() => setSelectedAgent(null)}
        />
      )}
    </div>
  );
}
