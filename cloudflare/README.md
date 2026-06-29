# c0ld Discord Auth Worker

This Worker protects pages such as `servers.html` and `macros.html` by requiring Discord OAuth and checking roles in the C0LD Discord server.

## Required Discord setup

1. Create a Discord application in the Discord Developer Portal.
2. Add this OAuth redirect URL:
   `https://c0ld-auth.YOUR-SUBDOMAIN.workers.dev/auth/discord/callback`
3. Copy the application client ID and client secret.
4. Copy the C0LD Discord server ID.
5. Optional but recommended: add a bot to the server and store its bot token as `DISCORD_BOT_TOKEN`. When present, the Worker re-checks the member's current roles on every protected request.

## Worker setup

Copy `wrangler.toml.example` to `wrangler.toml`, then replace the filler values.

Set secrets:

```bash
wrangler secret put DISCORD_CLIENT_SECRET
wrangler secret put SESSION_SECRET
wrangler secret put DISCORD_BOT_TOKEN
```

`DISCORD_BOT_TOKEN` is optional, but recommended if role removals should take effect immediately instead of when the session expires.

Deploy:

```bash
wrangler deploy
```

Then update these constants in `servers.html`, `server.html`, and `macros.html`:

```js
const PROTECTED_API_BASE = "https://c0ld-auth.YOUR-SUBDOMAIN.workers.dev";
```

## Page access toggles

Edit `PAGE_ACCESS_JSON` in Worker variables:

```json
{
  "servers": {
    "mode": "any",
    "roles": ["1489032328855556096", "1501632370082840576"]
  },
  "macros": {
    "mode": "any",
    "roles": ["1489032328855556096", "1501632370082840576"]
  }
}
```

Useful modes:

- `none`: public page
- `any`: user needs at least one role
- `all`: user needs every listed role

## Protected data

For real privacy, do not keep protected server or macro data in public GitHub files. Point these Worker variables at private storage or a private backend:

- `SERVERS_DATA_URL`
- `MACROS_DATA_URL`

If those are empty, the Worker returns placeholder rows so the frontend can be tested.

---

# c0ld Clan API Worker

`c0ld-clan-api-worker.js` is the new Worker for pulling c0ld clan data from the Big Games API and storing it in one canonical Supabase table.

It is separate from the Discord auth Worker on purpose:

- `discord-auth-worker.js` decides who can view protected pages.
- `c0ld-clan-api-worker.js` pulls clan data, writes Supabase rows, and exposes JSON API endpoints.

## Database setup

Run this migration in Supabase SQL Editor:

```text
supabase/migrations/004_c0ld_clan_snapshots.sql
supabase/migrations/006_c0ld_current_and_battles.sql
supabase/migrations/007_c0ld_clans_leaderboard.sql
```

It creates:

| Name | Type | Purpose |
|---|---|---|
| `c0ld_clan_snapshots` | table | Append-only c0ld member history, separated by `battle_key`. |
| `c0ld_clan_current` | table | Latest c0ld member snapshot only. Replaced every Worker pull. |
| `c0ld_battle_runs` | table | Battle metadata. New API battle keys are tracked here automatically. |
| `c0ld_clans_snapshots` | table | Append-only all-clans leaderboard history. |
| `c0ld_clans_current` | table | Latest all-clans leaderboard only. Replaced every clans pull. |

The older tables can stay while the site is migrated. New Worker pulls should write to `c0ld_clan_snapshots`.

## Worker setup

Create a second Cloudflare Worker, for example:

```text
c0ld-clan-api
```

Paste in:

```text
cloudflare/c0ld-clan-api-worker.js
```

Use `wrangler-clan-api.toml.example` as the variable reference if deploying through Wrangler.

### Plaintext variables

