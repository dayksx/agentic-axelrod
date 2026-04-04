"use client";

import type { AgentRow, TournamentTransactionRow } from "@/types/models";
import { AgentAvatar } from "./AgentAvatar";

const ETHERSCAN_TX = "https://sepolia.etherscan.io/tx/";
const ETHERSCAN_ADDR = "https://sepolia.etherscan.io/address/";
const ENS_APP = "https://app.ens.domains/";

function truncateHash(hash: string): string {
  return `${hash.slice(0, 6)}…${hash.slice(-4)}`;
}

function truncateAddress(addr: string): string {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

function TxRow({
  label,
  tx,
}: {
  label: string;
  tx: TournamentTransactionRow | undefined;
}) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-sm text-muted">{label}</span>
      {tx ? (
        <a
          href={`${ETHERSCAN_TX}${tx.tx_hash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent hover:underline font-mono text-sm"
        >
          {truncateHash(tx.tx_hash)} ↗
        </a>
      ) : (
        <span className="text-muted text-sm">—</span>
      )}
    </div>
  );
}

export function AgentModal({
  agent,
  transactions,
  balance,
  onClose,
}: {
  agent: AgentRow;
  transactions: TournamentTransactionRow[];
  balance: string | null;
  onClose: () => void;
}) {
  const agentTxs = transactions.filter((t) => t.agent_id === agent.id);
  const entryTx = agentTxs.find((t) => t.type === "entry_fee");
  const collectionTx = agentTxs.find((t) => t.type === "collection");
  const prizeTx = agentTxs.find((t) => t.type === "prize");

  const hasWallet = agent.wallet_address != null;
  const hasEns = agent.ens_name != null;

  let balanceDisplay: string;
  if (!hasWallet) {
    balanceDisplay = "No wallet";
  } else if (balance === null) {
    balanceDisplay = "Loading…";
  } else if (balance === "unavailable" || balance === "RPC not configured") {
    balanceDisplay = balance === "RPC not configured" ? "RPC not configured" : "Balance unavailable";
  } else {
    balanceDisplay = `${balance} ETH`;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted hover:text-foreground transition-colors text-lg"
        >
          ✕
        </button>

        {/* Header */}
        <div className="flex flex-col items-center gap-3 mb-6">
          <AgentAvatar name={agent.name} size={64} />
          <h2 className="text-xl font-bold">{agent.name}</h2>
        </div>

        {/* Info rows */}
        <div className="space-y-3 mb-6">
          {/* ENS */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted">ENS</span>
            {hasEns ? (
              <a
                href={`${ENS_APP}${agent.ens_name}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent hover:underline text-sm"
              >
                {agent.ens_name} ↗
              </a>
            ) : (
              <span className="text-muted text-sm">No ENS</span>
            )}
          </div>

          {/* Balance */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted">Balance</span>
            <span className="text-sm font-mono">{balanceDisplay}</span>
          </div>

          {/* Address */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted">Address</span>
            {hasWallet ? (
              <a
                href={`${ETHERSCAN_ADDR}${agent.wallet_address}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent hover:underline font-mono text-sm"
              >
                {truncateAddress(agent.wallet_address!)} ↗
              </a>
            ) : (
              <span className="text-muted text-sm">No wallet</span>
            )}
          </div>
        </div>

        {/* Transactions */}
        <div className="border-t border-border pt-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted mb-3">
            Transactions
          </h3>
          <TxRow label="Entry tx" tx={entryTx} />
          <TxRow label="Collection tx" tx={collectionTx} />
          <TxRow label="Prize tx" tx={prizeTx} />
        </div>
      </div>
    </div>
  );
}
