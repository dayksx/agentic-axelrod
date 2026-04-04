/**
 * Sequential smoke test for all 9 Supabase write functions.
 * Run: pnpm --filter game tsx src/adapter/db/test-writes.ts
 */
import { config as loadEnv } from "dotenv";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const gameRoot = join(dirname(fileURLToPath(import.meta.url)), "../../..");
loadEnv({ path: join(gameRoot, ".env") });

import {
  createAgents,
  createTournament,
  enrollAgents,
  createAllMatches,
  recordTransaction,
  storeAnnouncement,
  storeChatMessage,
  recordDecisions,
  updateScores,
  completeTournament,
} from "./supabase-writes.js";

function log(step: number, label: string, data?: unknown) {
  console.log(`\n✅ [${step}/10] ${label}`);
  if (data !== undefined) console.log(JSON.stringify(data, null, 2));
}

function fail(step: number, label: string, err: unknown) {
  console.error(`\n❌ [${step}/10] ${label} FAILED`);
  console.error(err);
  process.exit(1);
}

async function main() {
  console.log("=== Supabase write functions — smoke test ===\n");

  // ---------------------------------------------------------------
  // 1. createAgents
  // ---------------------------------------------------------------
  let agents: { id: number; name: string }[];
  try {
    agents = await createAgents([
      { name: "TestAgent_A", strategy_prompt: "Always cooperate", url: "http://localhost:9001" },
      { name: "TestAgent_B", strategy_prompt: "Always defect", url: "http://localhost:9002" },
      { name: "TestAgent_C", strategy_prompt: "Tit for tat", url: "http://localhost:9003" },
      { name: "TestAgent_D", strategy_prompt: "Random", url: "http://localhost:9004" },
      { name: "TestAgent_E", strategy_prompt: "Grudger", url: "http://localhost:9005" },
      { name: "TestAgent_F", strategy_prompt: "Pavlov", url: "http://localhost:9006" },
    ]);
    log(1, "createAgents", agents);
  } catch (e) { fail(1, "createAgents", e); return; }

  const agentMap = new Map(agents.map((a) => [a.name, a.id]));

  // ---------------------------------------------------------------
  // 2. createTournament
  // ---------------------------------------------------------------
  let tournamentId: number;
  try {
    tournamentId = await createTournament({ total_rounds: 2, total_agents: 6 });
    log(2, `createTournament → id=${tournamentId}`, { tournamentId });
  } catch (e) { fail(2, "createTournament", e); return; }

  // ---------------------------------------------------------------
  // 3. enrollAgents
  // ---------------------------------------------------------------
  try {
    await enrollAgents(
      tournamentId,
      agents.map((a) => ({ agent_id: a.id, url: `http://localhost:900${a.id}` })),
    );
    log(3, "enrollAgents");
  } catch (e) { fail(3, "enrollAgents", e); return; }

  // ---------------------------------------------------------------
  // 4. createAllMatches (2 rounds × 3 arenas = 6 matches)
  // ---------------------------------------------------------------
  let matches: { id: number; round_number: number; arena_id: number; agent_a: string; agent_b: string }[];
  try {
    matches = await createAllMatches(tournamentId, [
      { round_number: 1, arena_id: 1, agent_a: "TestAgent_A", agent_b: "TestAgent_F", first_speaker: "TestAgent_A" },
      { round_number: 1, arena_id: 2, agent_a: "TestAgent_B", agent_b: "TestAgent_E", first_speaker: "TestAgent_B" },
      { round_number: 1, arena_id: 3, agent_a: "TestAgent_C", agent_b: "TestAgent_D", first_speaker: "TestAgent_C" },
      { round_number: 2, arena_id: 1, agent_a: "TestAgent_A", agent_b: "TestAgent_E", first_speaker: "TestAgent_E" },
      { round_number: 2, arena_id: 2, agent_a: "TestAgent_F", agent_b: "TestAgent_D", first_speaker: "TestAgent_D" },
      { round_number: 2, arena_id: 3, agent_a: "TestAgent_B", agent_b: "TestAgent_C", first_speaker: "TestAgent_C" },
    ]);
    log(4, "createAllMatches", matches);
  } catch (e) { fail(4, "createAllMatches", e); return; }

  // ---------------------------------------------------------------
  // 5. recordTransaction (entry fees × 6)
  // ---------------------------------------------------------------
  try {
    for (const a of agents) {
      await recordTransaction(tournamentId, a.id, "entry_fee", `0x_test_entry_fee_${a.name}`);
    }
    log(5, "recordTransaction (6 entry_fee)");
  } catch (e) { fail(5, "recordTransaction (entry_fee)", e); return; }

  // ---------------------------------------------------------------
  // 6. storeAnnouncement (round 1, 6 agents)
  // ---------------------------------------------------------------
  try {
    for (const a of agents) {
      await storeAnnouncement(tournamentId, 1, a.id, `Round 1 announcement from ${a.name}`);
    }
    log(6, "storeAnnouncement (6 for round 1)");
  } catch (e) { fail(6, "storeAnnouncement", e); return; }

  // ---------------------------------------------------------------
  // 7. storeChatMessage (6 messages for match 0)
  // ---------------------------------------------------------------
  const firstMatch = matches[0]!;
  try {
    const speakers = [firstMatch.agent_a, firstMatch.agent_b];
    for (let turn = 0; turn < 6; turn++) {
      await storeChatMessage(firstMatch.id, turn, speakers[turn % 2]!, `Test message turn ${turn}`);
    }
    log(7, `storeChatMessage (6 msgs for match ${firstMatch.id})`);
  } catch (e) { fail(7, "storeChatMessage", e); return; }

  // ---------------------------------------------------------------
  // 8. recordDecisions (for all 3 round-1 matches)
  // ---------------------------------------------------------------
  try {
    const round1 = matches.filter((m) => m.round_number === 1);
    const decisions: Array<["C" | "D", "C" | "D"]> = [["C", "D"], ["D", "D"], ["C", "C"]];
    for (let i = 0; i < round1.length; i++) {
      const m = round1[i]!;
      const [da, db] = decisions[i]!;
      await recordDecisions(m.id, da, db);
    }
    log(8, "recordDecisions (3 matches in round 1)");
  } catch (e) { fail(8, "recordDecisions", e); return; }

  // ---------------------------------------------------------------
  // 9. updateScores (round 1)
  // ---------------------------------------------------------------
  try {
    await updateScores(tournamentId, 1, [
      { agent_name: "TestAgent_A", delta: 0, cumulative: 0 },
      { agent_name: "TestAgent_B", delta: 1, cumulative: 1 },
      { agent_name: "TestAgent_C", delta: 3, cumulative: 3 },
      { agent_name: "TestAgent_D", delta: 3, cumulative: 3 },
      { agent_name: "TestAgent_E", delta: 1, cumulative: 1 },
      { agent_name: "TestAgent_F", delta: 5, cumulative: 5 },
    ]);
    log(9, "updateScores (round 1)");
  } catch (e) { fail(9, "updateScores", e); return; }

  // ---------------------------------------------------------------
  // 10. completeTournament
  // ---------------------------------------------------------------
  try {
    await completeTournament(tournamentId);
    log(10, `completeTournament(${tournamentId})`);
  } catch (e) { fail(10, "completeTournament", e); return; }

  console.log("\n=== All 10 steps passed ===\n");
}

main();
