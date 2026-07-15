# Repo Organization

This repo is a GitHub Pages static site plus Cloudflare Worker, Supabase, and helper script code.
The root still contains the primary HTML entry points because the deployed site and bookmarks use
these filenames directly.

## Public Site Routes

Keep these in the repo root unless the Pages deploy workflow is updated and root redirect stubs are
added:

| File | Purpose |
|---|---|
| `index.html` | c0ld member leaderboard |
| `clans.html` | Clans Leaderboard |
| `global-leaderboard.html` | Global player leaderboard |
| `top-clan-filter.html` | Top Clan Filter summary |
| `top-clan-filter-detail.html` | Drill-down for one clan from Top Clan Filter |
| `live-clan.html` | Clan Lookup tool |
| `player-lookup.html` | Profile Lookup tool |
| `profile.html` | Player profile route |
| `clan-profile.html` | Clan profile route |

## Secondary Or Hidden Pages

These are direct-link/admin/special-purpose pages. They can be moved later, but moving them safely
requires either root redirect stubs or link rewrites:

| File | Purpose |
|---|---|
| `activity.html` | Member activity chart |
| `application-review.html` | Application review helper |
| `server.html` | Individual server detail page |
| `servers.html` | Approved server list and submissions |
| `macros.html` | Macros page |
| `officers.html` | Officer-only tooling |
| `players.html` | Older member grid |
| `clan-filter.html` | Older c0ld-only filter page |
| `Cinnamowopal.html` | Inventory detector page |

## League Pages

These are hidden from the main menu for now but remain available by direct URL:

| File | Purpose |
|---|---|
| `c0ld-leagues.html` | Curated c0ld league list |
| `c0ld-league-matches.html` | Manual/deep c0ld league discovery scanner |
| `top-leagues.html` | Top Leagues leaderboard |
| `league.html` | Generic league tracker page |
| `league-profile.html` | League member profile route |
| `yamo1-9.html` | YAMO1-9 view |
| `layok.html` | Redirect shim to NDCT |
| `wmsy.html` | Redirect shim to WMSY member leaderboard |

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

## Route Cleanup Plan

The next cleanup pass can move HTML content into folders, but it should be done as a route migration:

1. Update `.github/workflows/deploy-pages.yml` to publish the new folders.
2. Move page files into folders such as `pages/tools/`, `pages/leagues/`, `pages/admin/`, and `pages/legacy/`.
3. Add small root redirect stubs for every old URL that may still be bookmarked.
4. Update relative asset paths or add a reliable base-path strategy for moved pages.
5. Search all `href`, `location`, and generated URL references before committing.

Until then, keeping active HTML routes in root is intentional, not accidental.
