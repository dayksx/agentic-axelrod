# Database (Supabase)

## Structure

```
db/
├── config.toml              # Supabase project config
├── migrations/
│   ├── 001_schema.sql       # Tables, constraints, indexes
│   └── 002_rls.sql          # Row Level Security (anon=read, service_role=write)
├── seed.sql                 # Dummy data: 12 agents, 3 tournaments, 72 matches
└── README.md
```

## Setup

### 1. Create a Supabase project

Go to [supabase.com](https://supabase.com), create a new project, and note the **project ref** from the URL (e.g. `abcdefghijklmnop`).

### 2. Install the CLI

```bash
pnpm add -g supabase
```

### 3. Link to your project

```bash
cd db
supabase link --project-ref <your-project-ref>
```

This writes the project id into `config.toml`.

### 4. Push schema + seed

```bash
supabase db push          # applies migrations
supabase db reset --linked # drops, re-creates, runs migrations + seed.sql
```

`db reset --linked` is the "nuclear" option — it wipes the remote database and re-seeds from scratch. Use it freely during development.

### 5. Verify

Open the Supabase dashboard → Table Editor. You should see all tables populated.

## Seed data overview

| Tournament | Status    | Agents                                                    | Rounds |
|------------|-----------|-----------------------------------------------------------|--------|
| 0          | completed | TitForTat, Deceiver, Grudger, Pavlov, Detective, AC      | 10     |
| 1          | completed | TitForTat, Grudger, Pavlov, Hawk, Diplomat, Random        | 10     |
| 2          | running   | Deceiver, Detective, AC, Forgiving, Bully, Adaptive       | 4/10   |

**Row counts:** 12 agents, 72 matches, 432 chat messages, 144 scores, 144 graffiti, 21 gossip, 144 memory, 30 transactions.

## RLS policy

| Role           | Access      | Use case                    |
|----------------|-------------|-----------------------------|
| `anon`         | SELECT only | Frontend (public anon key)  |
| `service_role` | Full CRUD   | Tournament engine (secret)  |

The anon key is safe to expose in frontend code. Writes require the service_role key, which stays server-side.

## Generate TypeScript types

```bash
supabase gen types typescript --linked > ../ui/src/types/database.ts
```
