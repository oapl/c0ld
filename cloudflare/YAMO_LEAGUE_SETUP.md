# YAMO League API Worker

This Worker stores YAMO league snapshots and global Top 100 League snapshots in Supabase.
Existing league rows are kept as `legacy`; the active YAMO page now reads the `active` run.
`top-leagues.html` is powered by this same Worker through `/api/leagues/top-leagues`.

Current Worker URL:

```text
https://yamo-league-api-worker.opal-dde.workers.dev
```

Worker source file:

```text
cloudflare/yamo-league-api-worker.js
```

Wrangler reference:

```text
cloudflare/wrangler-league-api.toml.example
```

Required Cloudflare variables:

```text
LEAGUE_NAME=YAMO
LEAGUE_RUN_KEY=active
SITE_ORIGINS=https://oapl.github.io,*
PUBLIC_CACHE_SECONDS=5
INGEST_LEAGUES=true
INGEST_TOP_LEAGUES=true
TOP_LEAGUES_LIVE_FALLBACK=true
TOP_LEAGUES_MAX_STALE_MINUTES=15
ROBLOX_USERNAME_LOOKUPS=true
ROBLOX_AVATAR_LOOKUPS=true
INACTIVE_ALERTS_ENABLED=true
INACTIVE_ALERT_DISCORD_USERS={"Corosion":"123456789012345678"}
INACTIVE_ALERT_REQUIRE_MAPPING=true
INACTIVE_ALERT_EDIT_MESSAGES=true
SUPABASE_URL=https://YOUR-PROJECT.supabase.co
```

Required Cloudflare secrets:

```text
SUPABASE_SERVICE_KEY
INGEST_ADMIN_TOKEN
INACTIVE_ALERT_WEBHOOK_URL
```

Cron trigger:

```text
*/5 * * * *
```

Before deploying this Worker version, run this Supabase migration:

```text
supabase/migrations/013_ps99_league_run_key.sql
supabase/migrations/014_ps99_league_inactivity_alerts.sql
```

## Discord inactivity alerts

The Worker can post to `#inactive-alerts` after each 5-minute league ingest.
It checks the latest YAMO snapshot against the previous 5-minute snapshot. If a
mapped member gained exactly `0` points, it posts:

```text
<@DISCORD_USER_ID> gained 0 points in the last 5 minutes.
```

If the member keeps gaining `0`, the Worker edits the same webhook message to
show the running streak:

```text
<@DISCORD_USER_ID> has gained 0 points for 10 minutes.
```

Required setup:

1. In Discord, create a webhook for `#inactive-alerts`.
2. Add the webhook URL as the Cloudflare secret `INACTIVE_ALERT_WEBHOOK_URL`.
3. Add a plaintext Worker variable named `INACTIVE_ALERT_DISCORD_USERS`.

Example user map:

```json
{"Corosion":"123456789012345678"}
```

The key can be a Roblox username or Roblox user ID. The value should be the
Discord user ID, or a Discord mention like `<@123456789012345678>`.

Useful endpoints:

```text
GET  /api/health
GET  /api/leagues/current?league=YAMO&run=active
GET  /api/leagues/history?league=YAMO&run=active&hours=24
GET  /api/leagues/top-leagues?run=active&limit=100
POST /api/leagues/ingest?league=YAMO&run=active
POST /api/leagues/top-leagues/ingest?run=active
```

PowerShell test:

```powershell
$worker = "https://yamo-league-api-worker.opal-dde.workers.dev"
Invoke-RestMethod -Method Get "$worker/api/health"
```

Manual ingest examples:

```powershell
$token = "YOUR_CURRENT_TOKEN"
$worker = "https://yamo-league-api-worker.opal-dde.workers.dev"

Invoke-RestMethod -Method Post "$worker/api/leagues/ingest?league=YAMO&run=active" -Headers @{ Authorization = "Bearer $token" }
Invoke-RestMethod -Method Post "$worker/api/leagues/top-leagues/ingest?run=active" -Headers @{ Authorization = "Bearer $token" }
```

GitHub Pages files currently point at the yamo Worker URL:

```text
yamo.html
top-leagues.html
```
