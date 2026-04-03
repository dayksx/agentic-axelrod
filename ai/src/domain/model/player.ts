/**
 * Domain model: an autonomous participant (strategy + identity).
 * Unique on-chain identity can be represented as an ENS name (e.g. alice.eth).
 */

import type { EnsName, PlayerConfig } from "./types.js";

export class Player {
  readonly name: EnsName;
  readonly domain: string;
  readonly soul: string;

  constructor(config: PlayerConfig) {
    this.name = config.name;
    this.domain = config.domain;
    this.soul = config.soul;
  }

  chat() {
    // TODO
  }

  decision() {
    // TODO
  }

  update(context: string) {
    // TODO
  }

}
