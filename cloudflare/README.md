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

Then update these constants in `pages/servers/servers.html`,
`pages/servers/server.html`, and `pages/tools/macros.html`:

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
supabase/migrations/019_clan_activity.sql
supabase/migrations/021_ps99_version_history.sql
supabase/migrations/024_home_awards_rpc.sql
```

It creates:

| Name | Type | Purpose |
|---|---|---|
| `c0ld_clan_snapshots` | table | Append-only c0ld member history, separated by `battle_key`. |
| `c0ld_clan_current` | table | Latest c0ld member snapshot only. Replaced every Worker pull. |
| `c0ld_battle_runs` | table | Battle metadata. New API battle keys are tracked here automatically. |
| `c0ld_clans_snapshots` | table | Append-only all-clans leaderboard history. |
| `c0ld_clans_current` | table | Latest all-clans leaderboard only. Replaced every clans pull. |
| `c0ld_clan_activity_roster_snapshots` | table | Append-only roster snapshots for top-clan activity tracking. |
| `c0ld_clan_activity_current` | table | Latest tracked top-clan rosters. |
| `get_c0ld_home_awards` | function | Calculates the six full-battle home awards in Postgres and returns one compact summary. |
| `c0ld_clan_activity_events` | table | Detected joins, leaves/kicks, promotions, demotions, kick-state changes, and rank changes. |
| `c0ld_clan_activity_summary` | table | Per-clan activity counters for `clans-activity.html`. |
| `c0ld_ps99_places` | table | Watched PS99 places and their latest known place version. |
| `c0ld_ps99_version_events` | table | Append-only PS99 place version change catalog for `ps99-version-history.html`. |

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
| `SITE_ORIGINS` | `https://oapl.github.io,https://c0ld-clan.com,https://www.c0ld-clan.com` |
| `SUPABASE_URL` | `https://YOUR-PROJECT.supabase.co` |
| `PUBLIC_CACHE_SECONDS` | `30` |
| `CURRENT_CACHE_SECONDS` | Optional. Recommended `60`; cache `/api/current` separately because it is the slowest public endpoint. |
| `CLANS_CURRENT_CACHE_SECONDS` | Optional. Recommended `60`; cache `/api/clans/current`. |
| `GLOBAL_CURRENT_CACHE_SECONDS` | Optional. Recommended `120`; cache `/api/global/current`. |
| `GLOBAL_LEADERBOARD_FAST_CACHE_SECONDS` | Optional. Recommended `120`; cache the first fast `/api/global/leaderboard?gains=false` response. |
| `GLOBAL_LEADERBOARD_CACHE_SECONDS` | Optional. Recommended `300`; cache the heavier global leaderboard response with gain columns. |
| `SNAPSHOT_RETENTION_HOURS` | Optional. Leave blank/omit to preserve archived battle snapshots. Set a positive hour count only if you intentionally want rolling pruning. |
| `HISTORY_MAX_HOURS` | Optional. Defaults to `100000`; caps `/api/history` and `/api/clans/history` lookback requests. |
| `ROBLOX_USERNAME_LOOKUPS` | `true` |
| `INGEST_CLANS_LEADERBOARD` | `true` |
| `CLAN_RANK_TOP_N` | `200`; number of clan battle ranks to store. |
| `CLAN_BATTLES_SCAN_LIMIT` | Optional fallback scan size for `/api/clans/battles`. Defaults to `20000`; keep this low enough to avoid Cloudflare subrequest limits. |
| `INGEST_GLOBAL_RANKS` | Optional. Defaults to `false`. Set to `true` after running migrations `016` and `017`. |
| `GLOBAL_RANK_SCHEDULE_MINUTES` | Optional. Defaults to `30`; starts a new global scan on this interval boundary. Keep the Cloudflare cron at `*/5 * * * *` so running scans continue on the in-between ticks until finished. |
| `GLOBAL_RANK_SCHEDULE_OFFSET_MINUTES` | Optional. Defaults to `29`. Offset inside the schedule interval. With `GLOBAL_RANK_SCHEDULE_MINUTES=30` and the recommended shifted five-minute cron, fresh scans start at `:29` and `:59`, one minute before each half-hour boundary. |
| `GLOBAL_RANK_CLAN_SCAN_LIMIT` | Optional. Defaults to `500`; number of ranked clans to inspect. Global ranks are calculated from every unique player found inside those scanned clans. |
| `GLOBAL_RANK_CLAN_PAGE_SIZE` | Optional. Defaults to `100`; ranked clans requested per `/api/clans` page. |
| `GLOBAL_RANK_CLANS_PER_RUN` | Optional. Defaults to `25`; fallback maximum clan detail pulls per Worker invocation when no per-shard value is set. |
| `GLOBAL_RANK_SHARD_COUNT` | Optional. Defaults to `1`. Use `10` to split a Top 500 scan into ten fixed 50-clan shards. |
| `GLOBAL_RANK_SHARD_CONCURRENCY` | Optional. Defaults to `1`. Number of active shards processed at the same time. Use `10` for the one-pass Top 500 configuration below. |
| `GLOBAL_RANK_CLANS_PER_SHARD_RUN` | Optional. If set, each active shard processes this many clans per invocation. Set it to the shard size (`50` for ten Top 500 shards) to eliminate 5-minute resume gaps. |
| `GLOBAL_RANK_CANDIDATE_CLAN_BATCH_SIZE` | Optional. Defaults to `10`; number of completed clan detail pulls combined before candidate rows are written to Supabase. |
| `GLOBAL_RANK_CLAN_DELAY_MS` | Optional. Defaults to `1000`; delay between clan detail pulls to avoid hammering the API. |
| `GLOBAL_RANK_RETRY_ATTEMPTS` | Optional. Defaults to `6`; repeated failures abort the run instead of skipping a range. |
| `GLOBAL_RANK_RETRY_BASE_MS` | Optional. Defaults to `15000`; retry backoff base in milliseconds. |
| `GLOBAL_RANK_RETENTION_HOURS` | Optional. Defaults to `24`; completed global-rank run data older than this is pruned while the battle/update is active. |
| `GLOBAL_RANK_RETENTION_ENABLED` | Optional. Defaults to `true`; set `false` to disable global-rank run cleanup. |
| `GLOBAL_RANK_EVENT_NAME` | Optional legacy display override such as `LunarBattle2026`. |
| `GLOBAL_RANK_LEADERBOARD_LABEL` | Optional leaderboard placement label, such as `Update 84 Leaderboard`; preferred for profile Leaderboard History. |
| `PS99_UPDATE_LABEL` / `PS99_UPDATE_NUMBER` | Optional fallback for global leaderboard labels when `GLOBAL_RANK_LEADERBOARD_LABEL` is blank. |
| `PLAYER_REWARD_CUTOFF_RANKS` | Optional comma-separated `/api/reward-cutoffs?type=players` tiers. Defaults to `3,100,1000,1050,1150,6150,30000`. |
| `CLAN_REWARD_CUTOFF_RANKS` | Optional comma-separated `/api/reward-cutoffs?type=clans` tiers. Defaults to `1,3,10,30,50,250,500`. |
| `INGEST_CLAN_ACTIVITY` | Optional. Defaults to `false`. Set to `true` after running migration `019`. |
| `CLAN_ACTIVITY_TOP_N` | Optional. Defaults to `100`; number of top clans to inspect for roster/activity changes. |
| `CLAN_ACTIVITY_CONCURRENCY` | Optional. Defaults to `8`; number of top-clan detail pulls to run at once during activity scans. |
| `CLAN_ACTIVITY_SCHEDULE_MINUTES` | Optional. Defaults to `30`; starts a fresh activity scan on this interval. |
| `CLAN_ACTIVITY_SCHEDULE_OFFSET_MINUTES` | Optional. Defaults to `0`; offset inside the activity schedule interval. |
| `CLAN_ACTIVITY_MIN_SNAPSHOT_INTERVAL_MINUTES` | Optional. Defaults to `25`; skips activity ingests when the latest roster snapshot for the same battle is newer than this. Use `bypass_recent=1` on a protected manual URL only when you intentionally want to override it. |
| `CLAN_ACTIVITY_CLAN_DELAY_MS` | Optional. Defaults to `250`; delay between clan detail pulls during activity scans. |
| `INGEST_PS99_VERSION_HISTORY` | Optional. Defaults to `false`. Set to `true` after running migration `021` to catalog PS99 place version changes. |
| `PS99_UNIVERSE_ID` | Optional. Defaults to `3317771874`. |
| `PS99_ROOT_PLACE_ID` | Optional. Defaults to `8737899170`. |
| `PS99_REFRESH_PLACE_LIST` | Optional. Defaults to `true`; lets the Worker refresh the watched PS99 place list from Roblox before checking versions. |
| `PS99_VERSION_SCHEDULE_MINUTES` | Optional. Defaults to `5`; controls how often scheduled version checks run. |
| `PS99_VERSION_SCHEDULE_OFFSET_MINUTES` | Optional. Defaults to `0`; offset inside the PS99 version schedule interval. |
| `PS99_VERSION_PLACE_DELAY_MS` | Optional. Defaults to `0`; delay between watched place version checks. |
| `PS99_VERSION_HISTORY_CACHE_SECONDS` | Optional. Defaults to `PUBLIC_CACHE_SECONDS`; cache time for `/api/ps99/versions`. |
| `INGEST_PS99_RESTARTS` | Optional. Defaults to `false`. Set to `true` after running migration `022` to monitor coordinated PS99 public-server turnover. |
| `PS99_RESTART_BATCH_SIZE` | Optional. Defaults to `100`; public servers fetched from Roblox per page. Roblox accepts `10`, `25`, `50`, or `100`. |
| `PS99_RESTART_PAGE_COUNT` | Optional. Defaults to `5`; public server-list pages checked per one-minute observation before a tracked ID is considered missing. |
| `PS99_RESTART_SAMPLE_SIZE` | Optional. Defaults to `10`; persistent high-occupancy public-server IDs used as the reference sample. |
| `PS99_RESTART_CONFIRMATIONS` | Optional. Defaults to `2`; consecutive one-minute observations required before a restart event is confirmed. |
| `PS99_RESTART_REQUIRE_VERSION_CORRELATION` | Optional. Defaults to `true`; suppresses server-turnover restart events unless they line up with a PS99 place version change or recent version event. |
| `PS99_RESTART_COOLDOWN_MINUTES` | Optional. Defaults to `10`; stabilization period after a confirmed restart before a new reference sample is registered. |
| `PS99_RESTART_CACHE_SECONDS` | Optional. Defaults to `PUBLIC_CACHE_SECONDS`; cache time for `/api/ps99/restarts`. |
| `PS99_ALERT_ROLE_ID` | Optional Discord role ID to mention when a PS99 place update or confirmed restart is detected. |
| `CW_BOT_IMPORT_ENABLED` | Optional. Defaults to `false`. Set to `true` after running migration `025` to allow profile-page CW_Bot message-link imports. |
| `CW_BOT_USER_ID` | Optional. Defaults to `1219229814150398003`; Discord user/app ID that imported messages must be authored by. |
| `CW_BOT_IMPORT_GUILD_IDS` | Optional comma-separated allowlist of Discord server IDs accepted for CW_Bot imports. |
| `CW_BOT_IMPORT_CHANNEL_IDS` | Optional comma-separated allowlist of Discord channel IDs accepted for CW_Bot imports. |
| `CW_BOT_IMPORT_REQUIRE_ADMIN` | Optional. Defaults to `false`; when `true`, imports require `INGEST_ADMIN_TOKEN`. |
| `CW_BOT_IMPORT_AUTO_APPROVE` | Optional. Defaults to `false`; when `false`, imported rows are saved as `pending` in `c0ld_external_player_history` until reviewed. |
| `CW_BOT_IMPORT_PREVENT_OVERWRITE` | Optional. Defaults to `true`; skips a battle already present in CW_Bot imported history. Set to `false` to allow the CW_Bot source row to be inserted or updated. First-party tracked history is always protected regardless of this setting. |
| `OPENAI_API_KEY` | Optional secret. Enables image OCR when the CW_Bot message is image-only. |
| `CW_BOT_OCR_MODEL` | Optional. Model used for OCR. Defaults to `gpt-5.6`. |
| `BIG_BOT_IMPORT_ENABLED` | Optional. Enables text-only Big Bot history imports. Falls back to `CW_BOT_IMPORT_ENABLED` when unset. |
| `BIG_BOT_USER_ID` | Optional. Defaults to `920446937986129960`, the official Big Bot Discord user/app ID. |
| `BIG_BOT_IMPORT_GUILD_IDS` | Optional comma-separated Big Bot server allowlist. Falls back to `CW_BOT_IMPORT_GUILD_IDS`. |
| `BIG_BOT_IMPORT_CHANNEL_IDS` | Optional comma-separated Big Bot channel allowlist. Falls back to `CW_BOT_IMPORT_CHANNEL_IDS`. |
| `BIG_BOT_IMPORT_REQUIRE_ADMIN` | Optional. Falls back to `CW_BOT_IMPORT_REQUIRE_ADMIN`. |
| `BIG_BOT_IMPORT_AUTO_APPROVE` | Optional. Falls back to `CW_BOT_IMPORT_AUTO_APPROVE`. |
| `BIG_BOT_IMPORT_PREVENT_OVERWRITE` | Optional. Defaults to `true`; skips a battle already present in Big Bot imported history. Set to `false` to allow the Big Bot source row to be inserted or updated. First-party tracked history is always protected regardless of this setting. |

