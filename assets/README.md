# assets/

## embed-spacer.png

**Do not delete this file.**

`embed-spacer.png` is a **600×1 fully-transparent PNG** used by `ingest.js` as a layout
hack to force Discord embeds to render at their maximum width (~600px).

Discord renders an embed image at its natural pixel width. A 600 px wide image locks
the embed to Discord's maximum inner width, which widens the three-column inline-field
slots so leaderboard cards have noticeably more horizontal breathing room. The image is
fully transparent so it remains visually invisible — only its bounding box matters.

**The 600 px width is load-bearing. Do not "optimise" this file back down to 1×1.**
Replacing it with a smaller image will cause the three embed posts to render at
inconsistent / narrow widths again.

Referenced in `ingest.js` via the `EMBED_SPACER_IMAGE_URL` constant:

```
https://raw.githubusercontent.com/OpalApocalypse/NONG_Leaderboard/main/assets/embed-spacer.png
```
