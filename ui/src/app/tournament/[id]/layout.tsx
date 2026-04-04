"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { fetchTournamentData } from "@/lib/queries";
import { organizeByRound } from "@/lib/organize";
import { fetchAgentBalances } from "@/lib/balance";
import { useTimeStore } from "@/stores/timeStore";
import { Leaderboard } from "@/components/Leaderboard";
import { PlaybackControls } from "@/components/PlaybackControls";
import Link from "next/link";
import type { OrganizedTournament } from "@/types/models";

export default function TournamentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const tournamentId = Number(params.id);
  const [data, setData] = useState<OrganizedTournament | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const loadTournament = useTimeStore((s) => s.loadTournament);
  const loadBalances = useTimeStore((s) => s.loadBalances);
  const derived = useTimeStore((s) => s.derived);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchTournamentData(tournamentId)
      .then(async (raw) => {
        if (cancelled) return;
        const organized = organizeByRound(raw);
        setData(organized);
        loadTournament(organized);
        setLoading(false);
        const balances = await fetchAgentBalances(raw.agents);
        if (!cancelled) loadBalances(balances);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err.message ?? "Failed to load tournament");
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [tournamentId, loadTournament]);

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-muted text-lg">Loading tournament...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-defect text-lg">{error ?? "No data"}</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Top bar */}
      <header className="flex items-center gap-3 px-6 py-3 border-b border-border bg-surface shrink-0">
        <Link
          href="/"
          className="text-muted hover:text-foreground transition-colors"
        >
          Home
        </Link>
        <span className="text-muted">/</span>
        <span className="font-medium">Tournament #{tournamentId}</span>
        {derived && (
          <span className="ml-auto text-sm text-muted">
            Round {derived.round} of {data.tournament.total_rounds}
          </span>
        )}
      </header>

      {/* Main content: leaderboard + right panel */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: leaderboard */}
        <aside className="w-72 border-r border-border bg-surface overflow-y-auto shrink-0">
          {derived && <Leaderboard entries={derived.leaderboard} />}
        </aside>

        {/* Right: arenas grid or arena detail */}
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>

      {/* Bottom: playback controls */}
      <PlaybackControls totalRounds={data.tournament.total_rounds} />
    </div>
  );
}
