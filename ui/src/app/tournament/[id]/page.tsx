"use client";

import { useParams } from "next/navigation";
import { useTimeStore } from "@/stores/timeStore";
import { ArenaCard } from "@/components/ArenaCard";

export default function TournamentPage() {
  const params = useParams();
  const tournamentId = Number(params.id);
  const derived = useTimeStore((s) => s.derived);

  if (!derived) {
    return (
      <div className="flex items-center justify-center h-full text-muted">
        Loading arenas...
      </div>
    );
  }

  return (
    <div className="p-6">
      <h2 className="text-lg font-semibold mb-6">Arenas — Round {derived.round}</h2>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {derived.arenas.map((arena) => (
          <ArenaCard
            key={arena.arenaId}
            arena={arena}
            phase={derived.phase}
            tournamentId={tournamentId}
          />
        ))}
      </div>
    </div>
  );
}
