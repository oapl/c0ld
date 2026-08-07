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

`AUTH_REQUIRED=false` leaves the hidden tool routes in temporary obscurity mode.
Set `AUTH_REQUIRED=true` when you want the Worker data routes to enforce Discord
role checks again.

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
  "officer-tools": {
    "mode": "any",
    "roles": ["1489032325009506456"]
  },
  "cw-import-gaps": {
    "mode": "any",
    "roles": ["1489032325009506456"]
  },
  "award-candidates": {
    "mode": "any",
    "roles": ["1489032325009506456"]
  },
  "wip-tools": {
    "mode": "any",
    "roles": ["1500890188526915695"]
  },
  "archive-tools": {
    "mode": "any",
    "roles": ["1500890188526915695"]
  },
  "servers": {
    "mode": "any",
    "roles": ["1500890188526915695"]
  },
  "macros": {
    "mode": "any",
    "roles": ["1500890188526915695"]
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

Run these migrations in Supabase SQL Editor:

```text
supabase/migrations/004_c0ld_clan_snapshots.sql
supabase/migrations/006_c0ld_current_and_battles.sql
supabase/migrations/007_c0ld_clans_leaderboard.sql
supabase/migrations/019_clan_activity.sql
supabase/migrations/021_ps99_version_history.sql
supabase/migrations/024_home_awards_rpc.sql
supabase/migrations/028_roblox_release_version_history.sql
supabase/migrations/044_hot_path_indexes.sql
```

`044_hot_path_indexes.sql` is a read-performance migration only. It adds targeted
indexes for member downtime windows, latest all-clans metadata reads, and
inventory snapshot item reads; it does not prune or rewrite stored history.

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
| `c0ld_roblox_release_state` | table | Latest tracked Roblox client release by binary type and channel. |
| `c0ld_roblox_release_events` | table | Append-only Roblox released-version change catalog for `roblox-version-history.html`. |

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
| `CLAN_NAMES` | Optional comma-separated clans whose member snapshots are collected by each scheduled battle-data pull. Use `c0ld,WMSY` for both website modes. |
| `WMSY_MODE_ENABLED` | Optional. Defaults to `true`; guarantees the WMSY companion feed is collected even when an older deployment still has `CLAN_NAMES=c0ld`. Set to `false` only to disable WMSY ingestion. |
| `CURRENT_BATTLE_NAME` | `auto`; lets the Worker avoid stale hard-coded battle keys. Set this to a specific API battle key only when you intentionally want to force one battle. |
| `AUTO_DETECT_BATTLE` | `true`; lets the Worker pick the active/latest API battle automatically. Set to `false` only when you want to force `CURRENT_BATTLE_NAME`. |
| `ACTIVE_BATTLE_LOOKUP` | Optional. Defaults to `true`; reads Big Games' active battle metadata for display/start/end times. |
| `SKIP_ENDED_BATTLE_INGEST` | Optional. Defaults to `true`; cron and normal manual ingests skip without writing snapshot rows when the active battle is ended or not started. |
| `BATTLE_INGEST_FINAL_PULL_GRACE_MINUTES` | Optional. Defaults to `0`; when positive, scheduled battle-data pulls may continue until battle end plus this many minutes for a final capture. |
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
| `GLOBAL_LEADERBOARD_SOURCE` | Optional. Defaults to `auto`: use the clan-derived global scan during an active Clan Battle, otherwise use the live BIG Games League-player Top 500. Set `clans` or `leagues` only to force a source while testing. The public League-player endpoint exposes 500 players, so the response marks that pool as partial rather than claiming it is the full 35–40K. |
| `SNAPSHOT_RETENTION_HOURS` | Optional. Leave blank/omit to preserve archived battle snapshots. Set a positive hour count only if you intentionally want rolling pruning. |
| `HISTORY_MAX_HOURS` | Optional. Defaults to `100000`; caps `/api/history` and `/api/clans/history` lookback requests. |
| `ROBLOX_USERNAME_LOOKUPS` | `true` |
| `MEMBER_SNAPSHOT_MIN_INTERVAL_MINUTES` | Optional. Defaults to `5`; prevents scheduled or accidental duplicate member snapshot writes for the same clan/battle when the latest snapshot is newer than this. `force=1` bypasses it. |
| `INGEST_CLANS_LEADERBOARD` | `true` |
| `CLAN_RANK_TOP_N` | `200`; number of clan battle ranks to store. |
| `CLANS_SNAPSHOT_MIN_INTERVAL_MINUTES` | Optional. Defaults to `5`; prevents scheduled or accidental duplicate all-clans leaderboard snapshot writes for the same battle when the latest snapshot is newer than this. `force=1` bypasses it. |
| `CLAN_BATTLES_SCAN_LIMIT` | Optional legacy fallback scan size for `/api/clans/battles?include_legacy=1`. Normal battle lists use `c0ld_battle_runs` metadata and do not scan raw leaderboard history. |
| `INGEST_GLOBAL_RANKS` | Optional. Defaults to `false`. Set to `true` after running migrations `016` and `017`. |
| `GLOBAL_RANK_SCHEDULE_MINUTES` | Optional. Defaults to `30`; starts a new global scan on this interval boundary. Keep the Cloudflare cron at `*/5 * * * *` so running scans continue on the in-between ticks until finished. |
| `GLOBAL_RANK_SCHEDULE_OFFSET_MINUTES` | Optional. Defaults to `0`. Offset inside the schedule interval; keep `0` with the top-of-five-minute cron when you want all battle-data pulls aligned on `:00`, `:05`, `:10`, and so on. |
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
| `GLOBAL_RANK_NAME_SCAN_LIMIT` | Optional. Defaults to `50000`; maximum latest global-rank candidate rows to scan by stored raw username/display name when Roblox username lookup is unavailable or returns no match. |
| `GLOBAL_RANK_RETENTION_HOURS` | Optional. Defaults to `24`; completed global-rank run data older than this is pruned only when global-rank retention is explicitly enabled. |
| `GLOBAL_RANK_RETENTION_ENABLED` | Optional. Defaults to `false`. Set `true` to prune temporary global-rank scan runs while preserving the newest successful final run for every clan and battle forever. |
| `GLOBAL_RANK_RETENTION_DELETE_RUNS_PER_PASS` | Optional. Defaults to `3`; caps cleanup work after each completed scan so an old backlog cannot create one large delete spike. |
| `DERIVED_SNAPSHOT_CACHE_SECONDS` | Optional. Defaults to `3600`; caches immutable gain/history calculations by snapshot ID. A new snapshot always receives a new cache key. |
| `GLOBAL_RANK_EVENT_NAME` | Optional legacy display override such as `LunarBattle2026`. |
| `GLOBAL_RANK_LEADERBOARD_LABEL` | Optional leaderboard placement label, such as `Update 84 Leaderboard`; preferred for profile Leaderboard History. |
| `PS99_UPDATE_LABEL` / `PS99_UPDATE_NUMBER` | Optional fallback for global leaderboard labels when `GLOBAL_RANK_LEADERBOARD_LABEL` is blank. |
| `PLAYER_REWARD_CUTOFF_RANKS` | Optional comma-separated `/api/reward-cutoffs?type=players` tiers. Defaults to `3,10,100,250,500,1000,10000`. |
| `CLAN_REWARD_CUTOFF_RANKS` | Fallback comma-separated `/api/reward-cutoffs?type=clans` ranks. Active-battle categories are read from BIG Games `PlacementRewards`; the fallback defaults to `1,3,10,30,50,250,500`. |
| `LEAGUE_API_BASE` | League Worker base URL used to calculate league reward cutoffs. Defaults to the production YAMO league Worker. A `LEAGUE_API_WORKER` service binding is preferred when both Workers share an account. |
| `LEAGUE_REWARD_CUTOFF_RANKS` | Optional comma-separated league reward tiers. Defaults to `1,3,15,50,100,250,2000`. |
| `REWARD_CUTOFFS_SCHEDULE_MINUTES` | Optional. Defaults to `5`; interval used to refresh the three persistent Discord posts. |
| `REWARD_CUTOFFS_SCHEDULE_OFFSET_MINUTES` | Optional. Defaults to `0`; offset inside the persistent-post schedule interval. |
| `REWARD_CUTOFFS_CHANNEL_ID` | Discord channel ID for one combined post containing player, clan, and league reward cutoffs. |
| `ROBLOX_STATUS_CHANNEL_ID` | Discord channel ID for the persistent official Roblox platform-status post. |
| `VERSIONS_CHANNEL_ID` | Discord channel ID for the persistent PS99 place and Roblox client versions post. |
| `REWARD_CUTOFFS_ROLE_ID` | Optional Discord role ID to mention on the combined cutoff post. |
| `ROBLOX_STATUS_ROLE_ID` | Optional Discord role ID to mention on the Roblox Status post. |
| `VERSIONS_ROLE_ID` | Optional Discord role ID to mention on the Versions post. |
| `ROBLOX_STATUS_API_URL` | Optional override for the official Roblox Status.io JSON endpoint. |
| `INGEST_CLAN_ACTIVITY` | Optional. Defaults to `false`. Set to `true` after running migration `019`. |
| `CLAN_ACTIVITY_TOP_N` | Optional. Defaults to `100`; number of top clans to inspect for roster/activity changes. |
| `CLAN_ACTIVITY_CONCURRENCY` | Optional. Defaults to `8`; number of top-clan detail pulls to run at once during activity scans. |
| `CLAN_ACTIVITY_SCHEDULE_MINUTES` | Optional. Defaults to `30`; starts a fresh activity scan on this interval. |
| `CLAN_ACTIVITY_SCHEDULE_OFFSET_MINUTES` | Optional. Defaults to `0`; offset inside the activity schedule interval. |
| `CLAN_ACTIVITY_MIN_SNAPSHOT_INTERVAL_MINUTES` | Optional. Defaults to `25`; skips activity ingests when the latest roster snapshot for the same battle is newer than this. Use `bypass_recent=1` on a protected manual URL only when you intentionally want to override it. |
| `CLAN_ACTIVITY_CLAN_DELAY_MS` | Optional. Defaults to `250`; delay between clan detail pulls during activity scans. |
| `INGEST_OFFLINE_ALERTS` | Optional. Defaults to `false`. Set to `true` after running offline migrations `040`, `041`, `042`, and `050` to let scheduled pulls evaluate Discord no-gain/offline pings. |
| `OFFLINE_DEFAULT_MINUTES` | Optional. Defaults to `30`; initial no-gain threshold for a guild until `/offline minutes` changes it. |
| `OFFLINE_DEFAULT_POST_RATE_MINUTES` | Optional. Defaults to `30`; initial minimum interval between repeat alerts for the same offline player. |
| `OFFLINE_ALERT_SCHEDULE_MINUTES` | Optional. Defaults to `5`; how often the clan Worker evaluates configured offline pings. Keep the Cloudflare cron at least this frequent. |
| `OFFLINE_ALERT_SCHEDULE_OFFSET_MINUTES` | Optional. Defaults to `0`; offset inside the offline alert schedule interval. |
| `OFFLINE_LOOKBACK_BUFFER_MINUTES` | Optional. Defaults to `30`; extra history read beyond the guild threshold so downtime can be calculated from stored snapshots. |
| `INGEST_PS99_VERSION_HISTORY` | Optional. Defaults to `false`. For c0ld production, keep this `true` after running migration `021` so PS99 place version checks continue outside clan battles. |
| `PS99_UNIVERSE_ID` | Optional. Defaults to `3317771874`. |
| `PS99_ROOT_PLACE_ID` | Optional. Defaults to `8737899170`. |
| `PS99_REFRESH_PLACE_LIST` | Optional. Defaults to `true`; lets the Worker refresh the watched PS99 place list from Roblox before checking versions. |
| `PS99_VERSION_SCHEDULE_MINUTES` | Optional. Defaults to `5`; controls how often scheduled version checks run. |
| `PS99_VERSION_SCHEDULE_OFFSET_MINUTES` | Optional. Defaults to `0`; offset inside the PS99 version schedule interval. |
| `PS99_VERSION_PLACE_DELAY_MS` | Optional. Defaults to `0`; delay between watched place version checks. |
| `PS99_VERSION_HISTORY_CACHE_SECONDS` | Optional. Defaults to `PUBLIC_CACHE_SECONDS`; cache time for `/api/ps99/versions`. |
| `INGEST_ROBLOX_RELEASE_VERSION_HISTORY` | Optional. Defaults to `false`. Set to `true` after running migration `028` to catalog Roblox released client version changes. |
| `ROBLOX_RELEASE_BINARY_TYPE` | Optional. Defaults to `WindowsPlayer`. |
| `ROBLOX_RELEASE_CHANNEL` | Optional. Defaults to `live`. |
| `ROBLOX_RELEASE_SCHEDULE_MINUTES` | Optional. Defaults to `5`; controls how often scheduled Roblox release checks run. |
| `ROBLOX_RELEASE_SCHEDULE_OFFSET_MINUTES` | Optional. Defaults to `0`; offset inside the Roblox release schedule interval. |
| `ROBLOX_RELEASE_VERSION_HISTORY_CACHE_SECONDS` | Optional. Defaults to `PUBLIC_CACHE_SECONDS`; cache time for `/api/roblox/versions`. |
| `INGEST_ROBLOX_FFLAGS` | Optional. Defaults to `false`. Set to `true` after migration `030` to detect changes in Roblox's public live PC client settings. |
| `ROBLOX_FFLAGS_SOURCE_URL` | Optional. Public Roblox client-settings endpoint. Defaults to the live `PCDesktopClient` settings URL. This is not a private PS99 server-flag feed. |
| `ROBLOX_FFLAGS_SCOPE_KEY` | Optional. Defaults to `pc-live`; stable key used for the stored settings baseline. |
| `ROBLOX_FFLAG_SCHEDULE_MINUTES` | Optional. Defaults to `15`; controls how often public client settings are checked. |
| `ROBLOX_FFLAG_SCHEDULE_OFFSET_MINUTES` | Optional. Defaults to `0`; offset inside the FFlag schedule interval. |
| `ROBLOX_FFLAGS_CACHE_SECONDS` | Optional. Defaults to `PUBLIC_CACHE_SECONDS`; cache time for `/api/roblox/fflags`. |
| `INGEST_PS99_DEV_BLOGS` | Optional. Defaults to `false`. Set to `true` after migration `030` to watch the official BIG Games post feed. |
| `PS99_DEV_BLOG_FEED_URL` | Optional. Defaults to `https://www.biggames.io/post`. |
| `PS99_DEV_BLOG_SCHEDULE_MINUTES` | Optional. Defaults to `15`; controls how often the official post feed is checked. |
| `PS99_DEV_BLOG_SCHEDULE_OFFSET_MINUTES` | Optional. Defaults to `0`; offset inside the dev-blog schedule interval. |
| `PS99_DEV_BLOGS_CACHE_SECONDS` | Optional. Defaults to `PUBLIC_CACHE_SECONDS`; cache time for `/api/ps99/dev-blogs`. |
| `INGEST_PS99_RESTARTS` | Optional. Defaults to `false`. For c0ld production, keep this `true` after running migration `022` so PS99 restart detection keeps running every minute. |
| `PS99_RESTART_CONFIRMATION_MODE` | Defaults to `sentinel`. In this mode the public server list is supporting evidence only and cannot create an alert. `legacy` explicitly restores the old API-only behavior. |
| `PS99_RESTART_SENTINEL_ENABLED` | Defaults to `true` when `PS99_RESTART_PROBE_TOKEN` exists. Set to `false` to pause direct-client confirmation without deleting observations. |
| `PS99_RESTART_PROBE_QUORUM` | Defaults to `3`; live clients that must change server sessions within the configured window when a version change is correlated. |
| `PS99_RESTART_PROBE_SAME_VERSION_QUORUM` | Defaults to `4`; stronger client quorum required for a restart with no place-version change. |
| `PS99_RESTART_PROBE_MACHINE_QUORUM` | Defaults to `2`; distinct machines/VMs required so one computer or network failure cannot create an alert. |
| `PS99_RESTART_PROBE_WINDOW_SECONDS` | Defaults to `600`; maximum rollout window containing the qualifying client transitions. |
| `PS99_RESTART_PROBE_STALE_SECONDS` | Defaults to `120`; a client older than this is not counted as live evidence. |
| `PS99_RESTART_PROBE_HISTORY_SECONDS` | Defaults to `1800`; observation history loaded when evaluating the latest transition for each client. |
| `PS99_RESTART_BATCH_SIZE` | Optional. Defaults to `100`; public servers fetched from Roblox per page. Roblox accepts `10`, `25`, `50`, or `100`. |
| `PS99_RESTART_PAGE_COUNT` | Optional. Defaults to `5`; public server-list pages checked per one-minute observation before a tracked ID is considered missing. |
| `PS99_RESTART_SAMPLE_SIZE` | Optional. Defaults to `10`; persistent high-occupancy public-server IDs used as the reference sample. |
| `PS99_RESTART_RECENT_VERSION_WINDOW_MINUTES` | Optional. Defaults to `60`; restart candidate cards treat PS99 version changes in this lookback window as recent-version corroboration rather than requiring an instant version flip. |
| `PS99_RESTART_INTEL_TURNOVER_PERCENT` | Optional. Defaults to `50`; public-server turnover must be at least this high to appear as a supporting review-card flag. Values below `50` are clamped to `50`, and turnover alone never opens a candidate. |
| `PS99_RESTART_CONFIRMATIONS` | Optional. Defaults to `2`; consecutive one-minute observations required before a restart event is confirmed. |
| `PS99_RESTART_REQUIRE_VERSION_CORRELATION` | Optional. Defaults to `true`; suppresses server-turnover restart events unless they line up with a PS99 place version change or recent version event. |
| `PS99_RESTART_COOLDOWN_MINUTES` | Optional. Defaults to `10`; stabilization period after a confirmed restart before a new reference sample is registered. |
| `PS99_RESTART_CACHE_SECONDS` | Optional. Defaults to `PUBLIC_CACHE_SECONDS`; cache time for `/api/ps99/restarts`. |
| `ROBLOX_UPDATES_ROLE_ID` | Optional Discord role ID mentioned only for Roblox client-release alerts. Defaults to `1529578783131177131`. |
| `PS99_UPDATES_ROLE_ID` | Optional Discord role ID mentioned only for PS99 place-version alerts. |
| `PS99_FFLAGS_ROLE_ID` | Optional Discord role ID mentioned only for public client-settings changes. |
| `PS99_RESTARTS_ROLE_ID` | Optional Discord role ID mentioned only for confirmed PS99 restart alerts. Defaults to `1529578783131177131`. |
| `PS99_DEV_BLOG_ROLE_ID` | Optional Discord role ID mentioned only for official BIG Games post alerts. |
| `CW_BOT_IMPORT_ENABLED` | Optional. Defaults to `false`. Set to `true` after running migrations `025`, `026`, and `047` to allow CW_Bot message-link imports. |
| `CW_BOT_USER_ID` | Optional. Defaults to `1219229814150398003`; Discord user/app ID that imported messages must be authored by. |
| `CW_BOT_IMPORT_GUILD_IDS` | Optional comma-separated allowlist of Discord server IDs accepted for CW_Bot imports. |
| `CW_BOT_IMPORT_CHANNEL_IDS` | Optional comma-separated allowlist of Discord channel IDs accepted for CW_Bot imports. |
| `CW_BOT_IMPORT_REQUIRE_ADMIN` | Optional. Defaults to `false`; when `true`, imports require `INGEST_ADMIN_TOKEN`. |
| `CW_BOT_IMPORT_AUTO_APPROVE` | Optional. Defaults to `false`; when `false`, imported rows are saved as `pending` in `c0ld_cwbot_history_imports` until reviewed. |
| `CW_BOT_IMPORT_PREVENT_OVERWRITE` | Optional. Defaults to `true`; skips a battle already present in CW_Bot imported history, except that the channel backfill can replace a later CW_Bot source row with an earlier CW_Bot message. Set to `false` to allow the CW_Bot source row to be inserted or updated. First-party tracked history is always protected regardless of this setting. |
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

The stop day and time come from the active battle metadata returned by the Big Games API. With `BATTLE_INGEST_FINAL_PULL_GRACE_MINUTES=0`, the Worker blocks member, clans, global-rank, and clan-activity pulls once the API battle end time is reached; the last kept pull is the latest one before the cutoff. With a positive grace value, scheduled pulls can continue until battle end plus that grace window so a final after-end snapshot can land. PS99 version scans, PS99 restart detection, and Roblox released-version checks are not battle data and continue after the battle gate closes.

### Secrets

| Secret | Purpose |
|---|---|
| `SUPABASE_SERVICE_KEY` | Supabase service role key. Required for table writes. |
| `INGEST_ADMIN_TOKEN` | Any long random string. Required for manual ingest requests. |
| `PS99_RESTART_PROBE_TOKEN` | A separate long random string shared only by the dedicated restart-sentinel reporters. |
| `ROBLOX_UPDATES_WEBHOOK_URL` | Webhook for the `roblox-updates` channel. |
| `ROBLOX_UPDATES_ROLE_ID` | Optional role to mention on Roblox client update detector posts. Defaults to `1529578783131177131`. |
| `PS99_UPDATES_WEBHOOK_URL` | Webhook for the `pet-sim-updates` channel. |
| `PS99_FFLAGS_WEBHOOK_URL` | Webhook for the `pet-sim-fflags-update` channel. |
| `PS99_RESTARTS_WEBHOOK_URL` | Webhook for the `pet-sim-restarts` channel. |
| `PS99_RESTARTS_ROLE_ID` | Optional role to mention on restart detector posts. Defaults to `1529578783131177131`. |
| `PS99_DEV_BLOG_WEBHOOK_URL` | Webhook for the `dev-blogs` channel. |
| `REWARD_CUTOFFS_WEBHOOK_URL` | Optional fallback for the combined cutoff post if no cutoff channel ID is configured. |
| `ROBLOX_STATUS_WEBHOOK_URL` | Optional fallback for the Roblox Status post if no status channel ID is configured. |
| `VERSIONS_WEBHOOK_URL` | Optional fallback for the Versions post if no versions channel ID is configured. |
| `PS99_ALERT_WEBHOOK_URL` | Legacy fallback for PS99 update and restart alerts when their dedicated secrets are absent. |
| `DISCORD_BOT_TOKEN` | Discord bot token. Used for persistent channel posts, current-role checks, Discord commands, and CW_Bot message-link imports. |

The five alert webhooks post a new Components V2 message for every real or test
event. Each new post mentions its configured role, while earlier alerts remain
in the channel as event history.
| `OPENAI_API_KEY` | Optional OpenAI API key for CW_Bot image OCR. Store this as a secret. |

The PS99 version collector does not require a Roblox cookie or Open Cloud key. It discovers places from the public universe-place catalog, finds the highest existing asset-delivery version, and uses the public asset `Updated` value as the publish timestamp. Verified lower-bound hints make the first PS99 scan fast; newly discovered places fall back to an exponential-and-binary version search.

The public Roblox server list does not include server creation time or a true
per-server place version. More importantly, a tracked server disappearing from
the pages fetched by this Worker does **not** prove that the server died. In the
default `sentinel` mode, public-list turnover is recorded only as supporting
evidence and is never allowed to create a restart alert or review candidate by
itself. Restart-intelligence cards only include a public-turnover flag at 50% or
higher, and only non-turnover signals can open a candidate.

For version rollouts, the Worker also tracks public-server **version cohorts**.
Roblox does not expose a true per-public-server place version, so this is an
inference: a public server ID is tagged with the root-place version that was
current when the Worker first saw that server ID. After a new PS99 version is
released, review cards can show whether old-version cohort server IDs are still
present, whether they fully drained out, and whether new-version cohort IDs grew.
That cohort drain can corroborate a version-migration review without treating
plain public-server turnover as a restart.

Strong confirmation comes from dedicated, otherwise-idle Roblox clients kept
inside the PS99 root place. Each Windows reporter reads its own Roblox log and
sends the directly observed server session, place, version when available, and
heartbeat time. A normal update requires three live clients across at least two
machines to move from distinct old sessions to distinct new sessions inside ten
minutes and align with the current PS99 version. A same-version restart requires
four clients. Every sentinel must have reported the old session recently, so
starting a reporter after the fact cannot be mistaken for a transition.

Apply `supabase/migrations/032_ps99_restart_sentinels.sql`, add the
`PS99_RESTART_PROBE_TOKEN` Worker secret, and deploy the Worker before starting
reporters. Use a different `ProbeId` for each Roblox client and keep each client
in the root place:

```powershell
$env:PS99_RESTART_PROBE_TOKEN = "PASTE_THE_PROBE_SECRET"
.\scripts\run-ps99-restart-sentinel.ps1 `
  -ProbeId "home-vm-1" `
  -MachineId "home-host"
```

When more than one Roblox client runs on a machine, pass that client's
`-RobloxProcessId` and `-RobloxLogPath`. Tesseract OCR is optional:
`-EnableVersionOcr` reads the bottom PS99 version strip, while the Worker still
checks every transition against the stored current root-place version. The
Discord restart alert includes the sentinel count, independent-machine count,
old/new server diversity, transition span, and version result.

## Scheduled pulls

The Wrangler example includes:

```toml
[triggers]
crons = ["*/5 * * * *", "* * * * *"]
```

The five-minute grid continues the existing clan, activity, and global-rank jobs. The every-minute trigger owns the lightweight restart detector and dispatches PS99 versions, Roblox releases, public FFlags, and official BIG Games posts only when their configured schedule is due. In the Cloudflare dashboard, add both cron triggers under the Worker trigger settings if you are not using Wrangler.

Each alert feed has its own webhook. The first successful FFlag and dev-blog poll stores a baseline without posting old items; only later changes create events and Discord messages. The FFlag collector watches publicly exposed Roblox client settings, so it can report client configuration changes but cannot see private PS99 server-side flags.

Do not reduce the Cloudflare cron itself to only two runs per hour. If you set `GLOBAL_RANK_SCHEDULE_MINUTES=30` and `GLOBAL_RANK_SCHEDULE_OFFSET_MINUTES=0`, fresh scans start at `:00` and `:30`. The intervening five-minute ticks remain available to resume a running scan after a transient failure without starting extra completed scans, and the battle-data cutoff guard prevents the `10:05` tick from queuing late battle pulls.

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
| `/api/global/leaderboard` | Automatically serves the completed clan-derived global scan during a Clan Battle or the live public League-player Top 500 when no Clan Battle is active. Use `source=clans` or `source=leagues` only to override auto-detection while testing. |
| `/api/global/search?q=Cinnamowopal` | Cached global rank lookup for Discord `/search` commands. It can return any player found in the latest global clan scan, not only c0ld members. |
| `/api/external-history?user_id=123&source=cw_bot` | Approved CW-Bot history rows from `c0ld_cwbot_history_imports`. Non-approved statuses require the admin token. A read-only fallback covers legacy rows during deployment. |
| `/api/external-history/cwbot/import` | Imports a real CW_Bot Discord message link for a profile. `POST` JSON with `user_id`, optional `username`, and `message_url`. |
| `/api/external-history/cwbot/guild-channels` | Protected Discord channel discovery for a server-wide CW-Bot history import. Returns text/announcement channels, active threads, and parents that can contain archived public threads. |
| `/api/external-history/cwbot/archived-threads` | Protected paginated discovery of public archived threads under one Discord channel. Used automatically by the guild importer. |
| `/api/external-history/cwbot/channel-scan` | Protected, read-only scanner for one page of Discord channel history. It classifies CW_Bot history responses by direct history markers or a preceding `!history username` command and returns a resumable `next_before_message_id` cursor. |
| `/api/external-history/bigbot/import` | Imports the current page of an official Big Bot Clan Battle History message. For paginated results, advance the Discord message and submit the same link again; known battles are skipped. |
| `/api/reward-cutoffs?type=players` | Current reward cutoff points for configured player or clan tiers. Use `type=clans` for clan reward ranks. |
| `/api/persistent-posts/post` | Protected `POST` endpoint that creates or edits the combined Cutoffs, Roblox Status, and Versions posts. Add `?force=1`, and optionally `&type=cutoffs`, `&type=roblox-status`, or `&type=versions`. |
| `/api/persistent-posts/status` | Protected `GET` endpoint that reports the three stored message IDs, channel IDs, message existence, and active refresh schedule. |
| `/api/clans/activity/ingest` | Manual protected top-clan activity scan. `POST` only. Add `?force=1` for deliberate testing/backfill. |
| `/api/clans/activity/summary` | Latest top-clan activity counters for `clans-activity.html`. |
| `/api/clans/activity/detail?clan=c0ld` | One clan's current roster plus clan and rank activity feeds. |
| `/api/clans/activity/feed` | All-clans activity blotter split into clan activity and rank activity. |
| `/api/ps99/versions/ingest` | Manual protected PS99 place-version ingest. `POST` only. |
| `/api/ps99/versions` | Public PS99 place version catalog for `ps99-version-history.html`. |
| `/api/roblox/versions/ingest` | Manual protected Roblox released-version ingest. `POST` only. |
| `/api/roblox/versions` | Public Roblox released-version catalog for `roblox-version-history.html`. |
| `/api/roblox/fflags/ingest` | Manual protected public Roblox client-settings observation. `POST` only. |
| `/api/roblox/fflags` | Latest public client-settings baseline and detected changes. |
| `/api/ps99/dev-blogs/ingest` | Manual protected official BIG Games post-feed observation. `POST` only. |
| `/api/ps99/dev-blogs` | Latest official BIG Games post baseline and detected posts. |
| `/api/ps99/restarts/ingest` | Manual protected PS99 restart-detector observation. `POST` only. |
| `/api/ps99/restarts` | Public PS99 restart detector state and confirmed event history for `ps99-restart-tracker.html`. |
| `/api/ps99/restart-probes` | `POST` direct client observations with `PS99_RESTART_PROBE_TOKEN`; protected `GET` returns live evidence and the current quorum decision. |
| `/api/ps99/ccu?limit=180` | Public one-minute PS99 universe CCU samples used as restart-audit context. |
| `/api/ps99/alerts/test?type=both` | Protected end-to-end preview of the Discord PS99 version and/or restart alerts. Accepts `version`, `restart`, or `both`; restart tests also publish a five-minute webpage audio-test signal without creating a confirmed restart-history record. `POST` only. |
| `/api/ps99/alerts/test?feed=all` | Protected webhook-only test for all five dedicated alert destinations. Accepts `roblox-updates`, `ps99-updates`, `ps99-fflags`, `ps99-restarts`, `ps99-dev-blogs`, or `all`. `POST` only. |

Before a full CW_Bot history-channel backfill, run migration `047`, deploy the
current clan API Worker, and then run the one-time straggler cleanup:

```text
supabase/migrations/047_cwbot_history_imports.sql
supabase/manual-cleanups/2026-07-30-move-cwbot-history-stragglers.sql
```

Migration `047` atomically copies existing `source = 'cw_bot'` rows into
`c0ld_cwbot_history_imports` before removing those copies from the shared
external-history table. Big Bot and other sources remain in
`c0ld_external_player_history`.

CW-Bot history is supplementary. `/history` keeps native snapshot data when it
exists, fills only missing rank/points fields from a matching CW-Bot battle,
and adds a CW-Bot battle only when native history has no matching record.

Then run:

```powershell
cd "C:\Users\oaadmin\Documents\GitHub\c0ld"
.\scripts\import-cwbot-channel-history.ps1 -ScanOnly -Reset
```

The scan writes a resumable manifest under `%TEMP%` and does not write Supabase rows. Review its candidate and ignored counts, then rerun without `-ScanOnly` to import confirmed candidates oldest-first:

```powershell
.\scripts\import-cwbot-channel-history.ps1
```

The Discord bot must be present in the server and have `View Channel` plus `Read Message History` for the target channel. `CW_BOT_IMPORT_CHANNEL_IDS` must include `1489032381481619550` when that allowlist is configured. The runner requires the clan API Worker's `INGEST_ADMIN_TOKEN`; it automatically resumes after interruption and sends `prefer_earliest_message=true` so later repeated history posts cannot displace an earlier CW_Bot source message.

To scan every readable text channel in one Discord server, set
`CW_BOT_IMPORT_GUILD_IDS` to that server ID and remove
`CW_BOT_IMPORT_CHANNEL_IDS`. Deploy the current clan API Worker, then run:

```powershell
cd "C:\Users\oaadmin\Documents\GitHub\c0ld"
.\scripts\import-cwbot-guild-history.ps1 `
  -GuildId "1457088639006670979" `
  -ScanOnly `
  -Reset
```

The guild wrapper discovers normal text/announcement channels and active
threads, then gives each one a separate resumable checkpoint. After reviewing
the checkpoint files, rerun the same command without `-ScanOnly` and `-Reset`
to import the candidates. Channels the bot cannot read are reported and skipped
without stopping the rest of the server scan.

Archived public threads are intentionally a separate pass because Discord may
deny archive enumeration even when ordinary channel discovery succeeds. Add
`-IncludeArchivedThreads` when the bot has `View Channel` and `Read Message
History` in the applicable parent channels:

```powershell
.\scripts\import-cwbot-guild-history.ps1 `
  -GuildId "1457088639006670979" `
  -ScanOnly `
  -Reset `
  -IncludeArchivedThreads
```

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

To seed Roblox released-version history after running migration `028`, run:

```powershell
Invoke-RestMethod -Method Post `
  -Uri "https://c0ld-clan-api-worker.opal-dde.workers.dev/api/roblox/versions/ingest?force=1" `
  -Headers @{ Authorization = "Bearer $token" }
```

Run `supabase/migrations/030_update_alert_feeds.sql` before enabling FFlag and
dev-blog collection. Then establish their baselines with:

```powershell
Invoke-RestMethod -Method Post `
  -Uri "https://c0ld-clan-api-worker.opal-dde.workers.dev/api/roblox/fflags/ingest?force=1" `
  -Headers @{ Authorization = "Bearer $token" }

Invoke-RestMethod -Method Post `
  -Uri "https://c0ld-clan-api-worker.opal-dde.workers.dev/api/ps99/dev-blogs/ingest?force=1" `
  -Headers @{ Authorization = "Bearer $token" }
```

These first calls intentionally do not send Discord alerts. They record the
current public client settings and newest official BIG Games post so only new
changes are announced afterward.

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

To verify every dedicated Discord channel immediately, without waiting for a
real update or changing the stored baselines:

```powershell
Invoke-RestMethod -Method Post `
  -Uri "https://c0ld-clan-api-worker.opal-dde.workers.dev/api/ps99/alerts/test?feed=all" `
  -Headers @{ Authorization = "Bearer $token" }
```

Replace `all` with `roblox-updates`, `ps99-updates`, `ps99-fflags`,
`ps99-restarts`, or `ps99-dev-blogs` to test only one channel.

Change `type=both` to `type=version` or `type=restart` to preview only one alert.

### Persistent Discord posts

Run Supabase migration `031_reward_cutoff_alerts.sql`, make sure the existing
`DISCORD_BOT_TOKEN` secret belongs to a bot in the server, then add these three
plain-text Worker variables: `REWARD_CUTOFFS_CHANNEL_ID`,
`ROBLOX_STATUS_CHANNEL_ID`, and `VERSIONS_CHANNEL_ID`.
The bot needs View Channel, Send Messages, and Read Message History in all three
channels. These posts use Discord Components V2 containers and real gray
separator components instead of typed divider characters. The Worker stores three independent message IDs
in `c0ld_reward_cutoff_alert_state`: one combined player/clan/league cutoff
post, one Roblox Status post, and one Versions post. It edits each message in
place. If one Discord message is deleted, the next refresh recreates only that
post. Dedicated webhook secrets (`REWARD_CUTOFFS_WEBHOOK_URL`,
`ROBLOX_STATUS_WEBHOOK_URL`, and `VERSIONS_WEBHOOK_URL`) remain available as an
optional fallback when the matching channel ID is absent.

The existing clan Worker cron is sufficient; do not add a second cron just for
this feature. The Worker checks the cutoff schedule whenever its normal cron
runs. `REWARD_CUTOFFS_SCHEDULE_MINUTES` defaults to `5`. The health endpoint
and protected status endpoint report the active schedule.

An optional `LEAGUE_API_WORKER` service binding targeting
`yamo-league-api-worker` avoids an external HTTP hop for league milestones.
Without it, `LEAGUE_API_BASE` is used.

Create or force-refresh all three persistent posts manually:

```powershell
$token = "YOUR_INGEST_ADMIN_TOKEN"

Invoke-RestMethod -Method Post `
  -Uri "https://c0ld-clan-api-worker.opal-dde.workers.dev/api/persistent-posts/post?force=1" `
  -Headers @{ Authorization = "Bearer $token" }
```

Add `&type=cutoffs`, `&type=roblox-status`, or `&type=versions` to refresh only
one post.
Alternatively, paste the admin token into
`scripts/post-discord-reward-cutoffs.ps1` and run that script. It verifies the
three cutoff sources, creates or refreshes all three Discord posts, then
confirms that each stored message still exists in its own channel.

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

Global-rank cleanup is intentionally opt-in. When
`GLOBAL_RANK_RETENTION_ENABLED=true`, the Worker keeps all runs inside
`GLOBAL_RANK_RETENTION_HOURS`, keeps the newest successful (`ok` or
`completed`) run for every clan/battle forever, and removes only
`GLOBAL_RANK_RETENTION_DELETE_RUNS_PER_PASS` old temporary runs after each
completed scan. If an old event has no successful run, its newest non-running
run is retained as a fallback. This cleanup is scoped to the clan global-rank
tables; League history is not touched.

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

## Discord `/search`, `/history`, `/version`, `/t`, and reward command Worker

`discord-search-interactions-worker.js` is the Cloudflare-only Discord command
Worker. It does not use a Gateway bot process. Discord sends slash command
interactions to the Worker over HTTPS, and the Worker reads cached global-rank
data from `c0ld-clan-api-worker`. The guild-only `/t` command posts the provided
message into the current channel or thread as the bot.

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
| `T_COMMAND_GUILD_ID` | Optional guild ID allowed to register and run `/t`. Defaults to `1457088639006670979`. |
| `T_COMMAND_ROLE_ID` | Optional exact role ID allowed to run `/t`. Defaults to `1489032322056589413`. |
| `DISCORD_EPHEMERAL_RESPONSES` | Optional. Set `true` to make successful lookup replies such as `/search`, `/history`, `/top`, and `/clan info` visible only to the user. |
| `DISCORD_ALLOWED_ROLE_IDS` | Optional comma-separated role IDs allowed to use `/search` and `/history`. Leave blank to allow everyone. |
| `SEARCH_CHART_ENABLED` | Optional. Defaults to `true`; attaches a generated points/rank activity chart to `/search` responses. |
| `SEARCH_CHART_RESTART_MARKERS` | Optional. Defaults to `false`; when set to `true`, overlays stored PS99 restart events on the `/search` chart. PS99 version update markers are shown automatically when available. |
| `LEAGUE_API_BASE` | Optional base URL for League History. Defaults to `https://yamo-league-api-worker.opal-dde.workers.dev`. |
| `PROFILE_DATA_BASE` | Optional base URL for first-party static player history. Defaults to `https://c0ld-clan.com/Data/players`. |
| `SITE_BASE_URL` | Optional site origin used to expand relative avatar URLs. Defaults to `https://c0ld-clan.com`. |
| `PLAYER_REWARD_CUTOFF_RANKS` | Optional comma-separated legacy player reward tiers. Defaults to `3,10,100,250,500,1000,10000`. |
| `CLAN_REWARD_CUTOFF_RANKS` | Fallback comma-separated `/clan rewards` ranks. The Clan API Worker supplies the current battle's category labels from BIG Games. |
| `LEAGUE_REWARD_CUTOFF_RANKS` | Optional comma-separated League reward tiers used by `/league rewards`, League-mode `/leaderboard rewards`, and the persistent League player cutoffs. Defaults to `1,3,15,50,100,250,2000`. |
| `PLAYER_REWARD_LEADERBOARD_LABEL` | Optional full legacy player rewards header, such as `Update 88 Leaderboard`. |
| `PS99_UPDATE_LABEL` | Optional shorter player rewards header source, such as `Update 88`; the Worker appends `Leaderboard`. |
| `PS99_UPDATE_NUMBER` | Optional numeric fallback for the player rewards header, such as `88`. |

Recommended Worker service bindings:

| Binding | Target Worker | Purpose |
|---|---|---|
| `CLAN_API_WORKER` | `c0ld-clan-api-worker` | Reads clan/global history without a same-account Worker HTTP hop. |
| `LEAGUE_API_WORKER` | `yamo-league-api-worker` | Reads League History reliably. This prevents Cloudflare `1042` failures that can occur when one Worker calls another through its public `workers.dev` URL. |

The Discord Worker still retains `CLAN_API_BASE` and `LEAGUE_API_BASE` as public
fallbacks. In the Cloudflare dashboard, add `LEAGUE_API_WORKER` as a **Service
binding**, not as a plaintext variable or secret.

Required Worker secrets:

| Secret | Purpose |
|---|---|
| `DISCORD_PUBLIC_KEY` | Public key from Discord Developer Portal > General Information. Used to verify signed Discord interaction requests. |
| `DISCORD_BOT_TOKEN` | Bot token used to register commands, post Luna's scheduled hourly clan images, and send `/t` messages. |
| `REGISTER_ADMIN_TOKEN` | Your private bearer token for the command-registration endpoints. |
| `LEAGUE_INGEST_ADMIN_TOKEN` | Must match `INGEST_ADMIN_TOKEN` on the League API Worker. Required when `/league info`, `/lg`, or `/hourly league` needs to refresh stale or missing league snapshots. |
| `CLAN_API_ADMIN_TOKEN` | Must match `INGEST_ADMIN_TOKEN` on the Clan API Worker. Required by `/hourly`. |

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

For `/t`, the bot must be able to post wherever the command is used. In Discord
server/channel permissions, give the bot `View Channel`, `Send Messages`, and
`Send Messages in Threads` for thread destinations.

For the normal production/global update, sync the global command set:

```powershell
$token = "YOUR_REGISTER_ADMIN_TOKEN"
$worker = "https://YOUR-DISCORD-WORKER.workers.dev"

Invoke-RestMethod -Method Post `
  -Uri "${worker}/admin/sync-global-commands?guild_id=1457088639006670979" `
  -Headers @{ Authorization = "Bearer $token" }
```

The `guild_id` on `sync-global-commands` is only used to clean up old guild
commands in that server while preserving the guild-only `/t` command. The
commands themselves are registered globally.

For guild-only testing, register or update the slash commands with `guild_id`:

```powershell
$token = "YOUR_REGISTER_ADMIN_TOKEN"
$worker = "https://YOUR-DISCORD-WORKER.workers.dev"
$guildId = "YOUR_GUILD_ID"

foreach ($path in @(
  "/admin/register-search-command",
  "/admin/register-version-command",
  "/admin/register-ram-command",
  "/admin/register-rdp-command",
  "/admin/register-top-command",
  "/admin/register-clan-command",
  "/admin/register-cw-command",
  "/admin/register-league-command",
  "/admin/register-lb-command",
  "/admin/register-lg-command",
  "/admin/register-player-command",
  "/admin/register-rewards-command",
  "/admin/register-history-command"
)) {
  $uri = "${worker}${path}?guild_id=${guildId}"
  Invoke-RestMethod -Method Post `
    -Uri $uri `
    -Headers @{ Authorization = "Bearer $token" }
}

Invoke-RestMethod -Method Post `
  -Uri "${worker}/admin/register-t-command?guild_id=1457088639006670979" `
  -Headers @{ Authorization = "Bearer $token" }
```

Use `guild_id` while testing because it usually appears immediately in that
server. Omit `?guild_id=...` once you want a global command, but expect Discord's
global command cache to take longer to appear.

Do not register `/t` globally. The Worker rejects `/t` outside guild
`1457088639006670979`, and `register-t-command` forces guild registration.

To hide `/search` from users, use `DISCORD_ALLOWED_ROLE_IDS` in your worker
environment. If this variable is blank, `/search` and `/history` are open to
everyone who can see the command.

By default in this repo, that variable is blank.

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

The response includes Clan Battle History and League History buttons. Each
button generates one complete category image with every available record and
no pagination. Clan Battle History uses a two-column clan-battle record,
including top performance by lowest global rank, the average of the five most
recent completed ranked clan-battle results, total clans, current-clan tenure
calculated from the API join date, and a segmented field-outranked tape for each
ranked result. First-party site data always takes priority over bot imports.
`/history` always returns image cards; the retired text response cannot be
restored by a stale Worker variable.

The plain-text PS99 version command is:

```text
/version
```

It posts a Luna-style status card with the root PS99 place version, its release
time, and the most recent completed version scan. It also includes the latest
tracked Roblox released client version when `CLAN_API_BASE` can read
`/api/roblox/versions`. Register it through the same admin script, or call
`POST /admin/register-version-command?guild_id=YOUR_GUILD_ID` with the same
admin bearer token.

The reward cutoff commands are:

```text
/clan rewards
/league rewards
/leaderboard rewards
```

They post the current point minimums for reward ranks. Clan categories and labels
are taken from the active battle's BIG Games `PlacementRewards` metadata;
`CLAN_REWARD_CUTOFF_RANKS` is only a fallback when that metadata is unavailable.
League defaults are `1,3,15,50,100,250,2000`.

## League API Worker

`yamo-league-api-worker.js` powers the league pages, the Top 1000 leaderboard,
and the c0ld league overlap page.

`LEAGUE_COLLECTION_ENABLED` is the master collection switch and defaults to
`false`. While it is false, scheduled scans, normal manual ingest requests, and
the page-triggered live overlap/window scans are all blocked. When it is set to
`true` or `auto`, scheduled collection also obeys `LEAGUE_RUN_START_AT`,
`LEAGUE_RUN_END_AT`, and `LEAGUE_COLLECTION_FINAL_PULL_GRACE_MINUTES`. Protected
administrator endpoints stay available while the master switch is enabled so a
deliberate final backfill can still run after a League ends. `INGEST_LEAGUES`,
`INGEST_TOP_LEAGUES`, and `INGEST_TRACKED_RANK_WINDOWS` remain optional
sub-switches once the master switch is enabled.

Exact league collection uses two independent cadences while the Worker cron
continues to run every five minutes:

- Names in `LEAGUE_NAMES`, `COLD_LEAGUE_NAMES`, or `ALT_LEAGUE_NAMES` are the
  configured c0ld league pool. `COLD_LEAGUE_REFRESH_MINUTES=15` refreshes them
  at `:00`, `:15`, `:30`, and `:45`.
- A successful one-off `/league info` or `/lg` lookup stores that league in
  `ps99_league_current`. Non-configured names in that table form the persistent
  general-league pool. `GENERAL_LEAGUE_REFRESH_MINUTES=30` refreshes due names
  at `:00` and `:30`.

Set `GENERAL_LEAGUE_REFRESH_ENABLED=false` to disable the second pool.
`GENERAL_LEAGUE_REFRESH_BATCH_SIZE` limits how many due general leagues run in
one cycle, and `GENERAL_LEAGUE_REFRESH_CONCURRENCY` controls simultaneous exact
BIG Games requests. On the Discord Worker,
`LEAGUE_ON_DEMAND_MAX_AGE_SECONDS=1800` aligns lookup freshness with the
30-minute general cadence. The 15-minute and 30-minute chart spacing comes from
these stored snapshot times; no separate graph table or migration is required.

The current clean run is `LEAGUE_RUN_KEY="tap-heroes-part-2"` with
`LEAGUE_RUN_LABEL="Tap Heroes Part 2"`. A new run key isolates its snapshots
and current rows without deleting previous league history.

BIG Games can continue returning the previous run's cumulative point counters
after a new league begins. Set `LEAGUE_BASELINE_RUN_KEY="active"` and keep
`LEAGUE_NORMALIZE_POINTS_FROM_BASELINE=true`. The Worker then stores only the
increase above the previous run's final values. If BIG Games resets a counter
to a lower value, that lower value is treated as the new run's real total.
The baseline is used only during calculation; previous points are removed from
the stored member, league, and raw point fields for the new run.

`LEAGUE_POINTS_BLACKLIST_JSON` is a display-only blacklist. The Worker still
collects and stores every configured league and member. A listed player remains
visible in rosters, history, profiles, and overlap results, but all of their
point totals and gain fields are omitted from public responses (and render as
blank) in every league. A hidden whole league returns a successful empty
current response so its page loads
without data, and it is omitted from public league lists. For example, this
redacts Younes's points globally while retaining all source data:

```json
{"leagues":[],"players":["Younes89755","1856284829","kessho02"]}
```

Put a league name in `leagues` to hide its entire public dataset. Player IDs are
recommended alongside usernames so a Roblox rename cannot bypass the global
point redaction. The older `LEAGUE_PUBLIC_BLACKLIST_JSON` variable name remains
accepted as a compatibility alias; legacy per-league player maps are flattened
to global player redactions.

If the new run was ingested before baseline normalization was deployed, pause
collection, run `supabase/reset_tap_heroes_part_2_league.sql`, deploy the
updated Worker, and re-enable collection. The same cleanup is also available
through `POST /api/leagues/run/reset?run=tap-heroes-part-2` with the ingest
administrator token. Neither cleanup path modifies the baseline or older runs.

Run `supabase/migrations/026_league_player_history_index.sql` in the Supabase SQL
Editor so cross-run player history lookups do not time out as the snapshot
archive grows.

Useful endpoints:

| Endpoint | Purpose |
|---|---|
| `/api/leagues/current?league=YAMO` | Latest stored member rows for one tracked league. |
| `/api/leagues/top-leagues?limit=1000` | Latest Top 1000 league leaderboard with gain projections. |
| `/api/leagues/solo-leaderboard?limit=500` | Live Top 500 individual league contributors. Add `q=` to search those rows, every stored tracked-league roster, and an exact Roblox username/user ID through BIG Games' direct league-player lookup. |
| `/api/leagues/player-milestones?ranks=1,3,15,50,100,250,2000` | Current live League-player reward thresholds from the stored League player pool. |
| `/api/leagues/player-location?user_id=123` | Finds the player's current league from stored current rosters, with BIG Games' direct league-player lookup as fallback. |
| `/api/leagues/milestones?ranks=1,3,15,50,100,250,2000` | Exact stored League-team point thresholds used by the league reward milestone cards, plus the configured League label and end time. |
| `/api/leagues/profile?user_id=123` | Per-player league summaries grouped by league/run for profile pages. |
| `/api/leagues/c0ld-overlap?clan=c0ld&top_limit=10000&offset=0&limit=30` | Manual reassessment scan that can walk Top 10000 in chunks, compares league rosters against current c0ld clan members, and returns only matched leagues. |

The overlap endpoint is intentionally chunked. `c0ld-leagues.html` walks through
the chunks automatically so one request does not attempt hundreds of league
detail fetches at once.

The public League-player endpoint is authoritative for the first 100 players,
but it does not expose the full reward range. The extended leaderboard is a
simulation built from every member score found in the stored Top-X League list.
First ingest the desired Top-X League list, then publish its deduplicated player
pool with:

```powershell
.\scripts\ingest-league-player-pool.ps1 `
  -Run "tap-heroes-part-2" `
  -TopLeagues 1000 `
  -BatchSize 25 `
  -Concurrency 4
```

Change `-TopLeagues` to `2000` or `3000` for a deeper future simulation. The
script retries failed batches and does not replace the published pool until
every requested League roster has succeeded.

`LEAGUE_RUN_START_AT` and `LEAGUE_RUN_END_AT` are ISO timestamps for the current
League window. `LEAGUE_RUN_START_AT` is optional; if present, scheduled collection
waits until that time. `LEAGUE_RUN_END_AT` is returned by `/api/health` and
`/api/leagues/milestones`; historical or alternate run endings can be mapped with
`LEAGUE_RUN_ENDS_JSON`, and starts can be mapped with `LEAGUE_RUN_STARTS_JSON`.
`LEAGUE_COLLECTION_FINAL_PULL_GRACE_MINUTES` lets scheduled collection continue
briefly after the end timestamp for a final capture. BIG Games' public
`/v1/leagues` and `/v1/leagues/players` responses do not currently include a
reliable event-ending field, so these timestamps are owned by the League Worker
rather than inferred from leaderboard rows.

League profile snapshot reads are paginated internally in 1,000-row batches, so
the requested profile limit is honored instead of silently stopping at
Supabase's default 1,000-row response cap.

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

To move existing league history out of the old NONG Supabase project, set
`LEAGUE_COLLECTION_ENABLED=false`, then run:

```powershell
.\scripts\migrate-league-data-to-c0ld.ps1 `
  -SourceDbUrl "postgresql://postgres.OLD_REF:OLD_DB_PASSWORD@OLD_POOLER_HOST:5432/postgres" `
  -TargetDbUrl "postgresql://postgres.NEW_REF:NEW_DB_PASSWORD@NEW_POOLER_HOST:5432/postgres" `
  -ReplaceExisting
```

Use the Supabase **Session pooler** connection strings from each project's
Connect panel. After the copy finishes, point `yamo-league-api-worker` at the
c0ld Supabase project, deploy it, and re-enable the cron.

## PS99 hourly inventory gains

`inventory-detector-worker.js` stores normalized Big Games inventory snapshots
and powers `cinnamowopal.html`. Apply `supabase/inventory-detector.sql`, deploy
the Worker using `wrangler-inventory-detector.toml.example`, and add the
`SUPABASE_SERVICE_KEY` secret. The example cron runs at minute 17 of every hour,
using 24 inventory reads per day. The 55-minute minimum interval also protects
against an accidentally retained five-minute cron trigger.

The tracker rejects empty upstream inventories and skips repeated Big Games
source timestamps, preventing a stale response from looking like a complete
inventory loss or a new hourly sample. New snapshot rows retain only compact
source metadata; normalized item stacks remain in the item table for diffs.

If the public page reports `Supabase select failed: error code: 1016`, the
Worker's `SUPABASE_URL` hostname is invalid or no longer exists. Replace it with
the exact current project URL from Supabase **Project Settings > Data API**.
This value is a normal Worker variable; `SUPABASE_SERVICE_KEY` remains a secret.

The Worker supports the official Big Games OAuth Player API. Configure
`BIG_GAMES_CLIENT_ID`, `BIG_GAMES_REDIRECT_URI`, and the
`BIG_GAMES_CLIENT_SECRET` secret, then apply
`supabase/migrations/027_inventory_oauth.sql` and
`supabase/migrations/029_inventory_multi_account_oauth.sql`. League pages start
authorization with the selected roster member's `user_id`, username, league,
and run. This binds the one-time callback to that Roblox account even though
the token response deliberately contains no player identity field. The member
does not need to exist in `INVENTORY_USERS_JSON`; any current member returned
by the League API may authorize. The callback stores a separate encrypted
grant for that member. Check one account with
`GET /api/inventory/oauth/status?user_id=463900811`.
`GET /api/inventory/oauth/summary` returns only the number of active and expired
saved approvals for the public opt-in counter; it does not expose account IDs.

With `INVENTORY_LEAGUE_FEATURE=true` and
`INVENTORY_AUTO_DISCOVER_MEMBERS=true`, every current member returned by
`LEAGUE_API_BASE` may start consent from a league page without first being
copied into `INVENTORY_USERS_JSON`. Scheduled scans include all active saved
grants; `INVENTORY_USERS_JSON` remains the seed list for permanent/test users.
`INVENTORY_SYNC_COHORT=true` launches due opted-in accounts from the same
scheduled event and limits the public league comparison to schedule-to-schedule
hourly windows. Approval-time and manual test snapshots remain stored, but are
excluded from the fair hourly comparison.

The callback performs one immediate `refresh=true` inventory read and stores
the first snapshot before returning to the initiating page. This deliberately
bypasses the normal hourly timer and consumes one BIG Games refresh-quota slot.
`league-inv-test.html` is the AgentP_0928 totals-only consent and verification
page.

League inventory totals calculate each displayed event-pet group's share of
total pet damage. The Worker first uses a power carried by inventory, then the
official Big Games catalog, and finally the current event power table verified
against the PS99 decompile. Normal, Golden, Rainbow, and Shiny variants use the
game's current multipliers. Hatch probabilities are never treated as damage.
The optional `EVENT_PET_POWER_JSON` Worker variable can override those defaults
after a game rebalance. Its shape is
`{"War Elephant":{"Normal":65000000000,"Golden":130000000000}}`.
`PET_CATALOG_CACHE_SECONDS` controls the catalog cache and defaults to one hour.

After connection, normal hourly scans use `GET /v1/account/inventory`. A manual
`POST /api/inventory/ingest?force=1` adds `refresh=true` and consumes a Big
Games refresh-quota slot, so reserve it for explicit tests. Big Games access
tokens expire after 30 days and must then be authorized again; there is no
refresh-token endpoint. Re-running the setup/authorization flow issues a new
token for the selected linked Roblox account; users do not need to revoke first.

### HTG gain alert tracker

The Discord `/htg` command uses the same Big Games OAuth callback and scheduled
inventory checks to post Huge, Titanic, and Gargantuan gain alerts. Apply:

```text
supabase/migrations/035_hatch_tracker.sql
supabase/migrations/036_hatch_tracker_guild_channels.sql
supabase/migrations/037_hatch_tracker_multi_account.sql
supabase/migrations/049_htg_inventory_state.sql
supabase/migrations/051_hatch_alerts_per_item.sql
```

Set these on `inventory-detector-worker`. The regular `BIG_GAMES_*` app can
remain the inventory monitor app; HTG uses the separate `HATCH_BIG_GAMES_*` app
so `/htg setup` opens the Luna Bot app instead.

| Setting | Purpose |
|---|---|
| `BIG_GAMES_CLIENT_ID` | Client ID from the existing inventory monitor Big Games DB app. |
| `BIG_GAMES_REDIRECT_URI` | Exact `/api/inventory/oauth/callback` URL registered in the inventory monitor Big Games DB app. |
| `HATCH_BIG_GAMES_CLIENT_ID` | Client ID from the Luna Bot HTG Big Games DB app. |
| `HATCH_BIG_GAMES_REDIRECT_URI` | Exact redirect URL registered in the Luna Bot HTG Big Games DB app. Use the short stable Workers callback, for example `https://inventory-detector-worker.opal-dde.workers.dev/cb`, until any custom domain opens with a clean trusted HTTPS certificate from normal browsers and networks. |
| `HATCH_OAUTH_PUBLIC_BASE` | Public base URL used only for the fallback short OAuth link, usually `https://inventory-detector-worker.opal-dde.workers.dev`. Do not point this at a custom domain that can produce browser certificate warnings. |
| `HATCH_BIG_GAMES_SCOPES` | Optional override for the space/comma-separated scopes requested by the HTG app. HTG approvals always include Profile and Inventory, then default to trade, booth, and mail read scopes so source filtering can distinguish tracked HTG gains from trade, booth, or mail gains. Scheduled HTG scans verify the live Profile identity before reading inventory; older grants without Profile must be re-authorized so an alt account can never be reported under a main account's name. |
| `HTG_SCAN_INTERVAL_MINUTES` | Optional preferred cadence. Set to `15`. BIG Games reports the actual refresh allowance for each Roblox account: 48/day for standard accounts and 96/day for VIP. Luna calculates a quota-safe minimum of about 35 minutes for a standard account or 16 minutes for VIP when six pulls are reserved, then adapts to remaining allowance and reset time. |
| `HTG_SCHEDULE_ALIGNMENT_MINUTES` | Optional. Defaults to `15`. Scheduled HTG scans may begin only at `:00`, `:15`, `:30`, or `:45`; an account that is not yet quota-eligible skips that slot and waits for the next one. A confirmed VIP account uses every slot only when its quota reserve is set to `0`. |
| `HTG_SHARD_COUNT` | Optional compatibility/diagnostic setting. Set to `15` or leave unset. Initial recovery metadata retains a deterministic shard, while scheduled HTG reads use the quarter-hour grid and `HTG_MAX_CONCURRENT_SCANS` prevents a burst of simultaneous API calls. |
| `HTG_MAX_CONCURRENT_SCANS` | Optional. Defaults to `3`. Limits simultaneous BIG Games reads so one cron run cannot burst every connected HTG account at the API. |
| `HTG_REFRESH_QUOTA_LIMIT` | Optional compatibility fallback. Defaults to `48` while an account's API response has not yet reported its actual limit. A stored API-reported 48 or 96 always takes precedence. Do not set this to `96` to make standard accounts scan faster. |
| `HTG_REFRESH_QUOTA_RESERVE` | Optional. Defaults to `6`. Luna reserves these account pulls for an owner visiting BIG Games, OAuth setup, or deliberate diagnostics. |
| `HTG_REQUIRE_SOURCE_FILTER` | Optional. Defaults to `true`; when an HTG gain candidate appears, Luna requires trade/booth/mail source checks before posting. If source checks cannot be read, the candidate remains pending and the baseline is not advanced. |
| `HTG_SCAN_HISTORY_LIMIT` | Optional. Defaults to `96`. Number of completed per-account HTG scan/pull outcomes retained in the authoritative v2 metadata ledger. |
| `HTG_SOURCE_FILTER_HOLD_MINUTES` | Optional. Defaults to `20`; exposes how long a source-verification outage has lasted in HTG diagnostics. Gains are retained as pending after this window rather than silently discarded. |
| `HTG_STALE_ALERT_WINDOW_MINUTES` | Optional. Classifies long gaps for diagnostics. Fresh inventory received after a gap is still compared and source-filtered by default so real gains are not silently lost. |
| `HTG_DROP_STALE_GAINS` | Optional. Defaults to `false`. Set to `true` only if you intentionally want Luna to absorb gains after a long refresh gap without alerting. |
| `HATCH_FORCE_REFRESH_ON_SCHEDULE` | Optional. Defaults to `false` and should remain false. BIG Games can charge `refresh=true` even when a current snapshot already exists. Normal scheduled account reads still refresh when the provider's five-minute cache is stale, while preserving quota when it is not. Use a manual diagnostic only when you deliberately want to spend a pull. |
| `HATCH_SOURCE_FILTER_ENABLED` | Optional. Defaults to `true`; set to `false` only to temporarily post HTG inventory gains without checking trade, booth, or mail source logs. |
| `INVENTORY_SNAPSHOT_ITEM_READ_LIMIT` | Optional. Defaults to `50000`; maximum snapshot item rows read when comparing full inventories for HTG and inventory diffs. |
| `HATCH_ALERT_CHANNEL_ID` | Legacy only. HTG delivery is now intentionally server-scoped and does not fall back to this channel. Use `/htg assign` in each server instead. |
| `HATCH_TRACKER_RETURN_URL` | Optional dedicated HTG page to open after OAuth completes. Leave blank for Discord-only HTG setup; this intentionally does not fall back to `INVENTORY_OAUTH_RETURN_URL`. |

Successful BIG Games inventory responses include per-account refresh metadata.
That allowance is shared with the official BIG Games site, public profile
reads, and other apps; hitting exhaustion can return a stale snapshot with HTTP
200 rather than a conventional error. HTG stores the provider-reported limit,
usage, reset time, and actual `consumedThisCall` result, then leaves its
baseline untouched until a newer inventory revision appears.

`/htg accounts` also verifies that each saved HTG access token can be opened
with the currently configured encryption/client secrets. An account shown as
`auth needs refresh` must run `/htg setup` again before scheduled comparisons
can resume.

`POST /api/hatch/alerts/check?username=<name>&force=1` bypasses the normal
account shard and interval gates for a deliberate diagnostic. The endpoint is
safe for a one-off test, but repeatedly forcing it can consume the account's
daily Big Games refresh allowance.

For a missed-alert investigation, use the read-only history command instead:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\show-htg-observation-history.ps1 -Username DietPizza
```

It reads only the saved inventory snapshots and reports every Huge, Titanic,
and Gargantuan first observed in the retained window, each later count increase,
and items that disappeared. It does **not** call BIG Games or consume a refresh.
`first observed` means first present in the saved history window—not proof of
the exact time the item was acquired. The Worker endpoint is
`GET /api/hatch/diagnostics/htg-history` and requires the admin token.

For the live Luna HTG app, register this exact Big Games DB redirect URL and set
the Worker variable to the same value:

```text
https://inventory-detector-worker.opal-dde.workers.dev/cb
```

Do not register only `https://inventory-detector-worker.opal-dde.workers.dev`.
Big Games compares the callback URL exactly; the `/cb` callback path must be
present. The Worker also accepts `/api/inventory/oauth/callback`, but `/cb` keeps
the Big Games authorization URL short enough for Discord link buttons.

Avoid `https://luna.c0ld-clan.com/api/inventory/oauth/callback` while that
hostname can show `NET::ERR_CERT_AUTHORITY_INVALID`. The callback happens after
Big Games approval, so any certificate warning there is user-facing.

Required/optional secrets on `inventory-detector-worker`:

| Secret | Purpose |
|---|---|
| `BIG_GAMES_CLIENT_SECRET` | Secret from the existing inventory monitor Big Games DB app. |
| `HATCH_BIG_GAMES_CLIENT_SECRET` | Secret from the Luna Bot HTG Big Games DB app. |
| `INVENTORY_TOKEN_ENCRYPTION_SECRET` | Optional stable encryption secret for saved grants. |
| `INGEST_ADMIN_TOKEN` | Shared private token used by the Discord interaction Worker. |
| `DISCORD_BOT_TOKEN` | Required for `/htg assign` channel posts. |
| `HATCH_ALERT_WEBHOOK_URL` | Legacy only; HTG alerts do not use a shared webhook fallback. |

The HTG detector owns its scheduler roster directly from enabled
`ps99_hatch_tracker_users` rows; it does not depend on the general inventory or
League inventory user list. HTG v2 stores one authoritative state record in
each tracker's `metadata.htg_v2`; it does not read or advance the earlier
compact state table. The first fresh verified inventory scan is intentionally a
quiet baseline (including an empty HTG inventory). Each later scan requires a
new Big Games source revision, then compares only Huge, Titanic, and
Gargantuan stacks against that baseline. Matching trade, booth, mail, and
prior-owner records suppress a candidate as a transfer. An unmatched candidate
must remain through one later fresh source revision before it posts. This adds
one normal scan of latency but avoids falsely announcing a trade whose source
history arrived late. If source checks are unavailable, the exact candidate is
kept pending and the baseline is preserved. The v2 ledger records every
attempt, cache fallback, source check, suppression, failure, and posted alert.

Deploying HTG v2 causes each enabled account to establish one new quiet
baseline on its next fresh scan. That is intentional: it prevents the account's
existing inventory from being treated as newly hatched. The old
`HTG_FAILURE_RETRY_*`, `HTG_SOURCE_CONFIRMATION_OBSERVATIONS`, and
`HATCH_BACKFILL_*` settings are retained for compatibility with the inactive
legacy path and do not alter the v2 scanner.

#### HTG v2 rollout

1. Deploy this `inventory-detector-worker` build with the existing HTG variables
   and the every-minute cron still enabled. No database migration is required.
2. Do **not** run repeated forced checks. Each connected account will take its
   next quota-safe scheduled slot and save a quiet `baseline_saved` result.
   Until BIG Games reports the account's tier, Luna treats it as a standard
   48-refresh account.
3. After that baseline, an unmatched Huge/Titanic/Gargantuan is observed once,
   then confirmed on the next fresh revision before an alert is posted.
4. Existing accounts do **not** need to revoke/re-authorize just because this
   worker is deployed. Re-authorize only if diagnostics reports a missing
   Profile scope, expired grant, or identity mismatch.
5. Use `GET /api/hatch/diagnostics/summary?history_limit=24` with the admin
   token to inspect the exact scan ledger. It is read-only and does not consume
   a Big Games inventory refresh.

HTG OAuth uses Profile scope to verify that the Big Games token belongs to the
same Roblox account saved on the tracker. If a saved token is missing Profile
scope, or Big Games reports a different Roblox account, Luna refuses to scan that
grant and the user must run `/htg setup` again for the correct linked account.
Each HTG gain now posts and stores as its own alert row, and alert titles include
variants such as `Shiny`, `Golden`, or `Rainbow`. When multiple guild channels
are assigned, delivery is isolated per channel: a failure in one destination is
reported as partial delivery and cannot replay the same alert into channels that
already accepted it.

To audit a suspected account mixup, call the diagnostics endpoint or run the SQL
helper:

```powershell
Invoke-RestMethod `
  -Uri "https://inventory-detector-worker.opal-dde.workers.dev/api/hatch/diagnostics?username=DietPizza&item=Carrot%20Crocodile&limit=12" `
  -Headers @{ Authorization = "Bearer $token" }
```

For a read-only view of every enabled account and its recent pull usage, use:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\diagnose-hatch-tracker.ps1 -Summary
```

Add `-FullJson` when the complete recent per-account ledger is needed.

This calls `GET /api/hatch/diagnostics/summary`. It does not contact BIG Games
and therefore consumes no inventory refresh. Each account includes its scheduler
decision, current provider quota, pending gain, last error, and a capped pull
ledger showing inventory attempts, source-verification reads, quota changes, and
Discord-post outcomes.

```text
supabase/diagnose_htg_account_mixup.sql
```

Use an every-minute cron for the inventory Worker when HTG sharding is enabled:

```text
* * * * *
```

The scheduler uses a quarter-hour clock grid: scheduled reads begin only at
`:00`, `:15`, `:30`, or `:45`. It does **not** override a Roblox account's
quota-safe cadence. A standard account starts with a roughly 35-minute minimum
(48 daily refreshes less a six-refresh reserve), while an API-confirmed VIP
account starts with a roughly 16-minute minimum. A not-yet-eligible account
waits for the next quarter-hour slot. Set the reserve to `0` only when a
confirmed VIP account is intentionally dedicated to 15-minute monitoring and
does not need manual refresh capacity.

Set these on `c0ld-discord-search`:

| Setting | Purpose |
|---|---|
| `INVENTORY_API_BASE` | Public URL for the inventory Worker if no service binding is used. |
| `INVENTORY_API_WORKER` | Recommended service binding to `inventory-detector-worker`. |
| `INVENTORY_API_TOKEN` | Secret matching `INGEST_ADMIN_TOKEN` on the inventory Worker. |
| `HTG_SETUP_STEP_IMAGE_URLS` | Optional comma-separated image URLs for the `/htg setup` Step 1/2/3 setup pages. |
| `HTG_SETUP_STEP_IMAGES_JSON` | Optional JSON alternative for setup page images, either an array or an object keyed by `1`, `2`, `3`. |
| `HTG_SETUP_THUMBNAIL_URL` | Optional small header image for the `/htg setup` setup card. |

The user flow is:

- `/htg setup account:<roblox username>` creates a private paginated
  Components V2 setup message with a Big Games DB connect button bound to that
  account. Bare numeric values are treated as possible numeric usernames first;
  use `account:id:<number>` only when intentionally targeting a Roblox user ID.
  The account argument is required so Luna can safely bind the OAuth approval
  even when Big Games Profile does not expose a parseable Roblox user ID.
- `/htg accounts` lists every Roblox account connected to the user's Discord
  account.
- `/htg assign channel:<channel>` sets the HTG gain-alert destination for that
  Discord server. HTG opt-ins are server-scoped: an account posts only to the
  server where that account was explicitly enabled, and only if that same server
  has an assigned channel. Enabling the same account in two servers intentionally
  sends one alert to each server. Legacy unscoped tracker settings are not routed
  after this change; run `/htg enable` once in the server that should receive the
  account's future alerts. HTG never falls back to a shared channel or webhook.
- `/htg enable tier:<huge|titanic|gargantuan|all>` enables selected alerts for
  every connected Roblox account on that Discord user by default. Add
  `account:<roblox username>` to target one alt, or `account:id:<number>` to
  force a Roblox user ID.
- `/htg disable tier:<huge|titanic|gargantuan|all>` disables selected alerts
  with the same optional `account:` selector.

Scheduled scans compare the newest owned-inventory snapshot against the
previous snapshot. If multiple special pets are detected in one window, the
alert image priority is Gargantuan, then Titanic, then Huge, after applying
the user's enabled tier preferences. The three alert body functions are
separate in `inventory-detector-worker.js` so Huge, Titanic, and Gargantuan can
each receive their own final template.

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

## Luna global `/hourly` picture posts

The Luna Discord interactions Worker supports hourly image posts for a PS99
clan board, a single user's `/search` picture, or a league member-progress
picture:

```text
/hourly clan clan:WMSY channel:#hourly-gains
/hourly user username:Cinnamowopal channel:#hourly-gains
/hourly league league:dezzz channel:#hourly-gains
```

`channel` is optional and defaults to the channel or thread where the command
is used. Text channels, announcement channels, and existing public, private,
or announcement threads are supported. The command is registered globally, so
there is no fixed guild allow list; a user needs the guild's configured Luna
administrator role to assign a destination. The first `/luna admin role:<role>`
setup is open when no Luna administrator role exists yet; after that, changing
the Luna administrator role requires Discord **Manage Server** or
**Administrator** permission.

Run this migration first:

```text
supabase/migrations/033_discord_hourly_clan_assignments.sql
```

Add this secret to `discord-search-interactions-worker.js`:

| Secret | Purpose |
|---|---|
| `CLAN_API_ADMIN_TOKEN` | Must equal `INGEST_ADMIN_TOKEN` on `c0ld-clan-api-worker`. It lets Luna collect an assigned clan's current battle snapshot and manage saved destinations. |
| `LEAGUE_INGEST_ADMIN_TOKEN` | Must equal `INGEST_ADMIN_TOKEN` on `yamo-league-api-worker` if `/hourly league` needs to refresh stale or missing league snapshots. |

Keep the existing `CLAN_API_WORKER` service binding when possible. The Luna
Worker uses `LEAGUE_API_WORKER` or `LEAGUE_API_BASE` for `/hourly league`.
`/hourly league` reuses the stored league snapshots behind `/league info` and `/lg`, renders a
c0ld-themed member progress image, posts a preview immediately, then refreshes
hourly with the same scheduler as clan and user boards.

Worker needs an hourly cron trigger:

```text
0 * * * *
```

Assignments are stored per Discord channel/thread and target. A clan board, user
board, and league board can coexist in the same channel/thread because each
saved target gets its own assignment key. Luna posts a first image immediately,
then one image per hour. Each assigned clan, user, or league is collected
independently.

Use `GET /admin/hourly/status` with the Luna Discord Worker's admin token to
verify stored assignments, due state, the last Discord error, and whether the
required bot/API tokens are present. If `/hourly clan`, `/hourly user`, or
`/hourly league` works but no hourly post follows, make sure the worker
receiving Discord interactions is the same deployed worker that has the
`0 * * * *` cron trigger.

Register the command globally with
`scripts/register-discord-hourly-command.ps1`. Force an immediate post for
every configured destination with `scripts/test-discord-hourly-clans.ps1`.

## Discord Offline Pings

Offline pings are configured through the Luna Discord Worker and evaluated by
`c0ld-clan-api-worker`. The signal is **no clan-battle or League point gain for
N minutes**; it does not use Discord presence or Roblox live presence.

Run these migrations first:

```text
supabase/migrations/040_discord_offline_ping.sql
supabase/migrations/041_discord_offline_split_channels.sql
supabase/migrations/042_discord_offline_user_channels.sql
supabase/migrations/050_discord_offline_league_pings.sql
```

Register `/offline` with `scripts/discord-search-command-admin.ps1`, or call
`POST /admin/register-offline-command` on the Discord interactions Worker with
the same admin token used for the other command registrations.

Commands:

```text
/offline assign clan channel:<channel>
/offline assign league channel:<channel>
/offline assign users channel:<channel>
/offline minutes number:<minutes>
/offline clan name:<clan>
/offline league name:<league>
/offline remove-clan name:<clan>
/offline remove-league name:<league>
/offline user username:<roblox username> discord:<Discord user> clan:<optional clan or League hint> source:<auto|clan|league>
/offline users clan:<clan or League> user1:<roblox username> discord1:<Discord user>
/offline post-rate minutes:<minutes>
/offline check
/offline list
```

The Discord Worker needs `CLAN_API_ADMIN_TOKEN` and the `CLAN_API_WORKER`
service binding, same as `/hourly`. The clan API Worker needs
`DISCORD_BOT_TOKEN`, `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, and
`INGEST_OFFLINE_ALERTS=true` once you are ready for scheduled checks. Manual
checks can be triggered with:

League offline watches read from `ps99_league_current` and
`ps99_league_snapshots`, so the League API Worker must still be collecting the
watched League on its normal schedule. During League periods, scheduled offline
checks continue for League watches even when clan battle data pulls are paused.

```powershell
Invoke-RestMethod -Method Post `
  -Uri "https://c0ld-clan-api-worker.opal-dde.workers.dev/api/offline/check?guild_id=YOUR_GUILD_ID&force=1" `
  -Headers @{ Authorization = "Bearer $token" }
```

Preview the alarm format without waiting for a real no-gain alert:

```powershell
$body = @{
  webhook_url = "https://discord.com/api/webhooks/WEBHOOK_ID/WEBHOOK_TOKEN"
  clan_name = "c0ld"
  league_name = "dezzz"
  username = "Cinnamowopal"
  minutes = 30
} | ConvertTo-Json

Invoke-RestMethod -Method Post `
  -Uri "https://c0ld-clan-api-worker.opal-dde.workers.dev/api/offline/test-post" `
  -Headers @{ Authorization = "Bearer $token"; "Content-Type" = "application/json" } `
  -Body $body
```

To preview in the assigned Discord channel instead of a webhook, send
`guild_id` or `channel_id` in the body and omit `webhook_url`.

Bloxlink note: Discord interaction payloads include Discord role IDs, but they
do not include Bloxlink's Roblox-account mapping. To auto-map verified Roblox
names later, add a Bloxlink API integration or continue using explicit
`/offline user` mappings.

## Servers Worker

`c0ld-servers-worker.js` stores approved server rows, pending submissions, and
server audit events in Supabase.

Run this Supabase migration first:

```text
supabase/migrations/008_c0ld_servers.sql
```

### Discord private-server tracker

The same Worker also supports guild-local Roblox private-server tracking for
the `/server`, `/add`, and `/remove` commands. Run:

```text
supabase/migrations/033_private_server_tracker.sql
supabase/migrations/034_private_server_pending_resolution.sql
```

The tracker stores its configuration, stable `vipServerId` records, and
time-stamped observations in:

- `discord_server_tracker_guilds`
- `discord_server_tracker_servers`
- `discord_server_tracker_observations`

The transient Roblox Job ID is only written to an observation. It is never
used to identify a tracked server.

Set these secrets on `c0ld-servers-worker`:

| Secret | Purpose |
|---|---|
| `SUPABASE_URL` | c0ld Supabase project URL. |
| `SUPABASE_SERVICE_KEY` | Supabase service-role key. |
| `SERVERS_ADMIN_TOKEN` | Shared private API token. |
| `ROBLOX_SECURITY_COOKIE` | Raw `.ROBLOSECURITY` value for the observer Roblox account. |
| `ROBLOX_OBSERVER_USERNAME` | Optional username shown after `/server add` so the owner knows which observer account to authorize. |
| `DISCORD_BOT_TOKEN` | Token for editing each guild's persistent tracker message. |

Set `SERVER_TRACKER_ENABLED=true` and use a five-minute cron. Each guild's
`refresh_minutes` value defaults to 10, so cron invocations that occur before a
guild is due are skipped.

Discord users never provide a Roblox cookie. There is one central observer
account whose cookie remains a Worker secret and must never be committed, put
in Supabase, or sent to the Discord interaction Worker.

`/server add` accepts and numbers every valid private-server link immediately.
If the central observer account cannot see a submitted server yet, it is stored
as `pending` and displayed as "Awaiting observer access." Grant that Roblox
account access to the server; a later scheduled collection will resolve the
record to its stable `vipServerId` and begin population/roster observations
automatically. Approve one pending server at a time. The Worker compares the
observer account's before/after server lists, so approving multiple new servers
at once is intentionally left pending rather than attaching a link to the wrong
server.

Set these on `c0ld-discord-search`:

| Setting | Purpose |
|---|---|
| `SERVERS_API_WORKER` | Service binding to `c0ld-servers-worker`. |
| `SERVERS_API_TOKEN` | Secret matching `SERVERS_ADMIN_TOKEN`. |
| `SERVER_TRACKER_ADMIN_ROLE_IDS` | Optional comma-separated roles allowed to change tracking. |

Any guild member can use `/server add`, `/server list`, and `/server who`.
Discord members with Administrator, Manage Server, or a configured tracker-admin
role can use `/server assign`, `/server tracker`, and `/server remove`.
`/server list` and `/server who` are available to guild members.

After deploying both Workers, register the new commands with the existing
PowerShell helper:

```powershell
.\scripts\discord-search-command-admin.ps1 `
  -WorkerUrl "https://discord-search-interactions-worker.opal-dde.workers.dev" `
  -GuildId "YOUR_GUILD_ID" `
  -Token "YOUR_REGISTER_ADMIN_TOKEN" `
  -SkipDelete
```

The tracker commands are:

- `/server assign channel:<channel>`
- `/server tracker`
- `/server add link:<private-server-link> [place_id]`
- `/server remove server:<S1>`
- `/server list`
- `/server who server:<S1>`
