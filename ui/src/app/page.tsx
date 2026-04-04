"use client";

import { useEffect, useState, useRef } from "react";
import { fetchTournamentList } from "@/lib/queries";
import { TournamentCard } from "@/components/TournamentCard";
import { SurvivorConnector } from "@/components/SurvivorConnector";
import type { TournamentSummary } from "@/types/models";

export default function HomePage() {
  const [tournaments, setTournaments] = useState<TournamentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchTournamentList()
      .then(setTournaments)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const scrollToList = () => {
    listRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="flex flex-col">
      {/* Landing section — full viewport */}
      <section className="relative h-screen flex flex-col items-center justify-center overflow-hidden">
        {/* Hero background */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{ backgroundImage: "url(/landing-hero.png)" }}
        />
        <div className="absolute inset-0 bg-linear-to-b from-background/60 via-background/80 to-background" />

        <div className="relative z-10 max-w-2xl mx-auto px-8 text-center">
          <h1 className="text-5xl font-bold tracking-tight mb-6">
            Agentic Axelrod
          </h1>

          <div className="space-y-4 text-foreground/70 text-lg leading-relaxed">
            <p>
              <span className="text-foreground font-medium">What is this?</span>{" "}
              AI agents play the iterated Prisoner&apos;s Dilemma — but they can
              talk first. Each round, agents chat, negotiate, and then choose to
              cooperate or defect.
            </p>
            <p>
              <span className="text-foreground font-medium">The history.</span>{" "}
              In 1980, Robert Axelrod ran tournaments where submitted strategies
              competed in repeated Prisoner&apos;s Dilemma games. Tit-for-Tat
              famously won. What happens when the players are language models?
            </p>
            <p>
              <span className="text-foreground font-medium">
                The research question.
              </span>{" "}
              Can LLM agents develop cooperative strategies through natural
              language, or does the ability to deceive with words change the
              game?
            </p>
          </div>
        </div>

        {/* Glowing down arrow */}
        <button
          onClick={scrollToList}
          className="absolute bottom-12 animate-pulse-glow text-3xl text-accent cursor-pointer z-10"
          aria-label="Scroll to tournament list"
        >
          ↓
        </button>
      </section>

      {/* Tournament list section */}
      <section
        ref={listRef}
        className="min-h-screen px-8 py-16 max-w-3xl mx-auto w-full"
      >
        <h2 className="text-2xl font-semibold mb-8">Tournament Series</h2>

        {loading && <p className="text-muted">Loading tournaments...</p>}

        {!loading && tournaments.length === 0 && (
          <p className="text-muted">No tournaments found.</p>
        )}

        {!loading && (
          <div className="flex flex-col gap-2">
            {tournaments.map((t, i) => (
              <div key={t.id}>
                <TournamentCard tournament={t} />
                {i < tournaments.length - 1 && (
                  <SurvivorConnector
                    prev={tournaments[i]}
                    next={tournaments[i + 1]}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
