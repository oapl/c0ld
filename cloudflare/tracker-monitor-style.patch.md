# Private Server Tracker — Monitor-Style Payload

This branch updates the persistent private-server tracker post to match the visual language used by the Luna monitor posts:

- large emoji title
- Genie Fox thumbnail on the right
- compact status/update summary
- divider-separated server list
- branded footer with an absolute Discord timestamp

Target worker: `cloudflare/c0ld-servers-worker.js`

The implementation replaces `buildTrackerDiscordPayload(state)` and adds small formatting helpers. See the accompanying pull request for the exact code change.
