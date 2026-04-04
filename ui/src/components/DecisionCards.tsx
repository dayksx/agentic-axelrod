"use client";

import { AgentAvatar } from "./AgentAvatar";

export function DecisionCards({
  agentA,
  agentB,
  decisionA,
  decisionB,
  deltaA,
  deltaB,
}: {
  agentA: string;
  agentB: string;
  decisionA: "sealed" | "C" | "D";
  decisionB: "sealed" | "C" | "D";
  deltaA: number | null;
  deltaB: number | null;
}) {
  return (
    <div className="flex items-center justify-center gap-16 py-8">
      <DecisionCard
        agent={agentA}
        decision={decisionA}
        delta={deltaA}
      />
      <div className="text-muted text-2xl font-light">vs</div>
      <DecisionCard
        agent={agentB}
        decision={decisionB}
        delta={deltaB}
      />
    </div>
  );
}

function DecisionCard({
  agent,
  decision,
  delta,
}: {
  agent: string;
  decision: "sealed" | "C" | "D";
  delta: number | null;
}) {
  const isSealed = decision === "sealed";
  const isCooperate = decision === "C";

  return (
    <div className="flex flex-col items-center gap-3">
      <AgentAvatar name={agent} size={40} />
      <span className="text-sm font-medium">{agent}</span>
      <div className="relative">
        {isSealed ? (
          <div className="animate-pulse-card">
            <img
              src="/seald-card.png"
              alt="Sealed decision"
              className="w-24 h-32 rounded-lg object-cover border border-border"
            />
          </div>
        ) : (
          <div
            className={`w-24 h-32 rounded-lg flex items-center justify-center text-4xl font-bold border-2 transition-all duration-500 ${
              isCooperate
                ? "bg-cooperate/20 border-cooperate text-cooperate"
                : "bg-defect/20 border-defect text-defect"
            }`}
          >
            {decision}
          </div>
        )}
        {delta !== null && (
          <div
            className={`absolute -top-6 left-1/2 -translate-x-1/2 text-lg font-bold animate-float-up ${
              delta >= 0 ? "text-cooperate" : "text-defect"
            }`}
          >
            {delta >= 0 ? "+" : ""}
            {delta}
          </div>
        )}
      </div>
    </div>
  );
}
