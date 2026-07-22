#Requires AutoHotkey v2.0
#SingleInstance Force
#Warn

; Tap Heroes one-shot camera calibration.
; F1 applies one camera tilt. F4 applies the opposite tilt.
; F2 tests Level 1-20. Z tests Level 21-60. X tests Level 61-80.
; C tests Level 81-100. V tests Level 101-120. B tests Level 121-160.
; N tests Level 161-180. F3 exits.

ROBLOX_WINDOW := "ahk_exe RobloxPlayerBeta.exe"
EXPECTED_CLIENT_WIDTH := 800
EXPECTED_CLIENT_HEIGHT := 600
CLIENT_SIZE_TOLERANCE := 2

ZOOM_OUT_MS := 0
CAMERA_SAFE_X := 400
CAMERA_SAFE_Y := 250
CAMERA_DRAG_DISTANCE := 1
CAMERA_DRAG_SETTLE_MS := 100

OUTLINE_THICKNESS := 3

global CameraBusy := false
global ZONE_ONE := {
    label: "ZONE 1-20", left: 442, top: 558, right: 502, bottom: 596,
    color: 0xFFB5FF, tolerance: 2, guis: []
}
; The same signature is deliberately assigned to both 21-40 and 41-60.
global ZONE_TWENTY_ONE := {
    label: "ZONE 21-60", left: 309, top: 37, right: 337, bottom: 71,
    color: 0xFFD0FF, tolerance: 2, guis: []
}
; Bottom-left was inferred as Client (150,281) from Screen (829,613),
; because the supplied Client X value 821 is outside an 800-pixel client.
global ZONE_SIXTY_ONE := {
    label: "ZONE 61-80", left: 150, top: 268, right: 161, bottom: 281,
    color: 0xFFC6FF, tolerance: 2, guis: []
}
global ZONE_EIGHTY_ONE := {
    label: "ZONE 81-100", left: 172, top: 277, right: 184, bottom: 291,
    color: 0xFFD9FF, tolerance: 2, guis: []
}
global ZONE_ONE_HUNDRED_ONE := {
    label: "ZONE 101-120", left: 228, top: 138, right: 240, bottom: 152,
    color: 0xFFAFFF, tolerance: 2, guis: []
}
global ZONE_ONE_HUNDRED_TWENTY_ONE := {
    label: "ZONE 121-160", left: 383, top: 223, right: 395, bottom: 237,
    color: 0xFFD1FF, tolerance: 2, guis: []
}
global ZONE_ONE_HUNDRED_FORTY_ONE := {
    label: "ZONE 161-180", left: 372, top: 250, right: 384, bottom: 264,
    color: 0xFFDAFF, tolerance: 2, guis: []
}
global ZONE_CONFIGS := [ZONE_ONE, ZONE_TWENTY_ONE, ZONE_SIXTY_ONE
    , ZONE_EIGHTY_ONE, ZONE_ONE_HUNDRED_ONE, ZONE_ONE_HUNDRED_TWENTY_ONE
    , ZONE_ONE_HUNDRED_FORTY_ONE]

CoordMode "Mouse", "Client"
CoordMode "Pixel", "Client"
SetMouseDelay -1
SetWinDelay 0
DllCall "Winmm\timeBeginPeriod", "UInt", 1
OnExit Cleanup

if A_Args.Length && A_Args[1] = "--validate"
    ExitApp

F1::RunCameraCalibration()
F4::RunCameraCalibration(-1)
F2::CheckZone(ZONE_ONE)
z::CheckZone(ZONE_TWENTY_ONE)
x::CheckZone(ZONE_SIXTY_ONE)
c::CheckZone(ZONE_EIGHTY_ONE)
v::CheckZone(ZONE_ONE_HUNDRED_ONE)
b::CheckZone(ZONE_ONE_HUNDRED_TWENTY_ONE)
n::CheckZone(ZONE_ONE_HUNDRED_FORTY_ONE)
F3::ExitApp()

