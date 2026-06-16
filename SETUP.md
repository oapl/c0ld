# Setup Guide

This guide covers every step needed to migrate from Google Sheets to
**Supabase** (database) + a **Discord webhook** (embed notifications).

---

## 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and create a free account.
2. Click **New project** and pick any name (e.g. `c0ld-leaderboard`).
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

5. Paste the contents of [`supabase/migrations/004_c0ld_clan_snapshots.sql`](supabase/migrations/004_c0ld_clan_snapshots.sql) and click **Run**.

This creates the newer canonical table, `c0ld_clan_snapshots`, for all future c0ld clan API pulls. It does not delete or rewrite the earlier tables; it lets the Cloudflare clan API Worker start writing one consolidated table while the site is migrated over safely.

6. Paste the contents of [`supabase/migrations/006_c0ld_current_and_battles.sql`](supabase/migrations/006_c0ld_current_and_battles.sql) and click **Run**.

This creates `c0ld_clan_current` as a real current-only table and `c0ld_battle_runs` for tracking battle keys/metadata.

7. Paste the contents of [`supabase/migrations/007_c0ld_clans_leaderboard.sql`](supabase/migrations/007_c0ld_clans_leaderboard.sql) and click **Run**.

This creates the separate all-clans leaderboard tables, `c0ld_clans_snapshots` and `c0ld_clans_current`.

### Tables

| Table | Role | Write pattern |
|---|---|---|
| `leaderboard_snapshots` | **Current state only.** Always reflects the most recent run. Safe for any external service to query for "what does the leaderboard look like right now". | UPSERT on `username` — never grows beyond clan size. |
| `StarryBattleArchive` | **Append-only time-series.** All historical snapshots, retained for 14 days. Used internally for hourly-gain and other rate calculations. | INSERT a fresh batch every run; rows older than 14 days are pruned. |
| `c0ld_clan_snapshots` | **Canonical c0ld API table.** All new c0ld member API pulls across battles. | INSERT a fresh batch every Worker run, grouped by `snapshot_id`. |
| `c0ld_clan_current` | **Current c0ld members only.** Replaced every Worker pull. | DELETE old rows, INSERT the newest snapshot batch. |
| `c0ld_battle_runs` | **Battle metadata.** Tracks each API `battle_key`, first/last seen, and latest snapshot. | UPSERT by `clan_name,battle_key`. |
| `c0ld_clans_snapshots` | **All-clans leaderboard history.** Separate from member data. | INSERT a fresh all-clans batch every Worker run. |
| `c0ld_clans_current` | **Current all-clans leaderboard only.** | DELETE old rows, INSERT newest all-clans batch. |

---

## 3. Get your Supabase credentials

In your Supabase project go to **Project Settings → API**.

| Setting | Where to find it |
|---|---|
| `SUPABASE_URL` | "Project URL" (e.g. `https://xxxx.supabase.co`) |
| `SUPABASE_SERVICE_KEY` | "service_role" key under "Project API keys" — **keep this secret** |

---

## 4. Set up Discord (bot)

c0ld Bot uses the Discord **bot REST endpoint** (not webhooks) so it can render
COLD-style Components V2 Container layouts. To set it up:

1. Register an application at https://discord.com/developers/applications.
2. In the **Bot** tab, click **Reset Token** and copy the token.
3. In the **OAuth2 → URL Generator** tab, select scope `bot` and permissions
   `Send Messages` + `Embed Links`. Open the generated URL and invite the bot
   to your server.
4. Enable Developer Mode in Discord (User Settings → Advanced → Developer Mode),
   right-click your target channel, and **Copy Channel ID**.
5. Add these two repo secrets:
   - `DISCORD_BOT_TOKEN` — the bot token from step 2 (no `Bot ` prefix)
   - `DISCORD_CHANNEL_ID` — the channel ID from step 4
6. Trigger the workflow once. The bot will POST 3 messages and log their IDs.
   Copy the IDs into a third secret `DISCORD_MESSAGE_IDS` (comma-separated, in order).
   Subsequent runs will PATCH those messages in place.

**Why not webhooks?** Webhook execute endpoints don't support Components V2
(`flags: 32768`); they return `50006 Cannot send an empty message`. See the
comment block at the top of `postDiscord()` in `ingest.js`.

---

## 5. Add secrets to GitHub

In this repository go to **Settings → Secrets and variables → Actions → New repository secret** and add:

| Secret name | Value |
|---|---|
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_SERVICE_KEY` | Your Supabase service-role key |
| `DISCORD_BOT_TOKEN` | Your Discord bot token (no `Bot ` prefix) |
| `DISCORD_CHANNEL_ID` | Your Discord channel snowflake ID |

> **Optional:** You can also add `CLAN_NAME` (default: `c0ld`) and `TOP_N`
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
       ├─ Fetch clan data from biggamesapi.io/api/clan/c0ld
       ├─ Read snapshot from ~60 min ago from StarryBattleArchive  →  compute 60m gains
       ├─ Read previous snapshot from StarryBattleArchive          →  compute last-gain delta
       ├─ Append new snapshot batch to StarryBattleArchive
       ├─ Upsert current state into leaderboard_snapshots
       ├─ Prune StarryBattleArchive rows older than 14 days
       ├─ Update README.md leaderboard table
       └─ POST Discord bot message (Components V2)
```

### StarryBattleArchive

`StarryBattleArchive` is the **append-only time-series** table. Every ingest run inserts a fresh batch of rows (one row per member) with a `fetched_at` timestamp. All gain and rate calculations (1h gain, last-gain delta, and any future rates) read from this table.

Rows are automatically pruned after **14 days** (`KEEP_HOURS = 336`) — 14 days is the maximum length of any clan battle, so any battle started at the beginning of the window will still have full history available.

`leaderboard_snapshots` is kept as the **current-state** table. It contains exactly one row per active member (upserted every run) and never grows past clan size. Any external service that wants "what does the leaderboard look like right now" should query this table.

### Discord Components V2 layout

Three messages are posted — one per page — using the **bot REST endpoint** with `flags: 1 << 15` (Components V2). Each message contains a single Container component (type 17) with gold accent color (`#f5a623`).

The Container holds:

- **Page 1 only:** TextDisplay `# Starry Battle Rankings` heading, then a TextDisplay with relative timestamps (`Last Update: <t:unix:R>  🕒  Next Update: <t:unix:R>`), then a Separator.
- **All pages:** One TextDisplay per row of 3 members. Each row uses a 3-column markdown layout:

  ```
  **1. Name**  │  **2. Name**  │  **3. Name**
  ⭐ Pts: **5.5K**  1h: **89**  │  ⭐ Pts: **5.4K**  1h: **89**  │  ⭐ Pts: **5.3K**  1h: **89**
  ```

- **Last page only:** A Separator, then a small TextDisplay footer (`-# Created by Cinnamowopal • Updated: MM/DD/YYYY at H:MM AM/PM UTC`).

The `Next Update` timestamp is computed by rounding the current time up to the next
`UPDATE_INTERVAL_MIN`-minute boundary. Update both the workflow cron and the
`UPDATE_INTERVAL_MIN` constant in `ingest.js` if you change the cadence.

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
