import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

let cachedRoot: string | undefined;

/**
 * Absolute path to this npm package root (the folder containing `package.json` with `"name": "wallet"`).
 * Used so persisted wallet JSON files default here instead of `process.cwd()` (which differs when the SDK runs from another repo).
 */
export function getWalletPackageRoot(): string {
  if (cachedRoot !== undefined) {
    return cachedRoot;
  }
  let dir = dirname(fileURLToPath(import.meta.url));
  for (;;) {
    const pkgPath = join(dir, "package.json");
    if (existsSync(pkgPath)) {
      try {
        const raw = readFileSync(pkgPath, "utf8");
        const parsed = JSON.parse(raw) as { name?: string };
        if (parsed.name === "wallet") {
          cachedRoot = dir;
          return dir;
        }
      } catch {
        // ignore invalid package.json
      }
    }
    const parent = dirname(dir);
    if (parent === dir) {
      throw new Error(
        "getWalletPackageRoot: could not find wallet package.json (name \"wallet\") above this module",
      );
    }
    dir = parent;
  }
}
