# YAMO League API Worker

This Worker stores YAMO league snapshots and global Top 100 League snapshots in Supabase.
Existing league rows are kept as `legacy`; the active YAMO page now reads the `active` run.

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
ROBLOX_USERNAME_LOOKUPS=true
ROBLOX_AVATAR_LOOKUPS=true
SUPABASE_URL=https://YOUR-PROJECT.supabase.co
```

Required Cloudflare secrets:

```text
SUPABASE_SERVICE_KEY
INGEST_ADMIN_TOKEN
```

Cron trigger:

```text
*/5 * * * *
```

Before deploying this Worker version, run this Supabase migration:

```text
supabase/migrations/013_ps99_league_run_key.sql
```

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
