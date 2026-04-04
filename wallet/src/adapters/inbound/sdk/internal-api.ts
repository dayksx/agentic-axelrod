/**
 * In-repo “SDK”: same public surface as the package root, grouped for imports like
 * `wallet/internal-api` from other packages in this monorepo.
 */
export * from "../../../use-cases/index.js";
export * from "../../../domain/index.js";
export { createAuthenticatedEvmClient } from "../../outbound/dynamic/authenticated-client.js";