Battle start/end values from the Big Games API can be ISO strings, Unix seconds, Unix milliseconds, or numeric strings. The Worker stores them as `timestamptz` ISO values in Supabase. If `AUTO_DETECT_BATTLE=true`, the Worker first matches the active battle key or display name reported by the API, then falls back to the latest active-looking battle object from the clan response, and stores that resolved key in `battle_key`.

When `SKIP_ENDED_BATTLE_INGEST=true`, scheduled pulls can stay enabled permanently. The Worker checks active battle metadata before writing; ended/not-started battles return `skipped: true` and `rows_inserted: 0`. For deliberate backfills, add `?force=1` to a protected manual ingest URL.

### Secrets

| Secret | Purpose |
|---|---|
| `SUPABASE_SERVICE_KEY` | Supabase service role key. Required for table writes. |
| `INGEST_ADMIN_TOKEN` | Any long random string. Required for manual ingest requests. |
| `PS99_ALERT_WEBHOOK_URL` | Discord webhook used for PS99 place-version and confirmed-restart alerts. Store this as a secret. |
| `DISCORD_BOT_TOKEN` | Discord bot token. Required for CW_Bot message-link imports so the Worker can fetch the linked message. |
| `OPENAI_API_KEY` | Optional OpenAI API key for CW_Bot image OCR. Store this as a secret. |

