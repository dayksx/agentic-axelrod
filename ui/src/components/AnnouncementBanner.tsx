"use client";

import { useEffect, useState, useRef } from "react";

export function AnnouncementBanner({ message }: { message: string }) {
  const [displayText, setDisplayText] = useState("");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const indexRef = useRef(0);

  useEffect(() => {
    setDisplayText("");
    indexRef.current = 0;

    intervalRef.current = setInterval(() => {
      indexRef.current++;
      if (indexRef.current >= message.length) {
        setDisplayText(message);
        if (intervalRef.current) clearInterval(intervalRef.current);
        return;
      }
      setDisplayText(message.slice(0, indexRef.current));
    }, 20);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [message]);

  return (
    <div className="mx-auto max-w-lg mt-6 animate-slide-in">
      <div className="rounded-xl border border-accent/30 bg-accent/5 px-6 py-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-accent text-lg">📡</span>
          <span className="text-xs font-semibold uppercase tracking-wider text-accent">
            Game Master Announcement
          </span>
        </div>
        <p className="text-sm leading-relaxed text-foreground/90">
          {displayText}
        </p>
      </div>
    </div>
  );
}
