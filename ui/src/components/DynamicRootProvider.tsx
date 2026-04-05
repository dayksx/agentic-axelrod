"use client";

import { useMemo } from "react";
import type { GenericNetwork } from "@dynamic-labs/types";
import { DynamicContextProvider } from "@dynamic-labs/sdk-react-core";
import { EthereumWalletConnectors } from "@dynamic-labs/ethereum";
import { PreferWalletLoginTab } from "@/components/PreferWalletLoginTab";
import { SEPOLIA_EIP155 } from "@/lib/chains";
import { mergeEvmNetworksWithSepolia } from "@/lib/dynamicSepoliaNetwork";

const environmentId = process.env.NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID;

export function DynamicRootProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const mergeEvmNetworks = useMemo(
    () => (dashboard: GenericNetwork[]) =>
      mergeEvmNetworksWithSepolia(
        dashboard,
        process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL,
      ),
    [],
  );

  if (!environmentId) {
    return children;
  }

  return (
    <DynamicContextProvider
      settings={{
        environmentId,
        walletConnectors: [EthereumWalletConnectors],
        /** Prefer Sepolia for connect, signing, and funding in this app */
        walletConnectPreferredChains: [SEPOLIA_EIP155],
        /**
         * Register Sepolia in the SDK even if the Dynamic dashboard only lists
         * Ethereum mainnet — otherwise switchNetwork(11155111) throws
         * "Could not find network mapping for chain 11155111".
         */
        overrides: { evmNetworks: mergeEvmNetworks },
      }}
    >
      <PreferWalletLoginTab />
      {children}
    </DynamicContextProvider>
  );
}