The PS99 version collector does not require a Roblox cookie or Open Cloud key. It discovers places from the public universe-place catalog, finds the highest existing asset-delivery version, and uses the public asset `Updated` value as the publish timestamp. Verified lower-bound hints make the first PS99 scan fast; newly discovered places fall back to an exponential-and-binary version search.

The public Roblox server list does not include creation time or true per-server place version, and this Worker does not have a public direct "status by job ID" endpoint for PS99. The restart detector therefore pages through the public server list, matches persisted server IDs when they appear in those pages, refreshes individually missing IDs during normal churn, and only starts confirmation when all tracked IDs disappear together. The displayed sampled version is the known place version when the server ID was first registered; the detector intentionally preserves different sampled-version cohorts when they remain visible and seeds one current-version server when a new place version appears. By default, confirmed restart events also require correlation with a PS99 place version change so transient public-list misses are suppressed instead of recorded as restarts.

## Scheduled pulls

The Wrangler example includes:

```toml
[triggers]
crons = ["4,9,14,19,24,29,34,39,44,49,54,59 * * * *", "* * * * *"]
```

The five-minute grid continues the existing clan, activity, global-rank, and PS99 version jobs. The every-minute trigger is routed only to the lightweight PS99 restart detector. In the Cloudflare dashboard, add both cron triggers under the Worker trigger settings if you are not using Wrangler.

