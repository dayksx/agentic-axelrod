"use client";

import { useState } from "react";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { SEPOLIA_CHAIN_ID } from "@/lib/chains";

const AMOUNT_ETH = "0.001";

type FundState =
  | { status: "idle" }
  | { status: "sending" }
  | { status: "done"; txHash: string }
  | { status: "error"; message: string };

/**
 * Sends Sepolia ETH from the user's connected wallet to the player/agent EOA.
 * Switches the wallet to Sepolia (chain {11155111}) before sending.
 */
export function FundPlayerEthButton({ toAddress }: { toAddress: string }) {
  const { primaryWallet } = useDynamicContext();
  const [fund, setFund] = useState<FundState>({ status: "idle" });

  async function onFund() {
    if (!primaryWallet || !toAddress) return;
    setFund({ status: "sending" });
    try {
      await primaryWallet.switchNetwork(SEPOLIA_CHAIN_ID);
      const hash = await primaryWallet.sendBalance({
        amount: AMOUNT_ETH,
        toAddress: toAddress as `0x${string}`,
      });
      if (!hash) {
        setFund({ status: "error", message: "Transaction was cancelled or returned no hash." });
        return;
      }
      setFund({ status: "done", txHash: hash });
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      setFund({ status: "error", message });
    }
  }

  const disabled =
    !primaryWallet ||
    fund.status === "sending" ||
    !/^0x[a-fA-F0-9]{40}$/.test(toAddress);

  return (
    <div className="pt-2 border-t border-border space-y-2">
      <p className="text-xs font-medium text-foreground/90">Fund player wallet</p>
      <p className="text-[11px] text-muted leading-relaxed">
        Sends {AMOUNT_ETH} Sepolia ETH from your connected wallet to the player address.
        The app switches your wallet to Sepolia (chain {SEPOLIA_CHAIN_ID}) before the
        transaction.
      </p>
      <button
        type="button"
        disabled={disabled}
        onClick={onFund}
        className="rounded-md border border-border bg-surface px-3 py-2 text-xs font-medium text-foreground hover:bg-surface-2 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        {fund.status === "sending"
          ? "Confirm in wallet…"
          : `Send ${AMOUNT_ETH} Sepolia ETH to player`}
      </button>
      {!primaryWallet ? (
        <p className="text-[11px] text-muted">Connect a wallet with the widget above to send.</p>
      ) : null}
      {fund.status === "done" ? (
        <p className="text-[11px] text-cooperate break-all">
          Sent — tx:{" "}
          <code className="text-[10px]">{fund.txHash}</code>
        </p>
      ) : null}
      {fund.status === "error" ? (
        <p className="text-[11px] text-defect" role="alert">
          {fund.message}
        </p>
      ) : null}
    </div>
  );
}
