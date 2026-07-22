# Tap Heroes Auto Rebirth

`MainAccountHold.ahk` is the separate basic hold macro:

- `F1`: lock onto the active Roblox window and start/pause
- `F3`: stop and exit
- Scans 13x15 boxes around the five configured client positions
- Checks/clicks the magenta target first, then performs staged movements for
  each green target—including the `(857,766)` target through `(805,709)`—and
  sends one jump at the end of every 50 ms loop
- After the two original green checks, scans the corrected 16:9 Client
  coordinate `(1260,207)` for `FF2172`, moves through `(1242,170)`, and clicks
  the detected red X
- After each original green upgrade click, polls that prompt region for up to
  350 ms so the warning has time to render before continuing
- The highest-priority magenta click is randomly offset by 1-3 pixels from the
  detected color pixel so it does not click directly on the sampled edge
- When no configured color is detected, clicks a random point in Client
  X `721-1204`, Y `166-170` before jumping
- Every 30 loops after jumping, moves through `(1321,554)` and clicks the
  second green location at `(1376,598)`

`MainAccountHold-16x10.ahk` launches the same macro with the earlier 16:10
popup handling: it checks `(1290,273)` for `FF155F`, stages through
`(1274,225)`, and retains the earlier lower-center green-button fallback.

`CameraCalibration.ahk` is the dependency-free, one-shot calibration helper:

- `F1`: move to a clear central gameplay point, then send one raw downward
  mouse unit while holding the right button, with no automatic zoom
- `F4`: send the exact opposite raw mouse unit to undo one F1 adjustment
- `F2`: scan Client `(442,558)` through `(502,596)` for `FFB5FF` with a
  tolerance of 2; the outline is green when detected and red when absent
- `Z`: scan the shared Level 21-60 region at Client `(309,37)` through
  `(337,71)` for `FFD0FF` with a tolerance of 2
- `X`: scan the Level 61-80 region at Client `(150,268)` through `(161,281)`
  for `FFC6FF` with a tolerance of 2
- `C`: scan the Level 81-100 region centered on Client `(178,284)`, covering
  `(172,277)` through `(184,291)`, for `FFD9FF` with a tolerance of 2
- `V`: scan the Level 101-120 region centered on Client `(234,145)`, covering
  `(228,138)` through `(240,152)`, for `FFAFFF` with a tolerance of 2
- `B`: scan the shared Level 121-160 region centered on Client `(389,230)`, covering
  `(383,223)` through `(395,237)`, for `FFD1FF` with a tolerance of 2
- `N`: scan the Level 161-180 region centered on Client `(378,257)`, covering
  `(372,250)` through `(384,264)`, for `FFDAFF` with a tolerance of 2
- `F3`: exit
- It does not walk, farm, use OCR, or repeat automatically.

`TapHeroesEvent.ahk` is an AutoHotkey v2 Area 1-20 calibration build for the
current event.

- `F1`: start/pause
- `F2`: run one OCR diagnostic and show the raw recognized text
- `F3`: stop and exit
- The fast loop checks the two supplied client pixels in priority order.
- When neither priority pixel is present, it clicks random points inside the
  supplied Area 1 rectangle every 35 ms.
- A click-through red outline shows the active rectangle while running.
- Each fresh F1 start holds `O` for 200 ms, right-drags the camera downward,
  holds `D` for 200 ms, and then holds `S` for 300 ms.
- OCR is isolated to the small level-title line and requires two matching reads
  before accepting a level.
- This calibration build pauses automatically at Level 21. Moving back to
  Level 20 rearms that stop so the Area 1 test can be repeated.

## OCR dependency

The script uses the Windows OCR engine through Descolada's AutoHotkey v2 OCR
library. Download `Lib/OCR.ahk` from:

https://github.com/Descolada/OCR

Place it at:

```text
macros/tap-heroes-auto-rebirth/Lib/OCR.ahk
```

No Tesseract installation is required. Without `OCR.ahk`, the color clicker can
still run, but milestone detection is disabled and `F2` explains the missing
file.

## Required client size

The supplied coordinates and screenshots use an approximately `800x600`
Roblox client area. A two-pixel tolerance accepts normal border/DPI differences
such as `800x599`, while rejecting sizes that would misalign the coordinates.

## Area 1 calibration values

All timing, camera-drag, click-rate, and rectangle values are grouped near the
top of the script. The outline uses the outer bounds of the four supplied
points: Client `(349,193)` through `(632,460)`. The calibration camera first
moves to Client `(400,250)`, then uses one raw relative mouse unit without
repositioning during capture. The main event macro still uses its previous
value until the new angle is confirmed.

Later-zone milestone actions remain disabled while `TEST_AREA_ONE_ONLY` is
`true`.
