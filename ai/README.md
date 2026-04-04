# AI — multi-agent HTTP fleet

This package runs **one HTTP server per agent** (each is a LangGraph-backed player). The CLI entrypoint is `src/main.ts` (compiled to `dist/main.js`): it parses arguments, loads `.env`, starts the servers, prints **A2A** `POST …/message/send` URLs, and exits cleanly on **SIGINT** / **SIGTERM**.

## Prerequisites

- Node.js and [pnpm](https://pnpm.io/) (workspace uses `pnpm@10.6.5`).
- Copy `.env.example` to `.env` and set at least **`LLM_API_KEY`** (or **`OPENAI_API_KEY`**). The runtime uses **`ChatOpenAI`** against an **OpenAI-compatible** HTTP API, so you can point **`LLM_BASE_URL`** / **`LLM_MODEL`** at OpenAI, DeepSeek, Groq, a local gateway, etc. Optional **`LLM_PROFILE`** (`openai` | `deepseek` | `groq`) picks sensible defaults when you omit URL/model. See `.env.example` and the sections below. **LangSmith** tracing is optional (set **`LANGCHAIN_TRACING_V2`**, **`LANGSMITH_API_KEY`**, **`LANGSMITH_PROJECT`**).

## Build and run

From the `ai` package directory:

```bash
pnpm install
pnpm build
pnpm start
```

`pnpm start` runs `tsx src/main.ts` (TypeScript entry). After `pnpm build`, you can run `node dist/main.js` instead. Pass CLI flags after `--` (e.g. `pnpm start -- --help`).

## CLI — launch an agent

Required ideas are **`--name`** (ENS identifier) and **`--strategy`** (behavior string). Both can be repeated for multiple agents, in order.

Show help:

```bash
node dist/main.js --help
```

### Main options

| Option                | Description                                                                                                                      |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `--name <ens>`        | Agent ENS name. Repeat once per agent. If the value has no `.eth` suffix, **`.eth` is appended**.                                |
| `--strategy <prompt>` | Strategy / behavior string. Repeat per agent, or pass a single `--strategy` to reuse for every agent in the fleet.               |
| `-n`, `--players <n>` | Fleet size (default: `PLAYER_COUNT` env or **1**). Automatically at least the number of `--name` / `--strategy` values you pass. |
| `--port-base <n>`     | First port; agents use `port-base`, `port-base+1`, … (default: env or `3100`).                                                   |
| `--host <host>`       | Bind address (default: env or `0.0.0.0`).                                                                                        |
| `-h`, `--help`        | Print usage and exit.                                                                                                            |

**Precedence:** explicit CLI flags override environment variables; env overrides built-in defaults.

### Environment defaults (when not set on the CLI)

| Variable       | Default   | Role                                    |
| -------------- | --------- | --------------------------------------- |
| `PLAYER_COUNT` | `1`       | Fleet size if `-n` is omitted.          |
| `PORT_BASE`    | `3100`    | First port if `--port-base` is omitted. |
| `HOST`         | `0.0.0.0` | Bind address if `--host` is omitted.    |

When the process binds `0.0.0.0` or `::`, printed URLs use **`127.0.0.1`** so you can copy them into `curl` or clients on the same machine.

### LLM configuration (`src/config/llm-env.ts`)

| Variable                     | Role                                                                       |
| ---------------------------- | -------------------------------------------------------------------------- |
| `LLM_PROFILE`                | `openai` (default), `deepseek`, or `groq` — sets default base URL + model. |
| `LLM_API_KEY`                | API key (`OPENAI_API_KEY` used if unset).                                  |
| `LLM_BASE_URL` / `LLM_MODEL` | Optional overrides for any OpenAI-compatible endpoint.                     |

Temperature is fixed at `0` in code.

### LangSmith tracing (optional)

LangGraph / LangChain picks up standard LangSmith environment variables. To send traces to [LangSmith](https://smith.langchain.com/), set in `.env`:

| Variable               | Role                                                        |
| ---------------------- | ----------------------------------------------------------- |
| `LANGCHAIN_TRACING_V2` | Set to `true` to enable tracing.                            |
| `LANGSMITH_API_KEY`    | API key from LangSmith settings.                            |
| `LANGSMITH_PROJECT`    | Project name (must match or create a project in LangSmith). |

Optional: `LANGSMITH_ENDPOINT` if you use a custom or self-hosted endpoint (see `.env.example`).

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

The process logs each agent’s **message/send** URL. Bodies are validated with a **Zod discriminated union** on `phase` (typed shapes, like LangGraph-style structured inputs) — see `src/adapter/http/message-send.schema.ts`. Unknown keys are rejected (`.strict()` per variant). Invalid bodies return **400** with `error` and optional `issues` (Zod issue list).

Example **chat** (each player has its own port from the printed URL; default first port is `3100`):

```bash
curl -sS -X POST "http://127.0.0.1:3100/message/send" \
  -H "Content-Type: application/json" \
  -d '{"phase":"chat","message":"Hello","iteration":1}'
```

**decision** / **end**: `{"phase":"decision"}` or `{"phase":"end"}` only (no extra fields).

**reveal** — preferred shape:

```json
{
  "phase": "reveal",
  "reveal": {
    "round": 1,
    "yourMove": "cooperate",
    "adversaryMove": "defect",
    "yourScore": 0,
    "adversaryScore": 5
  }
}
```

Legacy: the same five fields may be sent at the top level next to `"phase":"reveal"`; they are normalized before validation.

Stop the fleet with **Ctrl+C** (SIGINT) or `SIGTERM`.
