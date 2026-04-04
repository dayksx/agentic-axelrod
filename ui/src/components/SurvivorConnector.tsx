"use client";

import type { TournamentSummary } from "@/types/models";

export function SurvivorConnector({
  prev,
  next,
}: {
  prev: TournamentSummary;
  next: TournamentSummary;
}) {
  const prevNames = new Set(prev.agents.map((a) => a.name));
  const survivors = next.agents.filter((a) => prevNames.has(a.name));

  if (survivors.length === 0) return null;

  return (
    <div className="flex items-center justify-center py-2">
      <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-surface-2 border border-border text-xs text-muted">
        <span className="text-accent">↓</span>
        {survivors.map((s) => s.name).join(", ")} carried forward
        <span className="text-accent">↓</span>
      </div>
    </div>
  );
}
