# Frontend Design Spec — Axelrod Tournament Viewer

> Read-only replay UI. All data is pre-loaded from Supabase. No real-time subscriptions needed — playback is pure client-side animation over a static snapshot.

---

## Principles

1. **Pre-load everything.** On page load, fetch the full tournament dataset once. All playback is animation — no incremental DB calls during replay.
2. **Time is global.** The playback clock advances independently of which view is active. Switching between the arenas grid and an arena detail view does not pause, reset, or fork time. All arenas are always at the same timestamp.
3. **Leaderboard is always visible.** It's the persistent left panel in the tournament context. It reflects the state at the current timestamp.

---

## Page Inventory

| Route | View |
| -------------------------------------------- | ------------------------------------------- |
| `/` | Home — tournament list |
| `/tournament/[id]` | Tournament view — leaderboard + arenas grid |
| `/tournament/[id]/arena/[arenaId]` | Arena detail — leaderboard + match replay |

> **Routing note:** Time is NOT encoded in the URL. It lives in global client state (e.g. Zustand) and persists as the user navigates between the arenas grid and arena detail. The URL only identifies *what is being viewed*, not *when*.

---

## Global Time Model

The tournament replay is driven by a single global cursor `t`:

```
t = (round, phase, step)

round  : 1..N
phase  : chat | decision | scoring | announcement
step   : message index within the chat phase (0 for all other phases)
```

All arenas are always at the same `t`. When `t.phase = chat` and `t.step = 3`, every arena is showing its first 3 chat messages. Switching from the arenas grid to Arena #2 doesn't change `t` — you're just zooming in on one arena at the same moment in time.

**Forward / Back buttons** advance or rewind `t` by one step:
- Within `chat` phase: step increments through messages (0 → 1 → 2 → ... → 5)
- End of chat: phase advances to `decision`
- End of `decision`: phase advances to `scoring`
- End of `scoring`: phase advances to `announcement` (if data exists), then `round` increments and resets

**Auto-play:** `t` advances automatically at a fixed cadence. Forward/back override auto-play for that step, then auto-play resumes.

---

## 0. Landing Page (top of `/`)

The home route is a single scrollable page. The landing section occupies the full viewport height — no scrolling required to read it. Below it, the tournament list begins.

### Layout

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   [Hero image — full width background]                  │
│                                                         │
│   [Project title placeholder]                           │
│                                                         │
│   [What is this? — placeholder paragraph]               │
│                                                         │
│   [History — placeholder paragraph]                     │
│                                                         │
│   [Research question — placeholder paragraph]           │
│                                                         │
│                   ↓  (glowing, animated)                │
└─────────────────────────────────────────────────────────┘
↕ scroll / click arrow
┌─────────────────────────────────────────────────────────┐
│   Tournament list (see Section 1)                       │
└─────────────────────────────────────────────────────────┘
```

### Behavior

- Everything above the fold. Must fit a laptop screen without scrolling.
- The down arrow glows / pulses with a CSS animation.
- Clicking the arrow OR scrolling down transitions to the tournament list section (smooth scroll).
- No separate route — it's all `/`, just two vertical sections.

### Content (placeholders)

- **Title:** `[Project name placeholder]`
- **What is this:** `[Lorem ipsum — 2–3 sentences explaining the Axelrod tournament concept]`
- **History:** `[Lorem ipsum — 2–3 sentences on the history of this research]`
- **Research question:** `[Lorem ipsum — 1–2 sentences on what we are investigating]`
- **Hero image:** `landing-hero.png` — positioned as background or full-bleed image behind/beside the text

---

## 1. Home Page (`/`)

### Layout

A single chronological list of all tournaments in the series. There is only one series. Between consecutive tournaments, surviving agents are called out visually (e.g. a "→ carried forward" connector between cards).

```
Tournament #1   [completed]   →  clickable card
    ↓  TitForTat, Grudger, Pavlov survived →
Tournament #2   [completed]   →  clickable card
    ↓  ...
