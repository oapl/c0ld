# assets/

## embed-spacer.png

**Do not delete this file.**

`embed-spacer.png` is a **1200×1 fully-transparent PNG** used by `ingest.js` as a layout
hack to force Discord embeds to render at their maximum width. The wider image is a
speculative test: Discord *may* honour images wider than the documented ~600 px cap on
modern desktop clients, yielding more horizontal breathing room per leaderboard card.
If Discord downscales it to 600 px the embed is unchanged — no harm either way.

The image **must** be color type 6 (RGBA) so every pixel carries an explicit alpha byte
of 0. Color type 2 (RGB) has no alpha channel and causes the image to render as a faint
visible line at the bottom of the embed — that is what this file previously suffered from.
With all pixels set to RGBA (0, 0, 0, 0) the spacer is truly invisible.

**The width is load-bearing. Do not "optimise" this file back down to 1×1.**
Replacing it with a smaller image will cause the three embed posts to render at
inconsistent / narrow widths again.

Referenced in `ingest.js` via the `EMBED_SPACER_IMAGE_URL` constant:

```
https://raw.githubusercontent.com/OpalApocalypse/NONG_Leaderboard/main/assets/embed-spacer.png
```
