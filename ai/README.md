# AI — multi-agent HTTP fleet

This package runs **one HTTP server per agent** (each is a LangGraph-backed player). The CLI entrypoint is `src/main.ts` (compiled to `dist/main.js`): it parses arguments, loads `.env`, starts the servers, prints **A2A** `POST …/message/send` URLs, and exits cleanly on **SIGINT** / **SIGTERM**.

## Prerequisites

- Node.js and [pnpm](https://pnpm.io/) (workspace uses `pnpm@10.6.5`).
- Copy `.env.example` to `.env` and set at least **`LLM_API_KEY`** (and any provider options your stack expects). See `.env.example` for optional tracing (LangSmith).

## Build and run

From the `ai` package directory:

```bash
pnpm install
pnpm build
pnpm start
```

`pnpm start` runs `node dist/main.js`. Pass CLI flags after `--` (e.g. `pnpm start -- --help`).

## CLI — launch an agent

Required ideas are **`--name`** (ENS identifier) and **`--strategy`** (behavior string). Both can be repeated for multiple agents, in order.

Show help:

```bash
node dist/main.js --help
```

### Main options

| Option | Description |
|--------|-------------|
| `--name <ens>` | Agent ENS name. Repeat once per agent. If the value has no `.eth` suffix, **`.eth` is appended**. |
| `--strategy <prompt>` | Strategy / behavior string. Repeat per agent, or pass a single `--strategy` to reuse for every agent in the fleet. |
| `-n`, `--players <n>` | Fleet size (default: `PLAYER_COUNT` env or **1**). Automatically at least the number of `--name` / `--strategy` values you pass. |
| `--port-base <n>` | First port; agents use `port-base`, `port-base+1`, … (default: env or `3100`). |
| `--host <host>` | Bind address (default: env or `0.0.0.0`). |
| `-h`, `--help` | Print usage and exit. |

**Precedence:** explicit CLI flags override environment variables; env overrides built-in defaults.

### Environment defaults (when not set on the CLI)

| Variable | Default | Role |
|----------|---------|------|
| `PLAYER_COUNT` | `1` | Fleet size if `-n` is omitted. |
| `PORT_BASE` | `3100` | First port if `--port-base` is omitted. |
| `HOST` | `0.0.0.0` | Bind address if `--host` is omitted. |

When the process binds `0.0.0.0` or `::`, printed URLs use **`127.0.0.1`** so you can copy them into `curl` or clients on the same machine.

### Strategy prompts (`--strategy`)

- **No `--strategy`:** each agent gets a generic default strategy string.
- **Exactly one `--strategy` and multiple agents:** that string is **reused for all** agents.
- **Several `--strategy` values:** applied in order; any extra slots get generic defaults.
- **More `--strategy` than fleet size:** error (trim flags or increase `-n`).

### ENS names (`--name`)

- **No `--name`:** identities are `player1.eth`, `player2.eth`, …
- **Exactly one `--name` and multiple agents (`-n` > 1):** not allowed (ambiguous). Either pass **one `--name` per agent** or omit `--name` and use the defaults above.
- **Several `--name` values:** applied in order; remaining slots get `player{k}.eth`.

### Examples

One agent with explicit ENS and strategy:

```bash
node dist/main.js --name alice.eth --strategy "Tit-for-tat: cooperate first, then mirror."
```

Shorthand (`.eth` added if omitted):

```bash
node dist/main.js --name alice --strategy "Always cooperate."
```

Two agents:

```bash
node dist/main.js \
  --name alice.eth --strategy "Always cooperate." \
  --name bob.eth --strategy "Grim trigger after one betrayal."
```

Three agents sharing one strategy; names default to `player1.eth`, …:

```bash
node dist/main.js -n 3 --strategy "Same prompt for every agent."
```

Custom bind and port range:

```bash
node dist/main.js -n 2 --host 127.0.0.1 --port-base 4000
```

## After launch

The process logs each agent’s **message/send** URL. Example **chat** request (replace path with the printed ENS segment):

```bash
curl -sS -X POST "http://127.0.0.1:3100/alice.eth/message/send" \
  -H "Content-Type: application/json" \
  -d '{"phase":"chat","message":"Hello"}'
```

Other workflow phases use `body.phase` (for example `decision` for the decision step; `reveal` expects a round outcome in the body — see `src/adapter/http/agent-server.ts`).

Stop the fleet with **Ctrl+C** (SIGINT) or `SIGTERM`.
