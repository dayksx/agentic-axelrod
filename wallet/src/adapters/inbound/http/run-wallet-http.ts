/**
 * Standalone HTTP server for wallet REST endpoints.
 *
 * Env: `WALLET_HTTP_PORT` (default 3210), `WALLET_HTTP_HOST` (default 0.0.0.0).
 * Loads `wallet/.env` via dotenv (plus normal process env).
 */
import { config as loadEnv } from "dotenv";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createWalletHttpApp } from "./wallet-http-app.js";

const walletRoot = join(dirname(fileURLToPath(import.meta.url)), "../../../..");
loadEnv({ path: join(walletRoot, ".env") });

function parsePort(raw: string | undefined, fallback: number): number {
  if (raw === undefined || raw.trim() === "") return fallback;
  const n = Number(raw);
  if (!Number.isFinite(n) || !Number.isInteger(n) || n < 1 || n > 65535) {
    return fallback;
  }
  return n;
}

export async function startWalletHttpServer(): Promise<{
  close: () => Promise<void>;
  port: number;
}> {
  const app = createWalletHttpApp();
  const port = parsePort(
    process.env.WALLET_HTTP_PORT ?? process.env.PORT,
    3210,
  );
  const host = process.env.WALLET_HTTP_HOST ?? "0.0.0.0";

  return new Promise((resolve, reject) => {
    const server = app.listen(port, host, () => {
      console.log(
        `[wallet HTTP] listening http://${host === "0.0.0.0" ? "127.0.0.1" : host}:${port}`,
      );
      console.log(
        `[wallet HTTP] POST /agents  GET /health`,
      );
      resolve({
        port,
        close: () =>
          new Promise((res, rej) => {
            server.close((err) => (err ? rej(err) : res()));
          }),
      });
    });
    server.on("error", reject);
  });
}

function isRunAsMain(): boolean {
  const entry = process.argv[1];
  if (entry === undefined) return false;
  try {
    return import.meta.url === pathToFileURL(entry).href;
  } catch {
    return false;
  }
}

if (isRunAsMain()) {
  await startWalletHttpServer();
}
