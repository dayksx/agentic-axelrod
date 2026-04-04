"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useTimeStore } from "@/stores/timeStore";
import { ArenaDetail } from "@/components/ArenaDetail";

export default function ArenaDetailPage() {
  const params = useParams();
  const tournamentId = params.id as string;
  const arenaId = Number(params.arenaId);
  const derived = useTimeStore((s) => s.derived);

  if (!derived) {
    return (
      <div className="flex items-center justify-center h-full text-muted">
        Loading...
      </div>
    );
  }

  const arena = derived.arenas.find((a) => a.arenaId === arenaId);
  if (!arena) {
    return (
      <div className="flex items-center justify-center h-full text-muted">
        Arena not found
      </div>
    );
  }

  const round = derived.round;
  const tournamentData = useTimeStore.getState().tournamentData;
  const roundData = tournamentData?.rounds.find((r) => r.roundNumber === round);
  const announcement = roundData?.announcement ?? null;

  return (
    <div className="h-full flex flex-col">
      {/* Arena header */}
      <div className="flex items-center gap-3 px-6 py-3 border-b border-border bg-surface-2/50">
        <Link
          href={`/tournament/${tournamentId}`}
          className="text-muted hover:text-foreground transition-colors text-sm"
        >
          ← All Arenas
        </Link>
        <span className="text-muted">/</span>
        <span className="text-sm font-medium">
          Arena #{arenaId} — {arena.agentA} vs {arena.agentB}
        </span>
      </div>

      {/* Arena content */}
      <div className="flex-1 overflow-y-auto">
        <ArenaDetail
          arena={arena}
          phase={derived.phase}
          announcement={announcement}
        />
      </div>
    </div>
  );
}
