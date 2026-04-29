# assets/

## embed-spacer.png

**Do not delete this file.**

`embed-spacer.png` is a 1×1 fully-transparent PNG used by `ingest.js` as a layout
hack to force Discord embeds to render at their maximum width (~600px).

Discord auto-sizes an embed's width to fit its text content. Attaching this image as
`embed.image` triggers the max-width behaviour without displaying anything visible,
which widens the three-column inline-field slots so leaderboard cards have noticeably
more horizontal breathing room.

Referenced in `ingest.js` via the `EMBED_SPACER_IMAGE_URL` constant:

```
https://raw.githubusercontent.com/OpalApocalypse/NONG_Leaderboard/main/assets/embed-spacer.png
```