Do not reduce the Cloudflare cron itself to only two runs per hour. The Worker uses `GLOBAL_RANK_SCHEDULE_MINUTES=30` and `GLOBAL_RANK_SCHEDULE_OFFSET_MINUTES=29` to start fresh scans at `:29` and `:59`. The intervening five-minute ticks remain available to resume a running scan after a transient failure without starting extra completed scans.

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
| `/api/history?hours=24` | Recent raw snapshot rows from the canonical table. Add `user_id=123&all_battles=true` to fetch one player's rows across every battle in one request. |
| `/api/clans/ingest` | Manual protected all-clans ingest. `POST` only. |
| `/api/clans/current` | Latest all-clans leaderboard from Supabase. |
| `/api/clans/history?hours=24` | Recent raw all-clans snapshot rows. |
| `/api/global/ingest` | Manual protected global rank scan. `POST` only. Scans ranked clans in chunks and resumes a running scan unless `?force=1` is used. |
| `/api/global/status` | Latest global-rank run plus shard progress. Useful for checking whether scheduled sharding is still resumable. |
| `/api/global/current` | Cached c0ld global ranks for the website leaderboard column. |
| `/api/global/search?q=Cinnamowopal` | Cached global rank lookup for Discord `/search` commands. It can return any player found in the latest global clan scan, not only c0ld members. |
| `/api/external-history?user_id=123&source=cw_bot` | Approved external history rows for a player. Non-approved statuses require the admin token. |
| `/api/external-history/cwbot/import` | Imports a real CW_Bot Discord message link for a profile. `POST` JSON with `user_id`, optional `username`, and `message_url`. |
| `/api/external-history/bigbot/import` | Imports the current page of an official Big Bot Clan Battle History message. For paginated results, advance the Discord message and submit the same link again; known battles are skipped. |
| `/api/reward-cutoffs?type=players` | Current reward cutoff points for configured player or clan tiers. Use `type=clans` for clan reward ranks. |
| `/api/clans/activity/ingest` | Manual protected top-clan activity scan. `POST` only. Add `?force=1` for deliberate testing/backfill. |
| `/api/clans/activity/summary` | Latest top-clan activity counters for `clans-activity.html`. |
| `/api/clans/activity/detail?clan=c0ld` | One clan's current roster plus clan and rank activity feeds. |
| `/api/clans/activity/feed` | All-clans activity blotter split into clan activity and rank activity. |
| `/api/ps99/versions/ingest` | Manual protected PS99 place-version ingest. `POST` only. |
| `/api/ps99/versions` | Public PS99 place version catalog for `ps99-version-history.html`. |
| `/api/ps99/restarts/ingest` | Manual protected PS99 restart-detector observation. `POST` only. |
| `/api/ps99/restarts` | Public PS99 restart detector state and confirmed event history for `ps99-restart-tracker.html`. |
| `/api/ps99/ccu?limit=180` | Public one-minute PS99 universe CCU samples used as restart-audit context. |
| `/api/ps99/alerts/test?type=both` | Protected end-to-end preview of the Discord PS99 version and/or restart alerts. Accepts `version`, `restart`, or `both`; restart tests also publish a five-minute webpage audio-test signal without creating a confirmed restart-history record. `POST` only. |

