"use client";

import { useState, useEffect, useCallback } from "react";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { SEPOLIA_CHAIN_ID } from "@/lib/chains";
import { PlayerQueue } from "@/components/PlayerQueue";

const NAME_MAX = 15;
const PROMPT_MAX = 500;
const NAME_RE = /^[a-zA-Z0-9]*$/;
const ENTRY_FEE = "0.001";
const ENTRY_FEE_NUM = 0.001;

type FlowStep =
  | "form"
  | "create-wallet"
  | "submit"
  | "success";

type WalletApiResponse = {
  wallets?: Array<{ eoaAddress?: string; ensName?: string }>;
  created?: boolean[];
  stateFilePath?: string;
  error?: string;
};

type JoinApiResponse = {
  ok?: boolean;
  user?: {
    id: number;
    agent_name: string;
    agent_wallet: string;
    tx_hash: string;
    created_at: string;
  };
  error?: string;
};

async function fetchBalance(address: string): Promise<string | null> {
  const rpc = process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL;
  if (!rpc) return null;
  try {
    const res = await fetch(rpc, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "eth_getBalance",
        params: [address, "latest"],
        id: 1,
      }),
    });
    if (!res.ok) return null;
    const json = await res.json();
    if (json.error) return null;
    const wei = BigInt(json.result);
    return (Number(wei) / 1e18).toFixed(4);
  } catch {
    return null;
  }
}

