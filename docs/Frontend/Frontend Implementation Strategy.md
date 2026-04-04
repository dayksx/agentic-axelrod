# Frontend Implementation Strategy

> Reference: `Frontend Design Spec.md` for the full design. This document covers *how* to build it.

---

## Core Architectural Insight

The entire tournament is a **flat, linear timeline of ~100 steps**. Despite 3 arenas running in parallel, all arenas are always at the same step. One integer (`currentStep`) drives the entire UI.

A 10-round tournament with 6 chat messages per match:

```
Per round:
  6 chat steps (one message revealed per step across all arenas)
  + 1 decision-sealed step
  + 1 decision-revealed step
  + 1 scoring step
  + 1 announcement step (if data exists)
  = ~10 steps per round

Total: ~100 steps per tournament
```

**The step index IS the state.** No complex state object to maintain. A single pure function `deriveState(stepIndex, tournamentData)` computes everything every view needs: which round, which phase, how many messages are visible, whether decisions are sealed or revealed, what the leaderboard scores are.

- `forward()` = `stepIndex++`
- `back()` = `stepIndex--`
- `autoPlay` = interval that calls `forward()` on a cadence
- Typewriter animation is local to the rendering component — it doesn't touch global state

---

## Implementation Order

Build the riskiest, most coupled things first. The landing page and home page are trivially simple — save them for last.

### Phase 1 — Data Foundation

**Goal:** Raw DB data fetched, typed, and organized into a structure the timeline can consume.

#### Step 1: Data Types

Define TypeScript types that mirror the DB schema. These are the raw shapes returned by Supabase queries.

Key types: `Tournament`, `Agent`, `TournamentAgent`, `Match`, `ChatMessage`, `Score`, `Announcement`.

#### Step 2: Supabase Queries

One function: `fetchTournamentData(tournamentId): Promise<TournamentData>`

This fetches everything in parallel (tournament metadata, agents, matches, chat_messages, scores, announcements) and returns a single `TournamentData` object. All data for the tournament, flat and complete.

Also: a `fetchTournamentList(): Promise<TournamentSummary[]>` for the home page.

#### Step 3: Data Organization

A transform function that takes raw `TournamentData` and organizes it for timeline consumption:

```
organizeByRound(data: TournamentData): OrganizedTournament

OrganizedTournament = {
  rounds: Round[]        // indexed by round_number
  agents: Agent[]        // the 6 agents
  totalSteps: number     // total steps in the timeline
}

Round = {
  roundNumber: number
  arenas: ArenaRound[]   // 3 arenas, each with its match data
  announcement?: string  // if exists
  scores: ScoreSnapshot  // cumulative scores at end of this round
}

ArenaRound = {
  arenaId: number
  match: Match
  messages: ChatMessage[] // ordered by turn_number
}
```

### Phase 2 — Time Engine

**Goal:** A global store that holds `currentStep` and exposes playback controls. Plus the `deriveState` function that maps step → UI state.

#### Step 4: Timeline Derivation

The critical pure function:

```
deriveState(step: number, tournament: OrganizedTournament): TimelineState

TimelineState = {
  round: number
  phase: 'chat' | 'decision_sealed' | 'decision_revealed' | 'scoring' | 'announcement'
  chatStep: number                    // which message index (0-5), only meaningful during chat
  arenas: DerivedArenaState[]         // state of each arena at this step
  leaderboard: LeaderboardEntry[]     // sorted by cumulative score
}

DerivedArenaState = {
  arenaId: number
  agentA: Agent
  agentB: Agent
  visibleMessages: ChatMessage[]      // messages 0..chatStep
  decisionA: 'sealed' | 'C' | 'D'
  decisionB: 'sealed' | 'C' | 'D'
  deltaA?: number                     // only during scoring/revealed
  deltaB?: number
}
```

The logic: given step index, compute `round = floor(step / stepsPerRound)`, then the offset within the round determines the phase and chat step. Scoring leaderboard = cumulative scores through the previous round (frozen during chat/decision phases).

**This function must be thoroughly tested.** If it's wrong, every view is wrong. Write unit tests for edge cases: step 0, last step, first message of a new round, announcement present vs absent.

#### Step 5: Global Time Store

A client-side store (choose the simplest appropriate tool — Zustand, React Context, or even useReducer lifted to the layout). Exposes:

```
State:
  currentStep: number
  isPlaying: boolean
  totalSteps: number

Actions:
  forward(): void       // step++, clamp at totalSteps
  back(): void          // step--, clamp at 0
  play(): void          // start auto-advance interval
  pause(): void         // stop interval
  jumpTo(step): void    // for direct seeking (future feature)
```

Auto-play cadence: configurable, start with ~800ms per step. The interval calls `forward()` on each tick. Reaching the final step pauses automatically.

Key requirement: navigating between the arenas grid and an arena detail MUST NOT reset or disrupt the time state.

### Phase 3 — Route Shell + Layout

**Goal:** The two-panel tournament layout and playback controls bar, wired to real data and the time store.

