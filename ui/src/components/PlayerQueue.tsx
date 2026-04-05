"use client";

import { useEffect, useState } from "react";
import { fetchPlayerQueue } from "@/lib/queries";
import type { UserRow } from "@/types/models";

function truncateAddress(addr: string): string {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function timeAgo(dateStr: string): string {
  const seconds = Math.floor(
    (Date.now() - new Date(dateStr).getTime()) / 1000,
  );
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function PlayerQueue() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPlayerQueue()
      .then(setUsers)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load queue"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="rounded-lg border border-border bg-surface/40 p-6 animate-pulse">
        <div className="h-5 w-32 bg-muted/20 rounded mb-4" />
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-4 bg-muted/10 rounded w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-defect/30 bg-defect/5 p-4 text-sm text-defect">
        {error}
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-surface/40 p-6 space-y-4 animate-slide-in">
      <h3 className="text-lg font-semibold text-foreground/90">
        Player Queue
        <span className="ml-2 text-sm font-normal text-muted">
          ({users.length})
        </span>
      </h3>

      {users.length === 0 ? (
        <p className="text-sm text-muted">
          No players in the queue yet. You&apos;re the first!
        </p>
      ) : (
        <ul className="divide-y divide-border">
          {users.map((u) => (
            <li
              key={u.id}
              className="flex items-center justify-between py-2.5 text-sm"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="font-medium truncate">{u.agent_name}</span>
                <a
                  href={`https://sepolia.etherscan.io/address/${u.agent_wallet}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-xs text-accent hover:underline shrink-0"
                >
                  {truncateAddress(u.agent_wallet)} ↗
                </a>
              </div>
              <span className="text-xs text-muted shrink-0 ml-3">
                {timeAgo(u.created_at)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
