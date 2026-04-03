/**
 * Types for the Player domain model.
 */

export type EnsName = `${string}.eth`;

export interface PlayerConfig {
  readonly name: EnsName;
  readonly domain: string;
  readonly soul: string;
}