#### Step 6: Route Structure

```
/                                  → Home page (landing + tournament list)
/tournament/[id]                   → Tournament layout (leaderboard + right panel)
/tournament/[id]/arena/[arenaId]   → Same layout, right panel swaps to arena detail
```

The tournament layout is a shared layout component. The right panel is the only thing that changes between the arenas grid and the arena detail routes. The leaderboard and playback controls bar are in the layout, not in the page.

#### Step 7: Playback Controls Component

The bottom bar. Reads `currentStep`, `isPlaying` from the store. Displays: round number, phase name, message count. Play/pause button. Forward/back buttons.

This is the first thing you should see working: load a tournament, see the controls, press forward, and watch the step number increment. No visual rendering of arenas yet — just proof the pipeline works end to end.

### Phase 4 — Arena Detail View

**Goal:** The hardest single component. If this works, the rest is downhill.

#### Step 8: Arena Detail — Chat Phase

Render chat bubbles for `visibleMessages` from the derived state. The last message uses a typewriter animation (local to the component). Forward during mid-animation → complete instantly. Backward → remove last bubble.

Agent A on left, Agent B on right. Alternating bubbles. Agent avatar next to each.

#### Step 9: Arena Detail — Decision Phase

Sealed state: two `sealed-card.png` images (placeholder until asset is provided). Pulsing CSS animation.

Revealed state: cards flip (CSS transform), showing C (green) or D (red). Score deltas float up.

Auto-play pauses ~1.5s at the sealed state, then advances. Forward skips.

#### Step 10: Arena Detail — Scoring + Announcement

Scoring: deltas animate toward leaderboard. Leaderboard re-sorts.

Announcement: system-styled message appears with text reveal. Only if `announcements` data exists for the round.

### Phase 5 — Arenas Grid + Leaderboard

**Goal:** The simpler views that consume the same derived state.

#### Step 11: Arenas Grid

3 arena cards. Each reads its `DerivedArenaState` from the timeline. Shows a compact summary: agent names/avatars, current phase indicator, latest chat message truncated (during chat phase), sealed envelopes (during decision), score deltas (during scoring).

Clicking a card navigates to the arena detail route. Time continues.

#### Step 12: Leaderboard

Sorted list of 6 agents. Reads `leaderboard` from derived state. Rank reordering is animated (CSS transitions on the list items). Score updates animate when the phase changes to `scoring`.

### Phase 6 — Home Page + Landing

**Goal:** The entry point. Low complexity.

#### Step 13: Tournament List

Fetch `fetchTournamentList()`. Render cards. Completed → clickable. In-progress → dimmed, not clickable. Show survivor connectors between consecutive tournaments.

On page load, begin prefetching `fetchTournamentData(id)` for all completed tournaments (up to 10), in parallel.

#### Step 14: Landing Page

Full-viewport section above the tournament list. Placeholder text. `landing-hero.png` as background (placeholder until asset provided). Glowing down-arrow with smooth scroll to the tournament list section.

---

## Critical Path

The dependency chain that must not be shortcut:

```
Data Types (Step 1)
    ↓
Supabase Queries (Step 2)
    ↓
Data Organization (Step 3)
    ↓
Timeline Derivation (Step 4)  ← THIS IS THE CRUX. Test it thoroughly.
    ↓
Time Store (Step 5)
    ↓
Route Shell + Playback Controls (Steps 6-7)  ← First visible proof of life
    ↓
Arena Detail (Steps 8-10)  ← Hardest component
    ↓
Arenas Grid + Leaderboard (Steps 11-12)  ← Reuse derived state
    ↓
Home + Landing (Steps 13-14)  ← Easiest, do last
```

Steps 1–7 should be built and verified before any visual rendering of arenas begins. The temptation will be to skip ahead to the arena view — resist it. If `deriveState` is wrong or the store doesn't survive navigation, you'll rip everything apart later.

---

## Testing Strategy

### Unit test `deriveState` extensively

This is the one function where a bug cascades into every view. Test:
- Step 0 → round 1, chat phase, step 0
- Last chat step of round 1 → correct message count
- First step after chat → decision_sealed
- Announcement step present vs absent (different step counts per round)
- Final step of the tournament
- Score accumulation across rounds

### Smoke test the pipeline early

After Step 7 (playback controls), press forward 100 times. Watch the step counter, round number, and phase name update correctly through the entire tournament. This proves the data → timeline → store → UI pipeline works before you invest in the complex views.

---

## What to Defer

These are explicitly out of scope for the initial build:

- Playback speed controls (hardcode ~800ms)
- Keyboard shortcuts (arrow keys for forward/back, space for play/pause)
- URL-encoded time position (for sharing a specific moment)
- Graffiti / gossip display (data exists in DB, not in design spec yet)
- Agent profile pages
- Any mobile responsiveness
- Wallet creation, signing, or chain transactions (server-side `wallet` package; see [`../wallet-management.md`](../wallet-management.md) — UI may only **display** addresses from the DB later)
