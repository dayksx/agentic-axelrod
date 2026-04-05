# Hackathon Submission

## Short Description

LangGraph agents play Prisoner's Dilemma tournaments via A2A with on-chain stakes & ERC-7702

## Description

Agentic Axelrod is a multi-agent social experiment built on the iterated Prisoner's Dilemma. Up to six autonomous agents - each a LangGraph state machine backed by an LLM (OpenAI, DeepSeek, or Groq) and guided by a natural-language strategy prompt (tit-for-tat, grim trigger, negotiator, random kindness, etc.) - compete in a double round-robin tournament orchestrated by a Game Master runtime.

Each match follows a strict phase sequence - load, announce, chat (three messages each), simultaneous decision, and reveal - all mediated by the GM through an A2A-inspired HTTP protocol: the GM posts structured messages to each agent's `/message/send` endpoint and agents respond with their phase output. Agents never communicate directly with each other, keeping the game fair, fully observable, and easy to audit. Because strategies emerge from prompt-guided LLM inference over a LangGraph workflow with memory, rather than hardcoded logic, agent behavior is expressive and unpredictable.

The architecture scales from local experimentation to a full on-chain experience. At its simplest, you run six agent servers and a CLI tournament with zero infrastructure. Turn on Supabase and every announcement, chat message, decision, and score is persisted to Postgres with RLS. Turn on the HTTP GM server and the Next.js frontend can browse past tournaments, display live arena grids, and let users join. Turn on the wallet layer and each agent gets a Dynamic MPC EOA on Base Sepolia, with an ERC-7702 upgrade path to MetaMask smart accounts - enabling stake collection before tournaments and prize distribution to the top three after.

The goal is to study how language, memory, and heterogeneous strategies produce cooperation, exploitation, or emergent norms under repeated play - questions relevant to multi-agent AI coordination, governance design, and on-chain mechanism design.

## How It's Made

TypeScript pnpm monorepo, four packages: `ai` (agents), `game` (Game Master), `wallet` (on-chain), `ui` (frontend).

**Agents - LangGraph + LangChain.** Each agent is a LangGraph `StateGraph` with `MemorySaver` checkpointing, backed by LangChain's `ChatOpenAI` (tested with OpenAI, DeepSeek, Groq). Graph nodes map to game phases (announce, chat, decision); strategy is a natural-language system prompt, not code. Each agent runs as an Express 5 server exposing a Google A2A-style `POST /message/send` endpoint - the GM is the only caller. Agents are identified by ENS-style subnames (e.g. `tit-for-tat.eth`) which serve as their on-chain and in-game identity throughout the tournament.

**Game Master.** Pure TypeScript runtime: builds a double round-robin schedule (6 players, 10 rounds x 3 parallel arenas = 30 matches), then drives each match through load/announce/chat/decision/reveal by posting JSON to agents and collecting responses. Agents never talk to each other - every message is relayed and logged by the GM. Runs as CLI or HTTP server.

**Supabase.** The GM writes every event (agents, tournaments, matches, announcements, chat messages, decisions, scores, transactions) to Postgres via the service-role key. RLS lets the frontend read with the anon key while only the GM can write.

**Dynamic (server + client) + ERC-7702.** Server-side: Dynamic's `@dynamic-labs-wallet/node-evm` SDK creates MPC EOA wallets for the GM and each player - no seed phrases, no browser. Client-side: Dynamic's React SDK (`@dynamic-labs/sdk-react-core` + `EthereumWalletConnectors`) powers wallet connection and signing in the frontend, configured for Sepolia. The EOAs can be upgraded to smart accounts via ERC-7702 using `@metamask/smart-accounts-kit` with MetaMask's Stateless7702 delegator on Base Sepolia - the EOA signs an EIP-7702 authorization and set-code transaction to become a smart account. We scaffolded delegation flows (agent delegates funds to GM, GM transfers delegated funds) on top of the upgraded accounts for future use. Before a tournament the GM collects stakes from player wallets; after, it distributes prizes to the top three.

**Frontend - Next.js + Zustand time simulation.** Next.js 16, Tailwind CSS 4, Zustand. The tournament viewer uses a Zustand time store that replays completed tournaments step-by-step: it derives visible state (current round, arena, phase, chat messages, sealed/revealed decisions, scores) from a single `currentStep` integer, with play/pause/forward/back controls and auto-advance timers that pause longer on sealed decision moments for dramatic effect.

**Notable hacks.** The A2A-style GM-as-sole-router protocol was the key design decision - fairness (no agent peeks at another's decision early), observability (one place to log everything), and clean separation for parallel development. Strategy prompts are plain text files anyone can edit - no code changes to invent a new agent personality. Every layer (CLI, Supabase, HTTP API, wallets) toggles on independently via env vars.
