# Discord Global Search Bot Example

`global-search-bot.example.mjs` is a small Discord.js example for the c0ld global
rank cache.

It listens for:

```text
!search Cinnamowopal
```

and calls:

```text
https://c0ld-clan-api-worker.opal-dde.workers.dev/api/global/search?q=Cinnamowopal&clan=c0ld
```

## Required

- Node.js 18+
- `discord.js`
- A Discord bot token
- The **Message Content Intent** enabled for the bot in the Discord Developer Portal

## Environment

```powershell
$env:DISCORD_BOT_TOKEN = "YOUR_BOT_TOKEN"
$env:CLAN_API_BASE = "https://c0ld-clan-api-worker.opal-dde.workers.dev"
$env:CLAN_NAME = "c0ld"
$env:SEARCH_PREFIX = "!"
node .\discord-bot\global-search-bot.example.mjs
```

The bot reads from the same Supabase-backed worker cache as the website. It does
not scan the global leaderboard itself.
