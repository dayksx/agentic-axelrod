"use client";

import { useEffect, useState, useRef } from "react";
import type { AgentAnnouncement } from "@/types/models";
import { AgentAvatar } from "./AgentAvatar";

export function AnnouncementBanner({
  announcements,
}: {
  announcements: AgentAnnouncement[];
}) {
  if (announcements.length === 0) {
    return (
      <div className="mx-auto max-w-lg mt-6 animate-slide-in">
        <div className="rounded-xl border border-border bg-surface-2/50 px-6 py-4 text-center">
          <span className="text-sm text-muted">No announcements this round</span>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl mt-2 mb-4 flex flex-col gap-3 animate-slide-in">
      <div className="flex items-center gap-2 px-1">
        <span className="text-accent text-lg">📢</span>
        <span className="text-xs font-semibold uppercase tracking-wider text-accent">
          Agent Announcements
        </span>
      </div>
      {announcements.map((a, i) => (
        <AnnouncementCard
          key={`${a.agentId}-${i}`}
          announcement={a}
          isLast={i === announcements.length - 1}
        />
      ))}
    </div>
  );
}

function AnnouncementCard({
  announcement,
  isLast,
}: {
  announcement: AgentAnnouncement;
  isLast: boolean;
}) {
  const [displayText, setDisplayText] = useState("");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const indexRef = useRef(0);

  useEffect(() => {
    if (!isLast) {
      setDisplayText(announcement.message);
      return;
    }

    setDisplayText("");
    indexRef.current = 0;

    intervalRef.current = setInterval(() => {
      indexRef.current++;
      if (indexRef.current >= announcement.message.length) {
        setDisplayText(announcement.message);
        if (intervalRef.current) clearInterval(intervalRef.current);
        return;
      }
      setDisplayText(announcement.message.slice(0, indexRef.current));
    }, 18);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [announcement.message, isLast]);

  return (
    <div className="rounded-xl border border-accent/20 bg-accent/5 px-5 py-3">
      <div className="flex items-center gap-2 mb-1.5">
        <AgentAvatar name={announcement.agentName} size={22} />
        <span className="text-xs font-semibold text-foreground/80">
          {announcement.agentName}
        </span>
      </div>
      <p className="text-sm leading-relaxed text-foreground/90 pl-[30px]">
        {displayText}
      </p>
    </div>
  );
}
