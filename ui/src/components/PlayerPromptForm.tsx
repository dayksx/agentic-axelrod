"use client";

import { useState } from "react";
import { FundPlayerEthButton } from "@/components/FundPlayerEthButton";

const NAME_MAX = 100;
const PROMPT_MAX = 500;

type SubmitState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; detail: SuccessDetail }
  | { status: "error"; message: string };

type WalletAgentsResponse = {
  wallets?: Record<string, unknown>[];
  created?: boolean[];
  stateFilePath?: string;
  error?: string;
};

type RegisterPlayerResponse = {
  ok?: boolean;
  persisted?: boolean;
  message?: string;
  error?: string;
  player?: {
    name: string;
    prompt: string;
    walletAddress: string;
    ensName: string;
  };
  agent?: {
    id: number;
    name: string;
    strategy_prompt: string;
    wallet_address: string | null;
    ens_name: string | null;
    created_at: string;
  } | null;
};

type SuccessDetail = {
  registerMessage: string;
  persisted: boolean;
  playerName: string;
  prompt: string;
  walletService: {
    createdThisCall: boolean;
    stateFilePath?: string;
    walletJson: Record<string, unknown>;
  };
  register: RegisterPlayerResponse;
};

function RegistrationResult({ detail }: { detail: SuccessDetail }) {
  const { walletService, register, playerName, prompt, registerMessage, persisted } =
    detail;
  const addr =
    typeof walletService.walletJson.eoaAddress === "string"
      ? walletService.walletJson.eoaAddress
      : "";
  const ens =
    typeof walletService.walletJson.ensName === "string"
      ? walletService.walletJson.ensName
      : null;

  return (
    <div
      className="rounded-md border border-border bg-surface/40 p-3 space-y-3 text-sm"
      role="status"
    >
      <p className="font-medium text-foreground/90">Registration result</p>

      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-xs">
        <dt className="text-muted">Player</dt>
        <dd className="font-mono">{playerName}</dd>
        <dt className="text-muted">Wallet</dt>
        <dd>
          {walletService.createdThisCall ? (
            <span className="text-cooperate">Created</span>
          ) : (
            <span className="text-foreground/80">Loaded (already existed)</span>
          )}
        </dd>
        {addr ? (
          <>
            <dt className="text-muted">EOA</dt>
            <dd className="font-mono text-[11px] break-all">{addr}</dd>
          </>
        ) : null}
        {ens ? (
          <>
            <dt className="text-muted">ENS</dt>
            <dd className="font-mono text-xs break-all">{ens}</dd>
          </>
        ) : null}
        {walletService.stateFilePath ? (
          <>
            <dt className="text-muted">State file</dt>
            <dd className="font-mono text-[11px] break-all">
              {walletService.stateFilePath}
            </dd>
          </>
        ) : null}
        <dt className="text-muted">Prompt</dt>
        <dd className="text-foreground/85 whitespace-pre-wrap break-words">
          {prompt}
        </dd>
        <dt className="text-muted">Database</dt>
        <dd>
          {persisted ? (
            <span className="text-cooperate">Saved</span>
          ) : (
            <span className="text-foreground/70">Not persisted — {registerMessage}</span>
          )}
        </dd>
      </dl>

      {register.agent ? (
        <div className="pt-1 border-t border-border space-y-1">
          <p className="text-xs font-medium text-foreground/90">Agent row</p>
          <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
            <dt className="text-muted">id</dt>
            <dd className="font-mono">{register.agent.id}</dd>
            <dt className="text-muted">created_at</dt>
            <dd className="font-mono text-[11px]">{register.agent.created_at}</dd>
          </dl>
        </div>
      ) : null}

      {addr ? <FundPlayerEthButton toAddress={addr} /> : null}

      <details className="text-xs">
        <summary className="cursor-pointer text-muted hover:text-foreground/80">
          Raw API responses
        </summary>
        <div className="mt-2 space-y-2">
          <p className="text-muted">Wallet service (POST /agents)</p>
          <pre className="max-h-48 overflow-auto rounded bg-background/80 p-2 text-[10px] leading-relaxed border border-border">
            {JSON.stringify(
              {
                wallets: [walletService.walletJson],
                created: [walletService.createdThisCall],
                stateFilePath: walletService.stateFilePath,
              },
              null,
              2,
            )}
          </pre>
          <p className="text-muted">Register player (POST /api/register-player)</p>
          <pre className="max-h-48 overflow-auto rounded bg-background/80 p-2 text-[10px] leading-relaxed border border-border">
            {JSON.stringify(register, null, 2)}
          </pre>
        </div>
      </details>
    </div>
  );
}

