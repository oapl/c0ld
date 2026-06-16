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
| `CURRENT_BATTLE_NAME` | `Backrooms2026` |
| `AUTO_DETECT_BATTLE` | `false`; set to `true` to let the Worker pick the active/latest API battle automatically. |
| `CURRENT_BATTLE_DISPLAY_NAME` | Optional override. If blank, the Worker uses the API battle name or prettifies the battle key. |
| `CURRENT_BATTLE_END_ISO` | Optional override. If blank, the Worker reads the API end timestamp when present. |
| `SITE_ORIGINS` | `https://oapl.github.io` |
| `SUPABASE_URL` | `https://YOUR-PROJECT.supabase.co` |
| `PUBLIC_CACHE_SECONDS` | `30` |
| `RETENTION_HOURS` | `336` |
| `ROBLOX_USERNAME_LOOKUPS` | `true` |
| `INGEST_CLANS_LEADERBOARD` | `true` |
| `CLAN_RANK_TOP_N` | `100` |

Battle start/end values from the Big Games API can be ISO strings, Unix seconds, Unix milliseconds, or numeric strings. The Worker stores them as `timestamptz` ISO values in Supabase. If `AUTO_DETECT_BATTLE=true`, the Worker chooses the active/latest battle object from the API and stores that battle key in `battle_key`.

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
supabase/migrations/008_c0ld_servers.sql
```

Then create/deploy a Worker such as:

```text
c0ld-servers
```

Paste in:

```text
cloudflare/c0ld-servers-worker.js
```

Required secrets:

| Secret | Purpose |
|---|---|
| `SUPABASE_URL` | Supabase project URL. |
| `SUPABASE_SERVICE_KEY` | Supabase service role key. |
| `SESSION_SECRET` | Same exact value used by the `c0ldauth` Worker. Allows Discord-verified submissions. |
| `SERVERS_ADMIN_TOKEN` | Separate long random string for approving/declining submissions. |

Optional vars:

| Variable | Purpose |
|---|---|
| `SITE_ORIGINS` | `https://oapl.github.io` |
| `SERVER_SUBMISSION_WEBHOOK_URL` | Private review-channel webhook. Uploaded video files are posted there and the returned Discord attachment URL is stored with the submission. |

Useful endpoints:

| Endpoint | Purpose |
|---|---|
| `GET /api/servers` | Public approved server rows for `servers.html` and `server.html`. |
| `POST /api/servers/submit` | Discord-session-protected submission endpoint. |
| `GET /api/admin/submissions?status=pending` | Admin list of pending submissions. |
| `POST /api/admin/submissions/{id}/approve` | Admin approval. Updates the matching server row when the share code already exists. |
| `POST /api/admin/submissions/{id}/decline` | Admin decline. |
| `POST /api/admin/servers/{server_number}/players` | Admin/player-source endpoint to report current players. Logs `possible_compromised_server` when players are present but none match C0LD or WMSY. |

Example approval:

```powershell
$token = "YOUR_SERVERS_ADMIN_TOKEN"
$worker = "https://c0ld-servers.opal-dde.workers.dev"

Invoke-RestMethod "$worker/api/admin/submissions?status=pending" `
  -Headers @{ Authorization = "Bearer $token" }

Invoke-RestMethod -Method Post "$worker/api/admin/submissions/SUBMISSION_ID/approve" `
  -Headers @{ Authorization = "Bearer $token" } `
  -ContentType "application/json" `
  -Body '{"reviewed_by":"opal"}'
```

Roblox server share links do not, by themselves, expose a reliable current
player list to the static page. The Worker has the storage and annotation path
ready, but the live player list still needs a trusted reporter/source to call
`/api/admin/servers/{server_number}/players`.

## Live Clan Lookup Worker

`live-clan-lookup-worker.js` is a replacement for the current live clan lookup
Worker used by `live-clan.html`. It returns the same payload shape, but also
stores the latest successful lookup in Supabase and falls back to that cache
if the upstream API is temporarily unavailable.

Run this Supabase migration:

```text
supabase/migrations/009_live_clan_lookup_cache.sql
```

Then paste `cloudflare/live-clan-lookup-worker.js` into the existing
`ps99-live-clan` Worker, or deploy a new Worker and update `WORKER_URL` in
`live-clan.html`.
