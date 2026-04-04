"use client";

import { useEffect, useState, useRef } from "react";
import { AgentAvatar } from "./AgentAvatar";

export function ChatBubble({
  speaker,
  content,
  isLeft,
  isLatest,
}: {
  speaker: string;
  content: string;
  isLeft: boolean;
  isLatest: boolean;
}) {
  const [displayText, setDisplayText] = useState(isLatest ? "" : content);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const indexRef = useRef(0);

  useEffect(() => {
    if (!isLatest) {
      setDisplayText(content);
      return;
    }

    setDisplayText("");
    indexRef.current = 0;

    intervalRef.current = setInterval(() => {
      indexRef.current++;
      if (indexRef.current >= content.length) {
        setDisplayText(content);
        if (intervalRef.current) clearInterval(intervalRef.current);
        return;
      }
      setDisplayText(content.slice(0, indexRef.current));
    }, 15);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [content, isLatest]);

  return (
    <div
      className={`flex gap-3 animate-slide-in ${isLeft ? "flex-row" : "flex-row-reverse"}`}
    >
      <AgentAvatar name={speaker} size={32} />
      <div className="max-w-[70%]">
        <div className={`text-xs text-muted mb-1 ${isLeft ? "text-left" : "text-right"}`}>
          {speaker}
        </div>
        <div
          className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
            isLeft
              ? "bg-surface-2 rounded-tl-sm"
              : "bg-accent-dim rounded-tr-sm"
          }`}
        >
          {displayText}
          {isLatest && displayText.length < content.length && (
            <span className="inline-block w-0.5 h-4 bg-foreground ml-0.5 align-text-bottom"
              style={{ animation: "typewriter-cursor 0.6s infinite" }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