export function PlayerPromptForm() {
  const [name, setName] = useState("");
  const [prompt, setPrompt] = useState("");
  const [submit, setSubmit] = useState<SubmitState>({ status: "idle" });

  const nameTrim = name.trim();
  const promptTrim = prompt.trim();
  const canSubmit =
    nameTrim.length > 0 &&
    nameTrim.length <= NAME_MAX &&
    promptTrim.length > 0 &&
    promptTrim.length <= PROMPT_MAX &&
    submit.status !== "loading";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    setSubmit({ status: "loading" });
    try {
      const walletRes = await fetch("/api/wallet/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ names: [nameTrim] }),
      });

      const walletData = (await walletRes.json()) as WalletAgentsResponse & {
        error?: string;
      };

      if (!walletRes.ok) {
        setSubmit({
          status: "error",
          message:
            walletData.error ??
            `Wallet service failed (${walletRes.status}). Is the wallet server running?`,
        });
        return;
      }

      const agentAddress = walletData.wallets?.[0]?.eoaAddress;
      if (!agentAddress) {
        setSubmit({
          status: "error",
          message: "Wallet service returned no eoaAddress for this player.",
        });
        return;
      }

      const ensName = walletData.wallets?.[0]?.ensName;

      const res = await fetch("/api/register-player", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: nameTrim,
          prompt: promptTrim,
          walletAddress: agentAddress,
          ...(ensName ? { ensName } : {}),
        }),
      });

      const data = (await res.json()) as RegisterPlayerResponse;

      if (!res.ok) {
        setSubmit({
          status: "error",
          message: data.error ?? `Registration failed (${res.status})`,
        });
        return;
      }

      const w0 = walletData.wallets?.[0];
      const walletJson =
        w0 !== undefined && typeof w0 === "object" && w0 !== null
          ? (w0 as Record<string, unknown>)
          : {};

      setSubmit({
        status: "success",
        detail: {
          registerMessage: data.message ?? "",
          persisted: Boolean(data.persisted),
          playerName: nameTrim,
          prompt: promptTrim,
          walletService: {
            createdThisCall: walletData.created?.[0] === true,
            stateFilePath: walletData.stateFilePath,
            walletJson,
          },
          register: data,
        },
      });
      setName("");
      setPrompt("");
    } catch (err) {
      setSubmit({
        status: "error",
        message: err instanceof Error ? err.message : "Something went wrong",
      });
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-lg border border-border bg-background/50 p-4 space-y-4"
    >
      <h2 className="text-lg font-semibold">Register player</h2>
      <p className="text-foreground/60 text-xs">
        All of this targets{" "}
        <span className="text-foreground/80">Ethereum Sepolia</span> (chain 11155111):
        the wallet service creates Sepolia EOAs; Dynamic is configured to prefer Sepolia;
        funding sends Sepolia ETH.
      </p>

      <div className="space-y-1.5">
        <label htmlFor="player-name" className="text-sm font-medium text-foreground/90">
          Player name
        </label>
        <input
          id="player-name"
          name="name"
          type="text"
          autoComplete="off"
          maxLength={NAME_MAX}
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent/40"
          placeholder="e.g. cooperative-bot"
        />
        <p className="text-xs text-muted text-right">
          {nameTrim.length}/{NAME_MAX}
        </p>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="player-prompt" className="text-sm font-medium text-foreground/90">
          Strategy prompt
        </label>
        <textarea
          id="player-prompt"
          name="prompt"
          rows={4}
          maxLength={PROMPT_MAX}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="w-full resize-y min-h-[100px] rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent/40"
          placeholder="How should this agent behave in the tournament?"
        />
        <p className="text-xs text-muted text-right">
          {promptTrim.length}/{PROMPT_MAX}
        </p>
      </div>

      <button
        type="submit"
        disabled={!canSubmit}
        className="w-full rounded-md bg-accent text-background py-2.5 text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
      >
        {submit.status === "loading" ? "Creating…" : "Create"}
      </button>

      {submit.status === "success" && (
        <RegistrationResult detail={submit.detail} />
      )}
      {submit.status === "error" && (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          {submit.message}
        </p>
      )}
    </form>
  );
}
