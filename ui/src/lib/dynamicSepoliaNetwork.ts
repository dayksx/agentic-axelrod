import type { GenericNetwork } from "@dynamic-labs/types";
import { SEPOLIA_CHAIN_ID } from "@/lib/chains";

/** Public RPC fallback when `NEXT_PUBLIC_SEPOLIA_RPC_URL` is unset */
const DEFAULT_SEPOLIA_RPC = "https://rpc.sepolia.org";
const SEPOLIA_EXPLORER = "https://sepolia.etherscan.io";

/**
 * Ensures Sepolia (11155111) is present in Dynamic's EVM network list so
 * `switchNetwork(11155111)` and WalletConnect preferred chains resolve.
 * Merges with dashboard networks instead of replacing them.
 */
export function mergeEvmNetworksWithSepolia(
  dashboardNetworks: GenericNetwork[],
  preferredRpcUrl?: string | null,
): GenericNetwork[] {
  const hasSepolia = dashboardNetworks.some(
    (n) => Number(n.chainId) === SEPOLIA_CHAIN_ID,
  );
  if (hasSepolia) {
    return dashboardNetworks;
  }

  const rpc =
    typeof preferredRpcUrl === "string" && preferredRpcUrl.trim() !== ""
      ? preferredRpcUrl.trim()
      : DEFAULT_SEPOLIA_RPC;

  const sepoliaNetwork: GenericNetwork = {
    key: `eip155:${SEPOLIA_CHAIN_ID}`,
    name: "Sepolia",
    vanityName: "Sepolia",
    chainId: SEPOLIA_CHAIN_ID,
    networkId: SEPOLIA_CHAIN_ID,
    isTestnet: true,
    rpcUrls: [rpc],
    blockExplorerUrls: [SEPOLIA_EXPLORER],
    nativeCurrency: {
      name: "Sepolia Ether",
      symbol: "ETH",
      decimals: 18,
    },
    iconUrls: [],
  };

  return [...dashboardNetworks, sepoliaNetwork];
}
