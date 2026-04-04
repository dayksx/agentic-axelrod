import type { AgentRow } from "@/types/models";

const RPC_URL = process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL;

async function getBalance(walletAddress: string): Promise<string> {
  if (!RPC_URL) return "RPC not configured";

  const res = await fetch(RPC_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      method: "eth_getBalance",
      params: [walletAddress, "latest"],
      id: 1,
    }),
  });

  if (!res.ok) return "unavailable";

  const json = await res.json();
  if (json.error) return "unavailable";

  const wei = BigInt(json.result);
  const eth = Number(wei) / 1e18;
  return eth.toFixed(4);
}

/**
 * Fetch ETH balances for all agents with a wallet_address.
 * Returns a Map of agentId → balance string (e.g. "0.0042") or error text.
 */
export async function fetchAgentBalances(
  agents: AgentRow[],
): Promise<Map<number, string>> {
  const balances = new Map<number, string>();

  const withWallets = agents.filter((a) => a.wallet_address != null);

  const results = await Promise.allSettled(
    withWallets.map(async (agent) => {
      const balance = await getBalance(agent.wallet_address!);
      return { id: agent.id, balance };
    }),
  );

  for (const result of results) {
    if (result.status === "fulfilled") {
      balances.set(result.value.id, result.value.balance);
    }
  }

  return balances;
}
