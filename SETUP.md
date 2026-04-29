# Setup Guide

This guide covers every step needed to migrate from Google Sheets to
**Supabase** (database) + a **Discord webhook** (embed notifications).

---

## 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and create a free account.
2. Click **New project** and pick any name (e.g. `nong-leaderboard`).
3. Choose a region close to you and set a database password. Save the password somewhere safe.
4. Wait for the project to finish provisioning (~1 min).

---

## 2. Create the database tables

1. In your Supabase project, open **SQL Editor**.
2. Paste the contents of [`supabase/migrations/001_initial_schema.sql`](supabase/migrations/001_initial_schema.sql) and click **Run**.

This creates the `leaderboard_snapshots` table with columns:

| Column | Type | Description |
|---|---|---|
| `id` | bigserial | Auto-incrementing primary key |
| `fetched_at` | timestamptz | When the snapshot was taken |
| `rank` | integer | Member rank at that moment |
| `username` | text | Roblox username |
| `total_points` | bigint | Contribution points |

3. Paste the contents of [`supabase/migrations/002_starry_battle_archive.sql`](supabase/migrations/002_starry_battle_archive.sql) and click **Run**.

This creates the `StarryBattleArchive` table used as an append-only time-series of all leaderboard snapshots. All hourly-gain and rate calculations read from this table (see [How it works end-to-end](#how-it-works-end-to-end)).

4. Paste the contents of [`supabase/migrations/003_repurpose_tables.sql`](supabase/migrations/003_repurpose_tables.sql) and click **Run**.

> ⚠️ **One-time migration required.** Run `003_repurpose_tables.sql` in the Supabase SQL Editor **before the next ingest run** after deploying these changes. If you skip this step, the ingest will fail because the `username` unique constraint on `leaderboard_snapshots` won't exist yet.

### Tables

| Table | Role | Write pattern |
|---|---|---|
| `leaderboard_snapshots` | **Current state only.** Always reflects the most recent run. Safe for any external service to query for "what does the leaderboard look like right now". | UPSERT on `username` — never grows beyond clan size. |
| `StarryBattleArchive` | **Append-only time-series.** All historical snapshots, retained for 14 days. Used internally for hourly-gain and other rate calculations. | INSERT a fresh batch every run; rows older than 14 days are pruned. |

---

## 3. Get your Supabase credentials

In your Supabase project go to **Project Settings → API**.

| Setting | Where to find it |
|---|---|
| `SUPABASE_URL` | "Project URL" (e.g. `https://xxxx.supabase.co`) |
| `SUPABASE_SERVICE_KEY` | "service_role" key under "Project API keys" — **keep this secret** |

---

## 4. Create a Discord webhook

1. Open Discord, go to the channel where you want leaderboard posts.
2. **Edit Channel → Integrations → Webhooks → New Webhook**.
3. Give it a name (e.g. `NONG Leaderboard`) and optionally set an avatar.
4. Click **Copy Webhook URL** — save it for the next step.

---

## 5. Add secrets to GitHub

In this repository go to **Settings → Secrets and variables → Actions → New repository secret** and add:

| Secret name | Value |
|---|---|
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_SERVICE_KEY` | Your Supabase service-role key |
| `DISCORD_WEBHOOK_URL` | Your Discord webhook URL |

> **Optional:** You can also add `CLAN_NAME` (default: `NONG`) and `TOP_N`
> (default: `10`) as secrets or plain repository variables if you want to
> override them without editing code.

---

## 6. Trigger the workflow

The workflow runs automatically every 5 minutes. To run it immediately:

1. Go to **Actions → Update leaderboard**.
2. Click **Run workflow → Run workflow**.

The first run will insert a snapshot but show `N/A` for the 60-minute gain
(no historical data yet). After ~60 minutes of runs gain values will appear.

---

## How it works end-to-end

```
GitHub Actions (every 5 min)
  └─ ingest.js
       ├─ Fetch clan data from biggamesapi.io/api/clan/NONG
       ├─ Read snapshot from ~60 min ago from StarryBattleArchive  →  compute 60m gains
       ├─ Read previous snapshot from StarryBattleArchive          →  compute last-gain delta
       ├─ Append new snapshot batch to StarryBattleArchive
       ├─ Upsert current state into leaderboard_snapshots
       ├─ Prune StarryBattleArchive rows older than 14 days
       ├─ Update README.md leaderboard table
       └─ POST Discord Components V2 webhook message
```

### StarryBattleArchive

`StarryBattleArchive` is the **append-only time-series** table. Every ingest run inserts a fresh batch of rows (one row per member) with a `fetched_at` timestamp. All gain and rate calculations (1h gain, last-gain delta, and any future rates) read from this table.

Rows are automatically pruned after **14 days** (`KEEP_HOURS = 336`) — 14 days is the maximum length of any clan battle, so any battle started at the beginning of the window will still have full history available.

`leaderboard_snapshots` is kept as the **current-state** table. It contains exactly one row per active member (upserted every run) and never grows past clan size. Any external service that wants "what does the leaderboard look like right now" should query this table.

### Discord Components V2: card grid layout

> **Action required after merging this PR (existing deployments only — skip if this is a fresh install):**
> 1. In Discord, delete the 3 existing leaderboard messages posted by the bot.
> 2. In GitHub repository secrets, clear `DISCORD_MESSAGE_IDS` (or delete it).
> 3. Trigger the workflow once. The bot will POST 3 new Components V2 messages and log their IDs.
> 4. Copy those IDs back into `DISCORD_MESSAGE_IDS` (comma-separated, in order).
>
> This is necessary because a Components V2 message cannot be PATCHed into a plain-embed message and vice versa — Discord rejects mismatched edits.

The Discord messages use **Components V2** (opted in via `flags: 32768`). Each
page is structured as a `components` array — no `embeds` field is used.

Per-page layout:

```
Container (header, gold accent)
  └─ TextDisplay — "## 🏆 NONG Clan Leaderboard (Page X/3)\n\n🕒 Last Update…\n└ Next Update…"

Separator (large, no divider line)

// Repeated 8 times (one per row of 3 cards):
Container (row, gold accent)
  └─ Section
       ├─ TextDisplay (card 1)
       ├─ TextDisplay (card 2)
       └─ TextDisplay (card 3)
Separator (small, no divider line)

Container (footer)
  └─ TextDisplay — "-# Updated YYYY-MM-DD HH:MM:SS UTC"
```

Each card TextDisplay contains:

```
**{rank}. {username}**
<:RankStar:…> Points: **{abbreviatedPoints}**
> 1h Gain: **{gainOrNA}**
```

Partial last rows are padded with zero-width-space TextDisplays to keep
columns aligned. Total components per page ≈ 27, well under Discord's 40-component cap.

The `Next Update` timestamp is computed by rounding the current time up to the
next `UPDATE_INTERVAL_MIN`-minute boundary. Update both the workflow cron and
the `UPDATE_INTERVAL_MIN` constant in `ingest.js` if you change the cadence.

#### Custom emoji

The Points line uses the `RANK_STAR_EMOJI` constant defined near the top of
`ingest.js`. It is set to `<:RankStar:1499100837006413937>` — Discord resolves
the emoji by **ID**, so the name portion can be freely renamed on the server
without breaking anything. To swap in a different emoji, update the constant.

---

## Decommissioning the Google Sheet

Once you've confirmed a few successful runs with Supabase data you can:

1. Delete the AppScript trigger in Google Sheets.
2. Remove the `update-readme.js` file (or leave it — it is no longer called).
3. The `SOURCE_CSV_URL` in `update-readme.js` no longer needs to be maintained.
