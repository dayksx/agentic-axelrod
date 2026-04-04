import type { PlayerConfig } from "../domain/model/types.js";

function normalizeBaseUrl(u: string): string {
  return u.replace(/\/$/, "");
}

/**
 * Per player: {@link PlayerConfig.url} wins if set; else `AGENT_SLOT_${index+1}_URL`.
 * Lets you pin winners to fixed servers across tournaments while new slots can use env only.
 */
export function resolveAgentBaseUrls(players: readonly PlayerConfig[]): string[] {
  return players.map((p, i) => {
    const fromPlayer = p.url?.trim();
    if (fromPlayer) return normalizeBaseUrl(fromPlayer);
    const fromEnv = process.env[`AGENT_SLOT_${i + 1}_URL`]?.trim();
    if (fromEnv) return normalizeBaseUrl(fromEnv);
    throw new Error(
      `Player "${p.name}" (index ${i}): set PlayerConfig.url or AGENT_SLOT_${i + 1}_URL`,
    );
  });
}
