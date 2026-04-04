"use client";

import type {
  TournamentTransactionRow,
  AgentRow,
  LeaderboardEntry,
} from "@/types/models";
import { AgentAvatar } from "./AgentAvatar";

const ETHERSCAN_TX = "https://sepolia.etherscan.io/tx/";

function truncateHash(hash: string): string {
  return `${hash.slice(0, 6)}…${hash.slice(-4)}`;
}

function TxLink({ hash }: { hash: string }) {
  return (
    <a
      href={`${ETHERSCAN_TX}${hash}`}
      target="_blank"
      rel="noopener noreferrer"
      className="text-accent hover:underline font-mono text-xs"
    >
      {truncateHash(hash)} ↗
    </a>
  );
}

export function EntryTransactionPanel({
  transactions,
  agents,
}: {
  transactions: TournamentTransactionRow[];
  agents: AgentRow[];
}) {
  const entryTxs = transactions.filter((t) => t.type === "entry_fee");
  const collectionTxs = transactions.filter((t) => t.type === "collection");

  const agentsWithEntry = entryTxs
    .map((tx) => {
      const agent = agents.find((a) => a.id === tx.agent_id);
      if (!agent) return null;
      const collectionTx = collectionTxs.find(
        (c) => c.agent_id === tx.agent_id,
      );
      return { agent, entryTx: tx, collectionTx: collectionTx ?? null };
    })
    .filter(Boolean) as {
    agent: AgentRow;
    entryTx: TournamentTransactionRow;
    collectionTx: TournamentTransactionRow | null;
  }[];

  if (agentsWithEntry.length === 0) return null;

  return (
    <div className="mt-6 rounded-xl border border-border bg-surface p-5">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-muted mb-4">
        Tournament Transactions
      </h3>
      <div className="space-y-2">
        {agentsWithEntry.map(({ agent, entryTx, collectionTx }) => (
          <div
            key={agent.id}
            className="flex items-center gap-3 px-3 py-2 rounded-lg bg-surface-2"
          >
            <AgentAvatar name={agent.name} size={24} />
            <span className="w-40 text-sm font-medium truncate">
              {agent.name}
            </span>
            <div className="flex items-center gap-1 text-xs text-muted">
              <span>Entry tx</span>
              <TxLink hash={entryTx.tx_hash} />
            </div>
            <div className="flex items-center gap-1 text-xs text-muted ml-4">
              <span>Collection tx</span>
              {collectionTx ? (
                <TxLink hash={collectionTx.tx_hash} />
              ) : (
                <span className="text-muted">—</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function PrizeTransactionPanel({
  transactions,
  agents,
  leaderboard,
}: {
  transactions: TournamentTransactionRow[];
  agents: AgentRow[];
  leaderboard: LeaderboardEntry[];
}) {
  const prizeTxs = transactions.filter((t) => t.type === "prize");
  if (prizeTxs.length === 0) return null;

  const top3 = leaderboard.slice(0, 3);

  const rows = top3
    .map((entry) => {
      const agent = agents.find((a) => a.name === entry.agentName);
      if (!agent) return null;
      const prizeTx = prizeTxs.find((t) => t.agent_id === agent.id);
      if (!prizeTx) return null;
      return { agent, entry, prizeTx };
    })
    .filter(Boolean) as {
    agent: AgentRow;
    entry: LeaderboardEntry;
    prizeTx: TournamentTransactionRow;
  }[];

  if (rows.length === 0) return null;

  return (
    <div className="mt-6 rounded-xl border border-border bg-surface p-5">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-muted mb-4">
        Prize Transactions
      </h3>
      <div className="space-y-2">
        {rows.map(({ agent, entry, prizeTx }) => (
          <div
            key={agent.id}
            className="flex items-center gap-3 px-3 py-2 rounded-lg bg-surface-2"
          >
            <AgentAvatar name={agent.name} size={24} />
            <span className="w-40 text-sm font-medium truncate">
              {agent.name}
            </span>
            <span className="text-xs text-muted">
              ({ordinal(entry.rank)})
            </span>
            <div className="flex items-center gap-1 text-xs text-muted ml-auto">
              <span>Prize tx</span>
              <TxLink hash={prizeTx.tx_hash} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ordinal(n: number): string {
  if (n === 1) return "1st";
  if (n === 2) return "2nd";
  if (n === 3) return "3rd";
  return `${n}th`;
}
