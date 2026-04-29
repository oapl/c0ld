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

This creates the `StarryBattleArchive` table used to store final standings of completed StarryBattle events (see [How it works end-to-end](#how-it-works-end-to-end)).

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
       ├─ Read snapshot from ~60 min ago from Supabase  →  compute 60m gains
       ├─ Insert new snapshot into Supabase
       ├─ Prune snapshots older than 48 h
       ├─ Archive completed StarryBattle standings (if applicable)
       ├─ Update README.md leaderboard table
       └─ POST Discord webhook embed
```

### StarryBattle archive

When a StarryBattle event ends, `ingest.js` automatically snapshots the final
standings (rank, username, total points) into the **`StarryBattleArchive`**
Supabase table. This happens exactly once per completed battle, identified by
a stable `battle_id` derived from the API response.

This table is separate from `leaderboard_snapshots` (which is a rolling
time-series used only for the 60-minute gain calculation and is pruned after
48 hours). `StarryBattleArchive` is never pruned and can be queried to
review historical battle results long after the battle has ended.

### Discord embed: custom emote

The `Total Points` column in the Discord embed is prefixed with the
`:gold_star:` shortcode. **This must be replaced with the full custom-emote
tag** (`<:gold_star:EMOTE_ID>`) for it to render correctly in your Discord
server. Update the TODO comment in `ingest.js` once you have the emote ID.

---

## Decommissioning the Google Sheet

Once you've confirmed a few successful runs with Supabase data you can:

1. Delete the AppScript trigger in Google Sheets.
2. Remove the `update-readme.js` file (or leave it — it is no longer called).
3. The `SOURCE_CSV_URL` in `update-readme.js` no longer needs to be maintained.
