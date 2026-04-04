"use client";

import type { DerivedArenaState, Phase } from "@/types/models";
import { ChatBubble } from "./ChatBubble";
import { DecisionCards } from "./DecisionCards";
import { AnnouncementBanner } from "./AnnouncementBanner";

export function ArenaDetail({
  arena,
  phase,
  announcement,
}: {
  arena: DerivedArenaState;
  phase: Phase;
  announcement: string | null;
}) {
  const showChat = true;
  const showDecisions =
    phase === "decision_sealed" ||
    phase === "decision_revealed" ||
    phase === "scoring" ||
    phase === "announcement";
  const showAnnouncement = phase === "announcement" && announcement;

  return (
    <div className="flex flex-col gap-4 p-6 max-w-2xl mx-auto">
      {/* Chat messages */}
      <div
        className={`flex flex-col gap-3 transition-opacity duration-300 ${
          showDecisions ? "opacity-40" : "opacity-100"
        }`}
      >
        {showChat &&
          arena.visibleMessages.map((msg, i) => {
            const isLeft = msg.speaker === arena.agentA;
            const isLatest = i === arena.visibleMessages.length - 1 && phase === "chat";
            return (
              <ChatBubble
                key={msg.id}
                speaker={msg.speaker}
                content={msg.content}
                isLeft={isLeft}
                isLatest={isLatest}
              />
            );
          })}
      </div>

      {/* Decision cards */}
      {showDecisions && (
        <DecisionCards
          agentA={arena.agentA}
          agentB={arena.agentB}
          decisionA={arena.decisionA}
          decisionB={arena.decisionB}
          deltaA={arena.deltaA}
          deltaB={arena.deltaB}
        />
      )}

      {/* Announcement */}
      {showAnnouncement && <AnnouncementBanner message={announcement} />}
    </div>
  );
}
