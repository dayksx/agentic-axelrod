"use client";

import Link from "next/link";
import { DynamicWidget, useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { PlayerPromptForm } from "@/components/PlayerPromptForm";
import { SEPOLIA_CHAIN_ID } from "@/lib/chains";

function WalletAndForm() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-6">
        <DynamicWidget />
        <ConnectedSummary />
      </div>
      <PlayerPromptForm />
    </div>
  );
}

function ConnectedSummary() {
  const { primaryWallet, user, handleLogOut } = useDynamicContext();

  if (!primaryWallet) {
    return (
      <p className="text-foreground/70 text-sm">
        Connect a wallet with the widget above to see address and chain here.
      </p>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-background/50 p-4 text-sm space-y-2">
      <p>
        <span className="text-muted">Address:</span>{" "}
        <code className="text-xs break-all">{primaryWallet.address}</code>
      </p>
      <p>
        <span className="text-muted">Network:</span>{" "}
        {Number(primaryWallet.chain) === SEPOLIA_CHAIN_ID ? (
          <span className="text-cooperate">Sepolia</span>
        ) : (
          <span className="text-foreground/90">Ethereum / other</span>
        )}
        <span className="text-muted text-xs ml-2">
          (chain id {String(primaryWallet.chain)})
        </span>
        {Number(primaryWallet.chain) !== SEPOLIA_CHAIN_ID ? (
          <span className="block mt-1 text-amber-500 text-xs">
            Switch to Sepolia ({SEPOLIA_CHAIN_ID}) for this demo — use your wallet&apos;s
            network picker or the fund button (it requests a switch).
          </span>
        ) : null}
      </p>
      {user?.email ? (
        <p>
          <span className="text-muted">Email:</span> {user.email}
        </p>
      ) : null}
      <button
        type="button"
        onClick={() => handleLogOut()}
        className="mt-2 text-accent underline text-sm hover:no-underline"
      >
        Disconnect
      </button>
    </div>
  );
}

export default function WalletTestPage() {
  const envId = process.env.NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID;

  if (!envId) {
    return (
      <div className="mx-auto max-w-lg px-6 py-16 space-y-4">
        <h1 className="text-2xl font-semibold">Wallet test</h1>
        <p className="text-foreground/70">
          Set{" "}
          <code className="text-xs bg-muted/30 px-1 rounded">
            NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID
          </code>{" "}
          in <code className="text-xs">ui/.env</code> (from the Dynamic dashboard),
          then restart the dev server.
        </p>
        <Link href="/" className="text-accent underline hover:no-underline">
          ← Back to home
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-6 py-16 space-y-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">Wallet test (Dynamic)</h1>
        <p className="text-foreground/70 text-sm">
          This flow uses <strong className="text-foreground/90">Sepolia</strong>{" "}
          (chain {SEPOLIA_CHAIN_ID}). Enable Sepolia in the Dynamic dashboard under
          Chains &amp; Networks. Use the widget to connect MetaMask or another EVM
          wallet. Allowlist this origin in the Dynamic dashboard under Security →
          Allowed Origins. If you still see an email step, open{" "}
          <span className="text-foreground/90">Log in &amp; User Profile</span> in
          the Dynamic dashboard and turn off{" "}
          <span className="text-foreground/90">Email</span> under sign-in methods,
          and remove any required email field under Additional User Information.
        </p>
        <Link href="/" className="text-accent underline text-sm hover:no-underline">
          ← Back to home
        </Link>
      </div>

      <WalletAndForm />
    </div>
  );
}