Clan activity tracking needs one baseline roster snapshot before it can detect
joins, leaves, promotions, demotions, kick usage, or rank changes. After running
migration `019` and deploying the Worker, seed that baseline with:

```powershell
Invoke-RestMethod -Method Post `
  -Uri "https://c0ld-clan-api-worker.opal-dde.workers.dev/api/clans/activity/ingest?force=1" `
  -Headers @{ Authorization = "Bearer $token" }
```

The first pull establishes `starting_members`; later pulls compare against the
previous current roster and append activity events.

To seed PS99 version history after running migration `021`, run:

```powershell
Invoke-RestMethod -Method Post `
  -Uri "https://c0ld-clan-api-worker.opal-dde.workers.dev/api/ps99/versions/ingest?force=1" `
  -Headers @{ Authorization = "Bearer $token" }
```

To register the first ten-server restart sample after running migration `022`, run:

```powershell
Invoke-RestMethod -Method Post `
  -Uri "https://c0ld-clan-api-worker.opal-dde.workers.dev/api/ps99/restarts/ingest" `
  -Headers @{ Authorization = "Bearer $token" }
```

Run migration `023_ps99_ccu_monitor.sql` before deploying CCU monitoring. Once
installed, each one-minute restart observation also stores the Roblox universe
`playing` count. CCU failures are recorded as audit context but never block or
influence restart detection.

To preview the Discord alerts without creating fake version or restart history, run:

```powershell
Invoke-RestMethod -Method Post `
  -Uri "https://c0ld-clan-api-worker.opal-dde.workers.dev/api/ps99/alerts/test?type=both" `
  -Headers @{ Authorization = "Bearer $token" }
```

Change `type=both` to `type=version` or `type=restart` to preview only one alert.

To compare global-rank scan configs, deploy the Worker and run:

```powershell
.\scripts\watch-global-rank-status.ps1 `
  -WorkerUrl "https://c0ld-clan-api-worker.opal-dde.workers.dev" `
  -OutputPath ".\global-rank-status-log.csv"
```

`/api/global/status` reports `timing.started_at`, `timing.finished_at`, `timing.percent_complete`, `timing.active_clans_per_minute`, and `timing.estimated_finish_at`. The watcher writes those snapshots to CSV so shard counts, per-shard clan counts, and delays can be compared cleanly.

