# Repo Organization

This repo is a GitHub Pages static site plus Cloudflare Worker, Supabase, and
helper script code.

HTML source files live under `pages/` so the repository root stays usable. The
GitHub Pages deploy workflow intentionally flattens those files into `_site/` by
filename, which keeps existing public URLs such as `index.html`, `profile.html`,
and `top-clan-filter.html` working.

## Public Site Routes

| Source file | Public URL | Purpose |
|---|---|---|
| `pages/site/index.html` | `index.html` | c0ld member leaderboard |
| `pages/site/clans.html` | `clans.html` | Clans Leaderboard |
| `pages/site/global-leaderboard.html` | `global-leaderboard.html` | Global player leaderboard |
| `pages/tools/top-clan-filter.html` | `top-clan-filter.html` | Top Clan Filter summary |
| `pages/tools/top-clan-filter-detail.html` | `top-clan-filter-detail.html` | Drill-down for one clan from Top Clan Filter |
| `pages/tools/clans-activity.html` | `clans-activity.html` | Top-clan roster activity summary |
| `pages/tools/clan-activity-detail.html` | `clan-activity-detail.html` | Drill-down for one clan from Clans Activity |
| `pages/tools/activity-feed.html` | `activity-feed.html` | All-clans activity blotter |
| `pages/tools/live-clan.html` | `live-clan.html` | Clan Lookup tool |
| `pages/tools/player-lookup.html` | `player-lookup.html` | Player Lookup tool |
| `pages/profiles/profile.html` | `profile.html` | Player profile route |
| `pages/profiles/clan-profile.html` | `clan-profile.html` | Clan profile route |

## Secondary Or Hidden Pages

These remain available by direct URL after deploy:

| Source file | Public URL | Purpose |
|---|---|---|
| `pages/analytics/activity.html` | `activity.html` | Member activity chart |
| `pages/admin/application-review.html` | `application-review.html` | Application review helper |
| `pages/admin/officers.html` | `officers.html` | Officer-only tooling |
| `pages/servers/server.html` | `server.html` | Individual server detail page |
| `pages/servers/servers.html` | `servers.html` | Approved server list and submissions |
| `pages/tools/macros.html` | `macros.html` | Macros page |
| `pages/legacy/players.html` | `players.html` | Older member grid |
| `pages/legacy/clan-filter.html` | `clan-filter.html` | Older c0ld-only filter page |
| `pages/legacy/Cinnamowopal.html` | `Cinnamowopal.html` | Inventory detector page |

## League Pages

These are hidden from the main menu for now but remain available by direct URL:

| Source file | Public URL | Purpose |
|---|---|---|
| `pages/leagues/c0ld-leagues.html` | `c0ld-leagues.html` | Curated c0ld league list |
| `pages/leagues/c0ld-league-matches.html` | `c0ld-league-matches.html` | Manual/deep c0ld league discovery scanner |
| `pages/leagues/top-leagues.html` | `top-leagues.html` | Top Leagues leaderboard |
| `pages/leagues/league.html` | `league.html` | Generic league tracker page |
| `pages/leagues/league-profile.html` | `league-profile.html` | League member profile route |
| `pages/leagues/yamo1-9.html` | `yamo1-9.html` | YAMO1-9 view |
| `pages/redirects/layok.html` | `layok.html` | Redirect shim to NDCT |
| `pages/redirects/wmsy.html` | `wmsy.html` | Redirect shim to WMSY member leaderboard |

## Non-Page Folders

| Folder | Purpose |
|---|---|
| `assets/` | Shared frontend JS, CSS, images, mascots, avatars, and audio assets |
| `assets/audio/` | Audio files used or preserved by the site |
| `Data/` | Static JSON/CSV generated for GitHub Pages |
| `cloudflare/` | Worker source files and Wrangler examples |
| `discord-bot/` | Non-Worker Discord bot reference code |
| `scripts/` | Local and GitHub helper scripts |
| `scripts/legacy/` | Retired scripts kept for reference |
| `supabase/` | SQL setup, migrations, and cleanup/audit scripts |
| `backups/` | Large legacy archives that should not sit in the site root |
| `.github/workflows/` | GitHub Actions for Pages deployment and generated data |

## Deployment Notes

The source tree is organized by page category, but the public site is still flat.
This is handled in `.github/workflows/deploy-pages.yml`:

1. Copy every `pages/**/*.html` file into `_site/` using only its basename.
2. Fail the build if two source files would publish to the same public filename.
3. Copy `Data/` and `assets/` unchanged.
4. Generate individual clan profile folders under `_site/clans/`.

Because public filenames are preserved, frontend links and Worker redirects can
continue to reference `profile.html`, `servers.html`, `macros.html`, and the
other deployed route names.