function truncateAddress(addr: string): string {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function truncateHash(hash: string): string {
  return `${hash.slice(0, 10)}...${hash.slice(-6)}`;
}

export function JoinTournamentForm() {
  const { primaryWallet, setShowAuthFlow, handleLogOut } = useDynamicContext();

  const [agentName, setAgentName] = useState("");
  const [strategyPrompt, setStrategyPrompt] = useState("");

  const [step, setStep] = useState<FlowStep>("form");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [humanBalance, setHumanBalance] = useState<string | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [agentWallet, setAgentWallet] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [successUser, setSuccessUser] = useState<JoinApiResponse["user"] | null>(null);

  const nameTrimmed = agentName.trim();
  const promptTrimmed = strategyPrompt.trim();
  const nameValid =
    nameTrimmed.length > 0 &&
    nameTrimmed.length <= NAME_MAX &&
    NAME_RE.test(nameTrimmed);
  const promptValid = promptTrimmed.length > 0 && promptTrimmed.length <= PROMPT_MAX;
  const formValid = nameValid && promptValid;

  const hasEnoughBalance =
    humanBalance !== null && parseFloat(humanBalance) >= ENTRY_FEE_NUM;

  const loadBalance = useCallback(async (address: string) => {
    setBalanceLoading(true);
    const bal = await fetchBalance(address);
    setHumanBalance(bal);
    setBalanceLoading(false);
  }, []);

  useEffect(() => {
    if (primaryWallet && step === "form") {
      setStep("create-wallet");
      loadBalance(primaryWallet.address);
    }
    if (!primaryWallet && step !== "form" && step !== "success") {
      setStep("form");
      setHumanBalance(null);
      setAgentWallet(null);
      setError(null);
    }
  }, [primaryWallet, step, loadBalance]);

  function handleDisconnect() {
    handleLogOut();
    setStep("form");
    setHumanBalance(null);
    setAgentWallet(null);
    setError(null);
  }

  function handleNameChange(value: string) {
    const cleaned = value.replace(/[^a-zA-Z0-9]/g, "");
    if (cleaned.length <= NAME_MAX) {
      setAgentName(cleaned);
    }
  }

  function handlePromptChange(value: string) {
    if (value.length <= PROMPT_MAX) {
      setStrategyPrompt(value);
    }
  }

  async function handleConnectWallet() {
    setError(null);
    setShowAuthFlow?.(true);
  }

  async function handleCreateAgentWallet() {
    if (!primaryWallet) return;
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/wallet/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ names: [nameTrimmed] }),
      });

      const data = (await res.json()) as WalletApiResponse;

      if (!res.ok) {
        setError(
          data.error ??
            `Wallet service failed (${res.status}). Is the wallet server running?`,
        );
        setLoading(false);
        return;
      }

      const eoaAddress = data.wallets?.[0]?.eoaAddress;
      if (!eoaAddress || typeof eoaAddress !== "string") {
        setError("Wallet service returned no eoaAddress.");
        setLoading(false);
        return;
      }

      setAgentWallet(eoaAddress);
      setStep("submit");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create agent wallet");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmitAndPay() {
    if (!primaryWallet || !agentWallet) return;
    setError(null);
    setLoading(true);

    let hash: string | undefined;
    try {
      await primaryWallet.switchNetwork(SEPOLIA_CHAIN_ID);
      hash = await primaryWallet.sendBalance({
        amount: ENTRY_FEE,
        toAddress: agentWallet as `0x${string}`,
      });

      if (!hash) {
        setError("Transaction was cancelled or returned no hash.");
        setLoading(false);
        return;
      }

      setTxHash(hash);
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      setError(message);
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/join-tournament", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentName: nameTrimmed,
          strategyPrompt: promptTrimmed,
          humanWallet: primaryWallet.address,
          agentWallet,
          txHash: hash,
        }),
      });

      const data = (await res.json()) as JoinApiResponse;

      if (!res.ok) {
        setError(
          `Payment sent (tx: ${hash}) but registration failed: ${data.error ?? "Unknown error"}. Save your tx hash.`,
        );
        setLoading(false);
        return;
      }

      setSuccessUser(data.user ?? null);
      setStep("success");
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      setError(
        `Payment sent (tx: ${hash}) but registration failed: ${message}. Save your tx hash.`,
      );
    } finally {
      setLoading(false);
    }
  }

  if (step === "success") {
    return (
      <div className="space-y-5">
        <div className="rounded-lg border border-cooperate/30 bg-cooperate/5 p-6 space-y-4 animate-slide-in">
          <div className="flex items-center gap-2">
            <span className="text-cooperate text-xl">✓</span>
            <h3 className="text-lg font-semibold text-cooperate">
              Agent registered!
            </h3>
          </div>

          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
            <dt className="text-muted">Agent Name</dt>
            <dd className="font-mono">{successUser?.agent_name ?? nameTrimmed}</dd>

            <dt className="text-muted">Strategy</dt>
            <dd className="text-foreground/85 wrap-break-word">
              {promptTrimmed.length > 80
                ? `${promptTrimmed.slice(0, 80)}…`
                : promptTrimmed}
            </dd>

            {agentWallet && (
              <>
                <dt className="text-muted">Agent Wallet</dt>
                <dd>
                  <a
                    href={`https://sepolia.etherscan.io/address/${agentWallet}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-accent hover:underline text-xs"
                  >
                    {truncateAddress(agentWallet)} ↗
                  </a>
                </dd>
              </>
            )}

            {txHash && (
              <>
                <dt className="text-muted">Entry Fee tx</dt>
                <dd>
                  <a
                    href={`https://sepolia.etherscan.io/tx/${txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-accent hover:underline text-xs"
                  >
                    {truncateHash(txHash)} ↗
                  </a>
                </dd>
              </>
            )}
          </dl>
        </div>

        <PlayerQueue />
      </div>
    );
  }

  const nameLocked = step !== "form";

  let buttonLabel: string;
  let buttonColor: string;
  let buttonDisabled: boolean;
  let buttonOnClick: () => void;

  if (!primaryWallet && step === "form") {
    buttonLabel = loading ? "Connecting…" : "Connect Wallet";
    buttonColor = "bg-accent";
    buttonDisabled = !formValid || loading;
    buttonOnClick = handleConnectWallet;
  } else if (step === "create-wallet") {
    if (loading) {
      buttonLabel = "Creating…";
    } else if (balanceLoading) {
      buttonLabel = "Checking balance…";
    } else if (!hasEnoughBalance) {
      buttonLabel = "Create Agent Wallet";
    } else {
      buttonLabel = "Create Agent Wallet";
    }
    buttonColor = "bg-accent";
    buttonDisabled = loading || balanceLoading || !hasEnoughBalance;
    buttonOnClick = handleCreateAgentWallet;
  } else {
    buttonLabel = loading ? "Confirm in wallet…" : "Submit and Pay";
    buttonColor = "bg-cooperate";
    buttonDisabled = loading;
    buttonOnClick = handleSubmitAndPay;
  }

  return (
    <div className="rounded-lg border border-border bg-surface/40 p-6 space-y-5">
      <div className="space-y-1.5">
        <label
          htmlFor="join-agent-name"
          className="text-sm font-medium text-foreground/90"
        >
          Agent Name
        </label>
        <input
          id="join-agent-name"
          type="text"
          autoComplete="off"
          maxLength={NAME_MAX}
          value={agentName}
          onChange={(e) => handleNameChange(e.target.value)}
          disabled={nameLocked || loading}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent/40 disabled:opacity-50 disabled:cursor-not-allowed"
          placeholder="e.g. CooperateBot"
        />
        <p className="text-xs text-muted text-right">
          {nameTrimmed.length}/{NAME_MAX}
          {nameTrimmed.length > 0 && !NAME_RE.test(nameTrimmed) && (
            <span className="text-defect ml-2">Alphanumeric only</span>
          )}
        </p>
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="join-strategy-prompt"
          className="text-sm font-medium text-foreground/90"
        >
          Strategy Prompt
        </label>
        <textarea
          id="join-strategy-prompt"
          rows={4}
          maxLength={PROMPT_MAX}
          value={strategyPrompt}
          onChange={(e) => handlePromptChange(e.target.value)}
          disabled={loading}
          className="w-full resize-y min-h-[100px] rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent/40 disabled:opacity-50 disabled:cursor-not-allowed"
          placeholder="How should this agent behave in the tournament?"
        />
        <p className="text-xs text-muted text-right">
          {promptTrimmed.length}/{PROMPT_MAX}
        </p>
      </div>

      <p className="text-sm text-muted">
        Entry fee is <span className="text-foreground">{ENTRY_FEE} Sepolia ETH</span>
      </p>

      {primaryWallet && step !== "form" && (
        <div className="rounded-md border border-border bg-background/50 px-4 py-3 text-sm space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-muted text-xs">Connected wallet</span>
              <p className="font-mono text-xs">
                {truncateAddress(primaryWallet.address)}
              </p>
            </div>
            <button
              type="button"
              onClick={handleDisconnect}
              disabled={loading}
              className="text-xs text-accent underline hover:no-underline disabled:opacity-40"
            >
              Disconnect
            </button>
          </div>

          {balanceLoading && (
            <p className="text-xs text-muted">Checking your Sepolia balance…</p>
          )}
          {!balanceLoading && humanBalance !== null && (
            <p className="text-xs">
              Sepolia balance:{" "}
              <span
                className={hasEnoughBalance ? "text-cooperate" : "text-defect"}
              >
                {humanBalance} ETH
              </span>
            </p>
          )}
          {!balanceLoading && !hasEnoughBalance && humanBalance !== null && (
            <p className="text-xs text-defect">
              Insufficient balance. You need at least {ENTRY_FEE} Sepolia ETH.
              Get testnet ETH from a{" "}
              <a
                href="https://www.alchemy.com/faucets/ethereum-sepolia"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:no-underline"
              >
                Sepolia faucet
              </a>
              .
            </p>
          )}
        </div>
      )}

      <button
        type="button"
        disabled={buttonDisabled}
        onClick={buttonOnClick}
        className={`w-full rounded-md ${buttonColor} text-background py-2.5 text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity`}
      >
        {buttonLabel}
      </button>

      {error && (
        <p className="text-sm text-defect wrap-break-word" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