| Variable | Example |
|---|---|
| `CLAN_NAME` | `c0ld` |
| `CURRENT_BATTLE_NAME` | `auto`; lets the Worker avoid stale hard-coded battle keys. Set this to a specific API battle key only when you intentionally want to force one battle. |
| `AUTO_DETECT_BATTLE` | `true`; lets the Worker pick the active/latest API battle automatically. Set to `false` only when you want to force `CURRENT_BATTLE_NAME`. |
| `ACTIVE_BATTLE_LOOKUP` | Optional. Defaults to `true`; reads Big Games' active battle metadata for display/start/end times. |
| `SKIP_ENDED_BATTLE_INGEST` | Optional. Defaults to `true`; cron and normal manual ingests skip without writing snapshot rows when the active battle is ended or not started. |
| `CURRENT_BATTLE_DISPLAY_NAME` | Optional override. If blank, the Worker uses the API battle name or prettifies the battle key. |
| `CURRENT_BATTLE_END_ISO` | Optional override. If blank, the Worker reads the API end timestamp when present. |
| `SITE_ORIGINS` | `https://oapl.github.io` |
| `SUPABASE_URL` | `https://YOUR-PROJECT.supabase.co` |
| `PUBLIC_CACHE_SECONDS` | `30` |
| `RETENTION_HOURS` | `336` |
| `ROBLOX_USERNAME_LOOKUPS` | `true` |
| `INGEST_CLANS_LEADERBOARD` | `true` |
| `CLAN_RANK_TOP_N` | `200` |

Battle start/end values from the Big Games API can be ISO strings, Unix seconds, Unix milliseconds, or numeric strings. The Worker stores them as `timestamptz` ISO values in Supabase. If `AUTO_DETECT_BATTLE=true`, the Worker first matches the active battle key or display name reported by the API, then falls back to the latest active-looking battle object from the clan response, and stores that resolved key in `battle_key`.

When `SKIP_ENDED_BATTLE_INGEST=true`, scheduled pulls can stay enabled permanently. The Worker checks active battle metadata before writing; ended/not-started battles return `skipped: true` and `rows_inserted: 0`. For deliberate backfills, add `?force=1` to a protected manual ingest URL.

### Secrets

| Secret | Purpose |
|---|---|
| `SUPABASE_SERVICE_KEY` | Supabase service role key. Required for table writes. |
| `INGEST_ADMIN_TOKEN` | Any long random string. Required for manual ingest requests. |

## Scheduled pulls

The Wrangler example includes:

```toml
[triggers]
crons = ["*/5 * * * *"]
```

That runs the Worker every 5 minutes. In the Cloudflare dashboard, add the same cron trigger under the Worker trigger settings if you are not using Wrangler.

## Manual test

After deploying, run one manual ingest:

```bash
curl -X POST "https://YOUR-WORKER.workers.dev/api/ingest" \
  -H "Authorization: Bearer YOUR_INGEST_ADMIN_TOKEN"
```

Then check the public current endpoint:

```text
https://YOUR-WORKER.workers.dev/api/current
```

Useful endpoints:

| Endpoint | Purpose |
|---|---|
| `/api/health` | Quick Worker health check. |
| `/api/ingest` | Manual protected ingest. `POST` only. |
| `/api/current` | Latest c0ld member leaderboard from Supabase. |
| `/api/history?hours=24` | Recent raw snapshot rows from the canonical table. |
| `/api/clans/ingest` | Manual protected all-clans ingest. `POST` only. |
| `/api/clans/current` | Latest all-clans leaderboard from Supabase. |
| `/api/clans/history?hours=24` | Recent raw all-clans snapshot rows. |

## WMSY hourly Discord board

`wmsy-hourly-worker.js` is the Discord image board Worker that posts the
hourly clan activity graphic. Defaults are still WMSY:

| Variable | Default |
|---|---|
| `CLAN_NAME` | `WMSY` |
| `RUNS_TABLE` | `wmsy_hourly_runs` |
| `MEMBERS_TABLE` | `wmsy_hourly_members` |
| `CLAN_ICON_URL` | Optional fallback icon URL. |

Required secrets:

| Secret | Purpose |
|---|---|
| `DISCORD_WEBHOOK_URL` | Webhook to post the generated PNG. |
| `CF_ACCOUNT_ID` | Cloudflare account ID for Browser Rendering. |
| `CF_API_TOKEN` | Cloudflare API token with Browser Rendering access. |
| `SUPABASE_URL` | Supabase project URL. |
| `SUPABASE_SERVICE_KEY` | Supabase service role key. |

The Roblox username lookup now retries failed batches, includes banned users in
the lookup response, tries individual user lookups for missing IDs, and falls
back to the previous Supabase username/display name before showing a raw user
ID. `/debug` includes `usernameLookupMisses` and `previousUsernameFallbacks`
inside `board.summary`.

## Servers Worker

`c0ld-servers-worker.js` stores approved server rows, pending submissions, and
server audit events in Supabase.

Run this Supabase migration first:

```text
supabase/migrations/008_servers.sql
```