The Big Games API does not expose the player-level global leaderboard directly.
The global rank scanner derives it by paging `/api/clans` sorted by clan points,
pulling each clan detail, collecting current battle contribution rows, and
sorting all candidate players by points. With the default Top 500 clan scan,
the `total_global_players` value is the unique player count found in those 500
clans, which powers Discord output such as "Global Rank: #171 of 34.08k" and
"Better than 99.50% of players." It does not stop early when all c0ld members
are found. It finalizes when `GLOBAL_RANK_CLAN_SCAN_LIMIT` is reached or the
clan leaderboard is exhausted.

After a global rank scan finalizes, the Worker prunes old completed scan data.
While the same battle/update is active, it keeps a rolling
`GLOBAL_RANK_RETENTION_HOURS` window. Once a battle/update is no longer current
or its stored end time has passed, cleanup keeps the newest successful run as
the final historical snapshot and deletes the older run/candidate/history/shard
rows for that group.

For the fastest controlled Top 500 pull, use one-pass sharding. With:

```text
GLOBAL_RANK_CLAN_SCAN_LIMIT=500
GLOBAL_RANK_CLAN_PAGE_SIZE=100
GLOBAL_RANK_SHARD_COUNT=10
GLOBAL_RANK_SHARD_CONCURRENCY=10
GLOBAL_RANK_CLANS_PER_SHARD_RUN=50
GLOBAL_RANK_CANDIDATE_CLAN_BATCH_SIZE=10
GLOBAL_RANK_CLAN_DELAY_MS=750
```

the Worker creates ten fixed 50-clan shards. The first five are:

```text
Shard 0: ranks 1-50
Shard 1: ranks 51-100
Shard 2: ranks 101-150
Shard 3: ranks 151-200
Shard 4: ranks 201-250
```

All shards write candidates into the same `run_key`; the Worker finalizes the
global ranks only after every shard is complete. Batched candidate writes keep
the one-pass scan below the request count produced by one Supabase write per
clan. Completed consumers select by scan start time, so an older slow request
cannot replace a newer complete result merely by finishing later.

## Discord `/search`, `/history`, `/version`, and `/rewards` Worker

`discord-search-interactions-worker.js` is the Cloudflare-only Discord command
Worker. It does not use a Gateway bot process. Discord sends slash command
interactions to the Worker over HTTPS, and the Worker reads cached global-rank
data from `c0ld-clan-api-worker`.

Create a separate Cloudflare Worker, for example:

```text
c0ld-discord-search
```

Paste in:

```text
cloudflare/discord-search-interactions-worker.js
```

Use `wrangler-discord-search.toml.example` as the variable reference if
deploying through Wrangler.

Required Worker variables:

| Variable | Purpose |
|---|---|
| `CLAN_API_BASE` | Base URL for `c0ld-clan-api-worker`, such as `https://c0ld-clan-api-worker.opal-dde.workers.dev`. |
| `GLOBAL_SCAN_CLAN` | Usually `c0ld`. Selects which global scan cache to read; it does not restrict results to c0ld members. |
| `DISCORD_APPLICATION_ID` | Discord application/client ID. Required for the admin command-registration endpoint. |
| `DISCORD_GUILD_ID` | Optional test server ID. Guild commands appear much faster than global commands. |
| `DISCORD_EPHEMERAL_RESPONSES` | Optional. Set `true` to make successful `/search` and `/history` replies visible only to the user. |
| `DISCORD_ALLOWED_ROLE_IDS` | Optional comma-separated role IDs allowed to use `/search` and `/history`, such as `1489032328855556096,1501632370082840576`. Leave blank to allow everyone. |
| `LEAGUE_API_BASE` | Optional base URL for League History. Defaults to `https://yamo-league-api-worker.opal-dde.workers.dev`. |
| `PROFILE_DATA_BASE` | Optional base URL for first-party static player history. Defaults to `https://c0ld-clan.com/Data/players`. |
| `SITE_BASE_URL` | Optional site origin used to expand relative avatar URLs. Defaults to `https://c0ld-clan.com`. |
| `HISTORY_IMAGE_RESPONSES` | Optional. Defaults to `true`; renders all `/history` sections together in one c0ld-styled PNG. Set to `false` for the text-only response. |
| `PLAYER_REWARD_CUTOFF_RANKS` | Optional comma-separated `/rewards players` tiers. Defaults to `3,100,1000,1050,1150,6150,30000`. |
| `CLAN_REWARD_CUTOFF_RANKS` | Optional comma-separated `/rewards clans` tiers. Defaults to `1,3,10,30,50,250,500`. |
| `PLAYER_REWARD_LEADERBOARD_LABEL` | Optional full `/rewards players` header, such as `Update 88 Leaderboard`. |
| `PS99_UPDATE_LABEL` | Optional shorter player rewards header source, such as `Update 88`; the Worker appends `Leaderboard`. |
| `PS99_UPDATE_NUMBER` | Optional numeric fallback for the player rewards header, such as `88`. |