RunCameraCalibration(direction := 1) {
    global CameraBusy, ROBLOX_WINDOW
    global EXPECTED_CLIENT_WIDTH, EXPECTED_CLIENT_HEIGHT, CLIENT_SIZE_TOLERANCE
    global ZOOM_OUT_MS, CAMERA_SAFE_X, CAMERA_SAFE_Y
    global CAMERA_DRAG_DISTANCE, CAMERA_DRAG_SETTLE_MS

    if CameraBusy
        return

    hwnd := WinExist(ROBLOX_WINDOW)
    if !hwnd {
        ShowStatus("Roblox was not found.", 2500)
        return
    }

    WinGetClientPos ,, &clientWidth, &clientHeight, hwnd
    if Abs(clientWidth - EXPECTED_CLIENT_WIDTH) > CLIENT_SIZE_TOLERANCE
        || Abs(clientHeight - EXPECTED_CLIENT_HEIGHT) > CLIENT_SIZE_TOLERANCE {
        ShowStatus("Expected about 800x600; found " clientWidth "x" clientHeight ".", 3500)
        return
    }

    CameraBusy := true
    try {
        WinActivate hwnd
        Sleep 100

        if ZOOM_OUT_MS > 0 {
            ShowStatus("Zooming out...", 0)
            SendEvent "{o down}"
            Sleep ZOOM_OUT_MS
            SendEvent "{o up}"
        }

        ShowStatus(direction > 0 ? "Tilting camera down..." : "Undoing camera tilt...", 0)
        ; Move over unobstructed gameplay before camera capture. This happens
        ; before RButton is held, so it cannot rotate the camera.
        MouseMove CAMERA_SAFE_X, CAMERA_SAFE_Y, 0
        Sleep 100
        ; Roblox consumes raw relative mouse movement while rotating the camera.
        ; Do not reposition the cursor after capture: that can become a huge delta.
        SendEvent "{RButton down}"
        Sleep 50
        DllCall "mouse_event"
            , "UInt", 0x0001
            , "Int", 0
            , "Int", CAMERA_DRAG_DISTANCE * direction
            , "UInt", 0
            , "UPtr", 0
        Sleep CAMERA_DRAG_SETTLE_MS
        SendEvent "{RButton up}"
        Sleep 50
        ShowStatus(direction > 0
            ? "CAMERA TILTED | F4 reverses | F3 exits"
            : "CAMERA TILT REVERSED | F1 reapplies | F3 exits", 4000)
    } finally {
        ReleaseInputs()
        CameraBusy := false
    }
}

ReleaseInputs() {
    SendEvent "{o up}{RButton up}"
}

CheckZone(zone) {
    global ROBLOX_WINDOW

    hwnd := WinExist(ROBLOX_WINDOW)
    if !hwnd {
        ShowStatus("Roblox was not found.", 2500)
        return
    }

    WinActivate hwnd
    Sleep 50
    detected := PixelSearch(&foundX, &foundY
        , zone.left, zone.top, zone.right, zone.bottom
        , zone.color, zone.tolerance)

    if detected {
        actualColor := PixelGetColor(foundX, foundY, "RGB")
        ShowZoneOutline(zone, "00FF00")
        ShowStatus(zone.label " DETECTED | Client " foundX "," foundY
            " | Color " Format("{:06X}", actualColor), 5000)
    } else {
        ShowZoneOutline(zone, "FF0000")
        ShowStatus(zone.label " NOT DETECTED | Expected "
            Format("{:06X}", zone.color) " +/-" zone.tolerance, 5000)
    }
}

ShowZoneOutline(zone, color := "FF0000") {
    global ROBLOX_WINDOW, OUTLINE_THICKNESS

    hwnd := WinExist(ROBLOX_WINDOW)
    if !hwnd {
        ShowStatus("Roblox was not found.", 2500)
        return
    }

    topLeft := ClientPointToScreen(hwnd, zone.left, zone.top)
    bottomRight := ClientPointToScreen(hwnd, zone.right, zone.bottom)
    width := bottomRight.x - topLeft.x + 1
    height := bottomRight.y - topLeft.y + 1
    border := OUTLINE_THICKNESS

    if !zone.guis.Length {
        Loop 4 {
            line := Gui("+AlwaysOnTop -Caption +ToolWindow +E0x20")
            zone.guis.Push(line)
        }
    }

    for line in zone.guis {
        line.Hide()
        line.BackColor := color
    }

    zone.guis[1].Show("NA x" topLeft.x " y" topLeft.y " w" width " h" border)
    zone.guis[2].Show("NA x" topLeft.x " y" (bottomRight.y - border + 1)
        " w" width " h" border)
    zone.guis[3].Show("NA x" topLeft.x " y" topLeft.y " w" border " h" height)
    zone.guis[4].Show("NA x" (bottomRight.x - border + 1) " y" topLeft.y
        " w" border " h" height)
}

DestroyScanOutline() {
    global ZONE_CONFIGS
    for zone in ZONE_CONFIGS {
        for line in zone.guis
            line.Destroy()
        zone.guis := []
    }
}

ClientPointToScreen(hwnd, x, y) {
    point := Buffer(8, 0)
    NumPut "Int", x, point, 0
    NumPut "Int", y, point, 4
    DllCall "ClientToScreen", "Ptr", hwnd, "Ptr", point
    return {x: NumGet(point, 0, "Int"), y: NumGet(point, 4, "Int")}
}

ShowStatus(message, duration := 0) {
    ToolTip message, 10, 10
    if duration
        SetTimer ClearStatus, -duration
}

ClearStatus() {
    ToolTip()
}

Cleanup(*) {
    ReleaseInputs()
    DestroyScanOutline()
    DllCall "Winmm\timeEndPeriod", "UInt", 1
    ToolTip()
}
