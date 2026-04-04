SPDX-License-Identifier: GPL-3.0-or-later

# AI — HTTP agent (one process per slot)

Each process runs **one** LangGraph-backed **`POST /message/send`** server. The process starts **unconfigured** (`slot1.eth`, empty strategy); send **`phase: "load"`** with real ENS name, domain, and strategy before chat/decision/reveal. For six agents locally or in a cluster, run **six processes** with six ports (or replicas). Entry: `src/main.ts` → `dist/main.js`; loads `.env`; exits cleanly on **SIGINT** / **SIGTERM**.

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

## CLI — one listener per process

Placeholder identity (`slot1.eth`) until **`load`**. Options are inlined in `src/main.ts` (no separate CLI module).

Show help:

```bash
node dist/main.js --help
```

### Options

| Option          | Description                                                                                   |
| --------------- | --------------------------------------------------------------------------------------------- |
| `--port <n>`    | Listen port. Default: **`PORT`** env, else **`PORT_BASE`**, else **3100**. CLI wins over env. |
| `--host <host>` | Bind address (default: **`HOST`** env or `0.0.0.0`).                                          |
| `-h`, `--help`  | Print usage and exit.                                                                         |

### Environment (when not set on the CLI)

| Variable    | Default   | Role                         |
| ----------- | --------- | ---------------------------- |
| `PORT`      | —         | Common on PaaS; then `3100`. |
| `PORT_BASE` | —         | Fallback if `PORT` is unset. |
| `HOST`      | `0.0.0.0` | Bind address.                |

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

### Examples

Default port **3100**:

```bash
pnpm start
```

Six local agents (six terminals or a process manager):

```bash
pnpm start -- --port 3100
pnpm start -- --port 3101
# … through 3105
```

Platform-assigned port:

```bash
PORT=8080 pnpm start
```

### Configure a slot (`phase: "load"`)

After start, each port accepts:

```json
{
  "phase": "load",
  "name": "alice.eth",
  "domain": "https://alice.example",
  "strategy": "Tit-for-tat: cooperate first, then mirror."
}
```

Until **`load`**, the process keeps placeholder **`slot1.eth`** and empty strategy. **`load`** replaces the LangGraph workflow so memory starts fresh for that session.

## After launch

The process logs **`POST …/message/send`** and **`GET …/player`**. **`GET /player`** returns the current **`name`**, **`domain`**, and **`strategy`** (after **`load`**, use it to confirm identity).

Bodies for **`/message/send`** are validated with a **Zod discriminated union** on `phase` — see `src/adapter/http/message-send.schema.ts`. Unknown keys are rejected (`.strict()` per variant). Invalid bodies return **400** with `error` and optional `issues` (Zod issue list).

```bash
curl -sS "http://127.0.0.1:3100/player"
```

Copy-paste **`load`** curls for a six-port fleet: **[USEFUL-PROMPTS.md](./USEFUL-PROMPTS.md)**.

Example **`load`** then **chat** (each slot has its own port; default first port is `3100`):

```bash
curl -sS -X POST "http://127.0.0.1:3100/message/send" \
  -H "Content-Type: application/json" \
  -d '{"phase":"load","name":"alice.eth","domain":"https://alice.local","strategy":"Cooperate unless provoked."}'

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