Required Worker secrets:

| Secret | Purpose |
|---|---|
| `DISCORD_PUBLIC_KEY` | Public key from Discord Developer Portal > General Information. Used to verify signed Discord interaction requests. |
| `DISCORD_BOT_TOKEN` | Bot token used only by the admin registration endpoint to create/update the slash command. |
| `REGISTER_ADMIN_TOKEN` | Your private bearer token for the command-registration endpoints. |

In the Discord Developer Portal, open the application's **General Information**
page and set the **Interactions Endpoint URL** to:

```text
https://YOUR-DISCORD-WORKER.workers.dev/discord/interactions
```

This is not the Webhooks page. Discord will immediately test the endpoint with a
PING interaction. If the public key is correct and the Worker is deployed, the
endpoint saves successfully.

Invite the application with the `applications.commands` scope. With the existing
permission integer you generated, the URL shape is:

```text
https://discord.com/oauth2/authorize?client_id=YOUR_APPLICATION_ID&permissions=84992&scope=bot%20applications.commands
```

Register or update the slash commands:

```powershell
$token = "YOUR_REGISTER_ADMIN_TOKEN"
Invoke-RestMethod -Method Post `
  -Uri "https://YOUR-DISCORD-WORKER.workers.dev/admin/register-search-command?guild_id=YOUR_GUILD_ID" `
  -Headers @{ Authorization = "Bearer $token" }

Invoke-RestMethod -Method Post `
  -Uri "https://YOUR-DISCORD-WORKER.workers.dev/admin/register-version-command?guild_id=YOUR_GUILD_ID" `
  -Headers @{ Authorization = "Bearer $token" }

Invoke-RestMethod -Method Post `
  -Uri "https://YOUR-DISCORD-WORKER.workers.dev/admin/register-rewards-command?guild_id=YOUR_GUILD_ID" `
  -Headers @{ Authorization = "Bearer $token" }

Invoke-RestMethod -Method Post `
  -Uri "https://YOUR-DISCORD-WORKER.workers.dev/admin/register-history-command?guild_id=YOUR_GUILD_ID" `
  -Headers @{ Authorization = "Bearer $token" }
```

Use `guild_id` while testing because it usually appears immediately in that
server. Omit `?guild_id=...` once you want a global command, but expect Discord's
global command cache to take longer to appear.

To hide `/search` from users without the c0ld/WMSY roles, open Discord
**Server Settings > Integrations > Oapl's C0LD Bot > /search**. Disable
`@everyone`, then allow only these role IDs:

```text
1489032328855556096
1501632370082840576
```

The Worker also enforces `DISCORD_ALLOWED_ROLE_IDS`, so users without one of
those roles are denied even if Discord still shows a cached command entry.

List registered commands:

```powershell
$token = "YOUR_REGISTER_ADMIN_TOKEN"
Invoke-RestMethod `
  -Uri "https://YOUR-DISCORD-WORKER.workers.dev/admin/commands?scope=both&guild_id=YOUR_GUILD_ID" `
  -Headers @{ Authorization = "Bearer $token" }
```

Delete old commands by name:

```powershell
$token = "YOUR_REGISTER_ADMIN_TOKEN"
Invoke-RestMethod -Method Post `
  -Uri "https://YOUR-DISCORD-WORKER.workers.dev/admin/delete-command?scope=both&guild_id=YOUR_GUILD_ID&name=machine" `
  -Headers @{ Authorization = "Bearer $token" }

Invoke-RestMethod -Method Post `
  -Uri "https://YOUR-DISCORD-WORKER.workers.dev/admin/delete-command?scope=both&guild_id=YOUR_GUILD_ID&name=stock" `
  -Headers @{ Authorization = "Bearer $token" }
```

The command users run is:

```text
/search username:Cinnamowopal
```

Player history is available with:

```text
/history username:Cinnamowopal
```

The response contains one generated c0ld history card with Clan History, League
History, and Leaderboard History stacked together. It includes every available
record without dates, pagination, or section buttons. First-party site data
always takes priority over bot imports. Set `HISTORY_IMAGE_RESPONSES=false` to
use the text-only fallback.

