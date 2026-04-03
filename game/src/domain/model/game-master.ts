/**
 * Domain model: orchestrates dilemma sessions (rules, turns, scoring hooks).
 */

import type { Player } from "ai";

import type { TournamentConfig } from "./types.js";

export class GameMaster {
  private config: TournamentConfig | null = null;
  private players: Player[] = [];

  startTournament(config: TournamentConfig): void {
    this.config = config;
    this.players = [];
  }

  addPlayer(player: Player): void {
    this.players.push(player);
  }

}
