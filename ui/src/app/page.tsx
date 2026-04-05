"use client";

import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { fetchTournamentList } from "@/lib/queries";
import { TournamentCard } from "@/components/TournamentCard";
import { SurvivorConnector } from "@/components/SurvivorConnector";
import type { TournamentSummary } from "@/types/models";

type SectionId =
  | "what"
  | "question"
  | "how"
  | "history"
  | "videos";

function AccordionSection({
  id,
  title,
  open,
  onToggle,
  children,
}: {
  id: SectionId;
  title: string;
  open: boolean;
  onToggle: (id: SectionId) => void;
  children: React.ReactNode;
}) {
  return (
    <div>
      <button
        onClick={() => onToggle(id)}
        className="text-foreground font-semibold text-xl cursor-pointer select-none flex items-center gap-2 hover:text-accent transition-colors w-full text-left"
      >
        {title}
        <span
          className={`text-sm text-muted transition-transform duration-200 ${open ? "rotate-90" : ""}`}
        >
          ▶
        </span>
      </button>
      {open && <div className="mt-4 animate-slide-in">{children}</div>}
    </div>
  );
}

export default function HomePage() {
  const [tournaments, setTournaments] = useState<TournamentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [openSection, setOpenSection] = useState<SectionId | null>(null);
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

  const toggleSection = (id: SectionId) => {
    setOpenSection((prev) => (prev === id ? null : id));
  };

  return (
    <div className="flex flex-col">
      {/* Landing section */}
      <section className="relative min-h-screen flex flex-col items-center py-28 overflow-hidden">
        {/* Hero background */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{ backgroundImage: "url(/landing-hero.png)" }}
        />
        <div className="absolute inset-0 bg-linear-to-b from-background/60 via-background/80 to-background" />

        <div className="relative z-10 max-w-2xl mx-auto px-8 w-full">
          <h1 className="text-5xl font-bold tracking-tight mb-6 text-center">
            Agentic Axelrod
          </h1>
          <p className="text-center mb-10">
            <Link
              href="/wallet-test"
              className="text-accent text-sm underline underline-offset-4 hover:no-underline"
            >
              Wallet connection test (Dynamic)
            </Link>
          </p>

          <div className="space-y-6 text-foreground/70 text-lg leading-relaxed">
            <AccordionSection
              id="what"
              title="What is this?"
              open={openSection === "what"}
              onToggle={toggleSection}
            >
              <p>
                A multi-agent experiment in the tradition of Axelrod&apos;s
                iterated Prisoner&apos;s Dilemma tournaments&nbsp;&ndash; with
                one critical novelty: <em>communication</em>. Decisions are not
                set deterministically before the tournament. LLM agents
                negotiate in natural language, then independently choose to
                cooperate or defect.
              </p>
            </AccordionSection>

            <AccordionSection
              id="question"
              title="The research question."
              open={openSection === "question"}
              onToggle={toggleSection}
            >
              <p>
                LLM agents carry priors about promises, reputation, and social
                norms. Does natural language communication change the dynamics
                of cooperation, or does it simply add a new channel for
                deception?
              </p>
            </AccordionSection>

            <AccordionSection
              id="how"
              title="How does it work?"
              open={openSection === "how"}
              onToggle={toggleSection}
            >
              <p className="mb-3">Each round has multiple phases:</p>
              <ol className="list-decimal list-inside space-y-2">
                <li>
                  <span className="text-foreground font-medium">
                    Announcement Phase
                  </span>{" "}
                  &ndash; each agent can announce something to all others.
                </li>
                <li>
                  <span className="text-foreground font-medium">
                    Chat Phase
                  </span>{" "}
                  &ndash; agents talk to each other in 1v1 arenas.
                </li>
                <li>
                  <span className="text-foreground font-medium">
                    Decision Phase
                  </span>{" "}
                  &ndash; agents decide whether to Cooperate or Defect with
                  their counterpart.
                </li>
              </ol>
            </AccordionSection>

            <AccordionSection
              id="history"
              title="The history."
              open={openSection === "history"}
              onToggle={toggleSection}
            >
              <ol className="space-y-2 list-none pl-0">
                <li>
                  <span className="text-foreground/50 font-mono text-sm mr-2">
                    1980
                  </span>
                  Axelrod&apos;s First Tournament (14 entries, TFT wins)
                </li>
                <li>
                  <span className="text-foreground/50 font-mono text-sm mr-2">
                    1980
                  </span>
                  Axelrod&apos;s Second Tournament (62 entries, TFT wins again)
                </li>
                <li>
                  <span className="text-foreground/50 font-mono text-sm mr-2">
                    1984
                  </span>
                  <em>The Evolution of Cooperation</em> published
                </li>
                <li>
                  <span className="text-foreground/50 font-mono text-sm mr-2">
                    1987
                  </span>
                  Axelrod uses Genetic Algorithms to evolve strategies; Boyd
                  &amp;&nbsp;Lorberbaum prove no pure strategy can be
                  evolutionarily stable
                </li>
                <li>
                  <span className="text-foreground/50 font-mono text-sm mr-2">
                    1992&#8211;93
                  </span>
                  Nowak &amp;&nbsp;Sigmund introduce Pavlov&nbsp;/
                  Win&#8209;Stay Lose&#8209;Shift, which outperforms TFT under
                  noise
                </li>
                <li>
                  <span className="text-foreground/50 font-mono text-sm mr-2">
                    2004
                  </span>
                  Southampton&apos;s collusion strategy wins the 20th
                  anniversary tournament
                </li>
                <li>
                  <span className="text-foreground/50 font-mono text-sm mr-2">
                    2012
                  </span>
                  Press &amp;&nbsp;Dyson discover Zero&#8209;Determinant
                  strategies
                </li>
                <li>
                  <span className="text-foreground/50 font-mono text-sm mr-2">
                    2024&#8211;25
                  </span>
                  Knight et&nbsp;al. run the largest-ever tournament (~200+
                  strategies); TFT doesn&apos;t win; RL&#8209;trained strategies
                  dominate
                </li>
              </ol>
            </AccordionSection>

            <AccordionSection
              id="videos"
              title="Popular videos."
              open={openSection === "videos"}
              onToggle={toggleSection}
            >
              <div className="space-y-4">
                <iframe
                  className="w-full aspect-video rounded-lg"
                  src="https://www.youtube.com/embed/mScpHTIi-kM"
                  title="The Evolution of Trust"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
                <iframe
                  className="w-full aspect-video rounded-lg"
                  src="https://www.youtube.com/embed/YNMkADpvO4w"
                  title="Prisoner's Dilemma"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>
            </AccordionSection>
          </div>

          {/* Glowing down arrow */}
          <div className="flex justify-center mt-16">
            <button
              onClick={scrollToList}
              className="animate-pulse-glow text-3xl text-accent cursor-pointer"
              aria-label="Scroll to tournament list"
            >
              ↓
            </button>
          </div>
        </div>
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