The plain-text PS99 version command is:

```text
/version
```

It reports the root PS99 place version, its release time, and the most recent
completed version scan. Register it through the same admin script, or call
`POST /admin/register-version-command?guild_id=YOUR_GUILD_ID` with the same
admin bearer token.

The reward cutoff commands are:

```text
/rewards players
/rewards clans
```

They post the current point minimums for the configured reward ranks. Defaults
are `3,100,1000,1050,1150,6150,30000` for players and `1,3,10,30,50,250,500` for
clans. Override with `PLAYER_REWARD_CUTOFF_RANKS` and
`CLAN_REWARD_CUTOFF_RANKS` on either Worker. For the player command header, set
`PLAYER_REWARD_LEADERBOARD_LABEL="Update 88 Leaderboard"` or
`PS99_UPDATE_LABEL="Update 88"` on the Discord Worker.

## League API Worker

`yamo-league-api-worker.js` powers the league pages, the Top 1000 leaderboard,
and the c0ld league overlap page.

Run `supabase/migrations/026_league_player_history_index.sql` in the Supabase SQL
Editor so cross-run player history lookups do not time out as the snapshot
archive grows.

Useful endpoints:

| Endpoint | Purpose |
|---|---|
| `/api/leagues/current?league=YAMO` | Latest stored member rows for one tracked league. |
| `/api/leagues/top-leagues?limit=1000` | Latest Top 1000 league leaderboard with gain projections. |
| `/api/leagues/profile?user_id=123` | Per-player league summaries grouped by league/run for profile pages. |
| `/api/leagues/c0ld-overlap?clan=c0ld&top_limit=10000&offset=0&limit=30` | Manual reassessment scan that can walk Top 10000 in chunks, compares league rosters against current c0ld clan members, and returns only matched leagues. |

The overlap endpoint is intentionally chunked. `c0ld-leagues.html` walks through
the chunks automatically so one request does not attempt hundreds of league
detail fetches at once.

League profile summaries can display an update/theme name when `LEAGUE_RUN_LABEL`
is set, such as `Tap Heroes`, or when `LEAGUE_RUN_LABELS_JSON` maps a period key
to a label. Exact keys look like `active:yamo:2026-07-11`; date-cohort wildcard
keys such as `active:*:2026-07-11` can label every league period that started on
that date unless an exact key overrides it. The public BIG Games league payload
exposes league names, IDs, points, rosters, and contribution timestamps, but not
a separate update theme, so this label is owned by the Worker config.

`c0ld-league-matches.html` is the hidden reassessment/scanner page. The normal
`c0ld-leagues.html` page uses the known c0ld overlap league list and expects the
league Worker `LEAGUE_NAMES` variable to include those leagues for scheduled
pulls.

For c0ld league overlap, avoid Worker-to-Worker HTTP when possible. Cloudflare
can return `1042` when one Worker fetches another Worker on the same zone. The
league Worker now tries `COLD_CLAN_CURRENT_TABLE` in the same Supabase project
first, then an optional Service Binding named `COLD_CLAN_API`, and only then the
`COLD_CLAN_CURRENT_URL` HTTP fallback. If your league and clan tables are in
different Supabase projects, add a Service Binding on `yamo-league-api-worker`
named `COLD_CLAN_API` pointing to `c0ld-clan-api-worker`.

The intended c0ld setup is for `yamo-league-api-worker` to use the c0ld Supabase
project, not the old NONG Leaderboard project. Create the league tables in c0ld
with `supabase/c0ld_league_tables_setup.sql`, then update the Worker's
`SUPABASE_URL` and `SUPABASE_SERVICE_KEY` to the c0ld project values.

To move existing league history out of the old NONG Supabase project, pause the
league Worker cron or set `INGEST_LEAGUES=false` and `INGEST_TOP_LEAGUES=false`,
then run:

```powershell
.\scripts\migrate-league-data-to-c0ld.ps1 `
  -SourceDbUrl "postgresql://postgres.OLD_REF:OLD_DB_PASSWORD@OLD_POOLER_HOST:5432/postgres" `
  -TargetDbUrl "postgresql://postgres.NEW_REF:NEW_DB_PASSWORD@NEW_POOLER_HOST:5432/postgres" `
  -ReplaceExisting
```

Use the Supabase **Session pooler** connection strings from each project's
Connect panel. After the copy finishes, point `yamo-league-api-worker` at the
c0ld Supabase project, deploy it, and re-enable the cron.

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
