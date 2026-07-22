#Requires AutoHotkey v2.0

; Reusable Roblox camera helpers.
; Include this file from another macro, then call RotateCameraLeft() or RotateCameraRight().

RotateCamera(direction := "right", dragPixelsPerQuarterTurn := 400, zoomMilliseconds := 1000, startX := "", startY := "", settleMilliseconds := 150) {
    if (startX = "")
        startX := A_ScreenWidth / 2

    if (startY = "")
        startY := A_ScreenHeight / 2

    direction := StrLower(direction)
    switch direction {
        case "left", "l":
            dragX := -Abs(dragPixelsPerQuarterTurn)
        case "right", "r":
            dragX := Abs(dragPixelsPerQuarterTurn)
        default:
            throw Error("RotateCamera direction must be 'left' or 'right'.", -1, direction)
    }

    ClickAndDragCamera(dragX, 0, startX, startY)
    Sleep settleMilliseconds

    if (zoomMilliseconds > 0)
        ZoomCameraOut(zoomMilliseconds)
}

RotateCameraLeft(dragPixelsPerQuarterTurn := 400, zoomMilliseconds := 1000, startX := "", startY := "") {
    RotateCamera("left", dragPixelsPerQuarterTurn, zoomMilliseconds, startX, startY)
}

RotateCameraRight(dragPixelsPerQuarterTurn := 400, zoomMilliseconds := 1000, startX := "", startY := "") {
    RotateCamera("right", dragPixelsPerQuarterTurn, zoomMilliseconds, startX, startY)
}

ZoomCameraOut(milliseconds := 1000) {
    Send "{o Down}"
    Sleep milliseconds
    Send "{o Up}"
}

ClickAndDragCamera(relativeX, relativeY, startX := "", startY := "", holdMilliseconds := 100) {
    if (startX = "")
        startX := A_ScreenWidth / 2

    if (startY = "")
        startY := A_ScreenHeight / 2

    oldMouseCoordMode := A_CoordModeMouse
    CoordMode "Mouse", "Screen"
    try {
        SendEvent "{Click, " startX ", " startY ", 1, Down Right}"
        Sleep holdMilliseconds
        MouseMove relativeX, relativeY,, "R"
        Click "Up Right"
    } finally {
        CoordMode "Mouse", oldMouseCoordMode
    }
}
