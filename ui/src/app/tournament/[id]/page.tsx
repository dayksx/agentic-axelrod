"use client";

import { useParams } from "next/navigation";
import { useTimeStore } from "@/stores/timeStore";
import { ArenaCard } from "@/components/ArenaCard";
import {
  EntryTransactionPanel,
  PrizeTransactionPanel,
} from "@/components/TransactionPanel";

export default function TournamentPage() {
  const params = useParams();
  const tournamentId = Number(params.id);
  const derived = useTimeStore((s) => s.derived);
  const currentStep = useTimeStore((s) => s.currentStep);
  const totalSteps = useTimeStore((s) => s.totalSteps);
  const tournamentData = useTimeStore((s) => s.tournamentData);

  if (!derived || !tournamentData) {
    return (
      <div className="flex items-center justify-center h-full text-muted">
        Loading arenas...
      </div>
    );
  }

  const showEntryPanel = currentStep === 0;
  const showPrizePanel =
    currentStep === totalSteps - 1 &&
    tournamentData.tournament.status === "completed";

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

      {showEntryPanel && (
        <EntryTransactionPanel
          transactions={tournamentData.transactions}
          agents={tournamentData.agents}
        />
      )}

      {showPrizePanel && (
        <PrizeTransactionPanel
          transactions={tournamentData.transactions}
          agents={tournamentData.agents}
          leaderboard={derived.leaderboard}
        />
      )}
    </div>
  );
}
