"use client";

import { useTimeStore } from "@/stores/timeStore";

const PHASE_LABELS: Record<string, string> = {
  chat: "Chat",
  decision_sealed: "Decision",
  decision_revealed: "Reveal",
  scoring: "Scoring",
  announcement: "Announcement",
};

export function PlaybackControls({ totalRounds }: { totalRounds: number }) {
  const { currentStep, totalSteps, isPlaying, derived, forward, back, play, pause } =
    useTimeStore();

  if (!derived) return null;

  const phaseLabel = PHASE_LABELS[derived.phase] ?? derived.phase;

  const chatInfo =
    derived.phase === "chat"
      ? ` \u2022 Message ${derived.chatStep + 1} of 6`
      : "";

  return (
    <div className="flex items-center justify-center gap-6 px-6 py-3 border-t border-border bg-surface shrink-0">
      <button
        onClick={back}
        disabled={currentStep === 0}
        className="px-3 py-1.5 rounded-md bg-surface-2 hover:bg-border disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-sm font-medium"
      >
        ◀ Back
      </button>

      <button
        onClick={isPlaying ? pause : play}
        className="px-4 py-1.5 rounded-md bg-accent text-white hover:bg-accent/80 transition-colors text-sm font-medium min-w-[80px]"
      >
        {isPlaying ? "⏸ Pause" : "▶ Play"}
      </button>

      <button
        onClick={forward}
        disabled={currentStep >= totalSteps - 1}
        className="px-3 py-1.5 rounded-md bg-surface-2 hover:bg-border disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-sm font-medium"
      >
        Forward ▶
      </button>

      <div className="text-sm text-muted font-mono tabular-nums">
        Round {derived.round} of {totalRounds}
        {" \u2022 "}
        {phaseLabel}
        {chatInfo}
        {" \u2022 "}
        Step {currentStep + 1}/{totalSteps}
      </div>
    </div>
  );
}