Tournament #3   [in progress] →  dimmed, not clickable
```

### Tournament Card (completed)

- Tournament number + date
- 6 agent avatars (all use the same hardcoded image — see Assets)
- Winner name + final score
- Total rounds

### Tournament Card (in progress)

- Same layout, desaturated / lower opacity
- "In progress" badge
- Not clickable — no hover state

### Data Loading

As soon as the user lands on `/`, begin prefetching full tournament data for all tournaments (up to 10), in parallel. By the time the user clicks into a tournament, the data is ready.

---

## 2. Tournament Page (`/tournament/[id]`)

### Layout

```
┌─────────────────────────────────────────────────────────┐
│  Home > Tournament #6        ● Round 5 of 10            │
├──────────────────┬──────────────────────────────────────┤
│                  │                                      │
│   Leaderboard    │         Arenas Grid                  │
│   (persistent)   │         (or Arena Detail)            │
│                  │                                      │
└──────────────────┴──────────────────────────────────────┘
│               Playback Controls (bottom bar)            │
└─────────────────────────────────────────────────────────┘
```

### Left Panel — Leaderboard

- Ranked list of all 6 agents with cumulative score at `t`
- Agent avatar + name + score
- Score animates when `t` crosses a scoring event
- Rank changes animate (agents reorder)
- Frozen during the chat and decision phases; updates when `t.phase = scoring`

### Right Panel — Arenas Grid

Shown at `/tournament/[id]`. Displays all 3 arenas simultaneously, all at the same `t`.

Each arena card shows:
- Arena number
- Two agent avatars + names
- Current phase state at `t`:
  - **Chat phase**: the latest message bubble visible so far (truncated if long)
  - **Decision phase**: two pulsing sealed envelopes
  - **Scoring**: score deltas
  - **Announcement**: broadcast icon

Clicking an arena navigates to `/tournament/[id]/arena/[arenaId]`. Time does not pause.

### Right Panel — Arena Detail

Shown at `/tournament/[id]/arena/[arenaId]`. The arenas grid is replaced by a single arena's full match view. The leaderboard stays. Time keeps running.

Navigation back:
- `← Arena #2` back arrow in the panel header
- Breadcrumb: `Home > Tournament #6 > Arena #2`

### Playback Controls (bottom bar)

Always visible on the tournament page (both in arenas grid and arena detail view).

```
  [◀ Back]   Round 5  •  Chat  •  Message 3 of 6   [Forward ▶]
```

Shows current `t` position. Forward/Back work at message granularity (one step per click).

---

## 3. Arena Detail View (`/tournament/[id]/arena/[arenaId]`)

The arena detail renders the current match for this arena at timestamp `t`. As `t` advances (auto-play or user-driven), the view updates.

### Phase Rendering

#### Chat Phase (`t.phase = chat`)

- Chat bubbles for messages 0 through `t.step` are visible
- The most recent bubble (`t.step`) is mid-animation: characters reveal progressively (typewriter effect)
- Forward: if current bubble is mid-animation → complete it instantly. If complete → advance to next bubble (or next phase)
- Backward: hide current bubble, show previous as complete

Agent on the left, opponent on the right. Bubbles alternate sides. Each bubble has the agent's avatar.

#### Decision Phase (`t.phase = decision`, before reveal)

- Chat fades slightly (still visible, de-emphasized)
- Two sealed envelope cards appear — one per agent, centered under each avatar
- Cards pulse gently
- Auto-play pauses briefly (~1.5s), then advances to reveal
- Forward skips the pause and reveals immediately

#### Decision Phase (after reveal)

- Both cards flip simultaneously showing C or D
- C = green, D = red
- Score deltas appear: `+3` / `-1` floating above each card

#### Scoring Phase (`t.phase = scoring`)

- Score deltas animate up toward the leaderboard
- Leaderboard updates: scores change, ranks reorder

#### Announcement Phase (`t.phase = announcement`)

- A broadcast panel appears (visually distinct from chat — more like a system alert)
- Text reveal animation
- Labeled "Game Master Announcement"
- Only renders if `announcements` data exists for this round

---

## Assets

**Agent avatar:** All agents use the same hardcoded image.
```
https://imgs.search.brave.com/VYH0b-0X6tItrD9_PLvbTLYf87N8RVOZVLzPJxtmSh4/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9pLmlt/Z2ZsaXAuY29tLzIv/YmM2MHUuanBn
```

---

## Data Loading Strategy

On `/tournament/[id]` load (and prefetched from home), fetch in parallel:

1. Tournament metadata
2. All agents in the tournament (via `tournament_agents` JOIN `agents`)
3. All matches (all rounds)
4. All chat_messages for all matches
5. All scores for all rounds
6. All announcements for the tournament

Everything lands in a single in-memory data structure. Playback is entirely local after that.

---

## Assets Required

Two image assets needed from the designer. Everything else is CSS.

| Asset | Usage | Notes |
|---|---|---|
| `sealed-card.png` | Decision phase — shown before C/D reveal, one per agent (appears twice side by side) | Roughly square; will be scaled via CSS |
| `landing-hero.png` | Landing page — full-width hero image or background art | Layout will adapt to its dimensions |

---

## Constraints

- **Desktop only.** No mobile view.
- **Leaderboard during match:** Frozen during chat and decision phases. Updates only when `t.phase = scoring`. No live delta preview.
