# YAMO League API Worker

This stores BIG Games `/v1/leagues/YAMO` snapshots in Supabase and exposes the stored data to `yamo.html`.

## 1. Run the Supabase migration

Run this in the Supabase SQL Editor:

```sql
supabase/migrations/010_ps99_league_snapshots.sql
```

It creates:

- `ps99_league_snapshots` — append-only history.
- `ps99_league_current` — latest rows for each league/member.

## 2. Deploy the Worker

Create a Worker named:

```text
c0ld-league-api-worker
```

Paste/deploy:

```text
cloudflare/yamo-league-api-worker.js
```

Use this file as the Wrangler reference:

```text
cloudflare/wrangler-league-api.toml.example
```

Required variables/secrets:

```text
LEAGUE_NAME=YAMO
SITE_ORIGINS=https://oapl.github.io
PUBLIC_CACHE_SECONDS=5
RETENTION_HOURS=336
INGEST_LEAGUES=true
SUPABASE_URL=https://YOUR-PROJECT.supabase.co
SUPABASE_SERVICE_KEY=<secret>
INGEST_ADMIN_TOKEN=<secret>
```

Add this cron trigger:

```text
*/5 * * * *
```

## 3. Test one manual ingest

```powershell
$token = "YOUR_INGEST_ADMIN_TOKEN"
$worker = "https://c0ld-league-api-worker.opal-dde.workers.dev"

Invoke-RestMethod -Method Post "$worker/api/leagues/ingest?league=YAMO" `
  -Headers @{ Authorization = "Bearer $token" }
```

Then test the public current endpoint:

```text
https://c0ld-league-api-worker.opal-dde.workers.dev/api/leagues/current?league=YAMO
```

## Endpoints

| Endpoint | Purpose |
|---|---|
| `GET /api/health` | Worker health check. |
| `POST /api/leagues/ingest?league=YAMO` | Protected manual ingest. |
| `GET /api/leagues/current?league=YAMO` | Latest stored YAMO data with 5m/1h/6h/12h/24h gains. |
| `GET /api/leagues/history?league=YAMO&hours=24` | Raw stored rows for export/debugging. |

`yamo.html` currently points at:

```text
https://c0ld-league-api-worker.opal-dde.workers.dev
```

If the deployed Worker uses a different URL, update `LEAGUE_API_BASE` in `yamo.html`.
