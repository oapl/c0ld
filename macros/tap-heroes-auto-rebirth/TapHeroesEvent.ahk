#Requires AutoHotkey v2.0
#SingleInstance Force
#Warn
#Include *i %A_ScriptDir%\Lib\OCR.ahk

; Tap Heroes event macro foundation.
; F1 starts/pauses. F2 performs one OCR diagnostic read. F3 stops and exits.

ROBLOX_WINDOW := "ahk_exe RobloxPlayerBeta.exe"
EXPECTED_CLIENT_WIDTH := 800
EXPECTED_CLIENT_HEIGHT := 600
CLIENT_SIZE_TOLERANCE := 2

PRIMARY_X := 489
PRIMARY_Y := 81
PRIMARY_COLOR := 0xFD52F9

SECONDARY_X := 489
SECONDARY_Y := 102
SECONDARY_COLOR := 0xD044CD

COLOR_TOLERANCE := 2
CLICK_INTERVAL_MS := 10
AREA_CLICK_INTERVAL_MS := 35
OCR_INTERVAL_MS := 450
OCR_CONFIRMATIONS := 2

; Area 1-20 calibration mode. Every fresh F1 start reapplies this setup.
TEST_AREA_ONE_ONLY := true
ZOOM_OUT_MS := 200
CAMERA_DRAG_START_X := 218
CAMERA_DRAG_START_Y := 30
CAMERA_DRAG_DISTANCE := 100
CAMERA_DRAG_SETTLE_MS := 100
MOVE_RIGHT_MS := 200
MOVE_DOWN_MS := 300

; Bounding rectangle derived from the outer edges of the four supplied points.
CLICK_AREA_LEFT := 349
CLICK_AREA_TOP := 193
CLICK_AREA_RIGHT := 632
CLICK_AREA_BOTTOM := 460
OUTLINE_THICKNESS := 3

; The title line is approximately Client X 250-550, Y 25-54 at 800x600.
OCR_X := 250
OCR_Y := 25
OCR_W := 300
OCR_H := 30

MILESTONES := Map(21, true, 41, true, 61, true, 81, true, 101, true
    , 121, true, 141, true, 161, true, 180, true)

global Running := false
global OcrBusy := false
global LastOcrLevel := 0
global StableOcrReads := 0
global CurrentLevel := 0
global HighestLevelThisCycle := 0
global CycleNumber := 1
global HandledMilestones := Map()
global AwaitingLevelOne := false
global LastRawOcrText := ""
global LogFile := A_ScriptDir "\TapHeroesEvent.log"
global OCRAvailable := IsSet(OCR)
global LastAreaClickTick := 0
global OutlineGuis := []

CoordMode "Mouse", "Client"
CoordMode "Pixel", "Client"
SetMouseDelay -1
SetWinDelay 0
SetControlDelay -1
DllCall "Winmm\timeBeginPeriod", "UInt", 1
OnExit Cleanup

if A_Args.Length && A_Args[1] = "--validate"
    ExitApp

F1::ToggleMacro()
F2::RunOcrDiagnostic()
F3::StopMacro()

ToggleMacro() {
    global Running, OCRAvailable, ROBLOX_WINDOW, OCR_INTERVAL_MS
    global EXPECTED_CLIENT_WIDTH, EXPECTED_CLIENT_HEIGHT, CLIENT_SIZE_TOLERANCE
    global CLICK_INTERVAL_MS, CycleNumber
    global LastAreaClickTick

    if Running {
        PauseMacro()
        return
    }

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

    WinActivate hwnd
    Running := true
    LastAreaClickTick := 0
    ShowClickAreaOutline()
    RunAreaOneSetup()
    if !Running
        return

    SetTimer ClickTick, CLICK_INTERVAL_MS
    if OCRAvailable
        SetTimer OcrTick, OCR_INTERVAL_MS

    AppendLog("START cycle=" CycleNumber " ocr=" (OCRAvailable ? "available" : "missing"))
    ShowStatus(OCRAvailable
        ? "RUNNING | Click + OCR | Cycle " CycleNumber
        : "RUNNING | Click only | Install Lib\OCR.ahk", 2000)
}

PauseMacro() {
    global Running
    Running := false
    SetTimer ClickTick, 0
    SetTimer OcrTick, 0
    ReleaseSetupInputs()
    HideClickAreaOutline()
    AppendLog("PAUSE")
    ShowStatus("PAUSED | F1 resumes | F3 exits", 2000)
}

StopMacro() {
    PauseMacro()
    ExitApp
}

Cleanup(*) {
    SetTimer ClickTick, 0
    SetTimer OcrTick, 0
    ReleaseSetupInputs()
    DestroyClickAreaOutline()
    DllCall "Winmm\timeEndPeriod", "UInt", 1
    ToolTip()
}

ClickTick() {
    global Running, ROBLOX_WINDOW
    global PRIMARY_X, PRIMARY_Y, PRIMARY_COLOR
    global SECONDARY_X, SECONDARY_Y, SECONDARY_COLOR, COLOR_TOLERANCE
    global AREA_CLICK_INTERVAL_MS, LastAreaClickTick
    global CLICK_AREA_LEFT, CLICK_AREA_TOP, CLICK_AREA_RIGHT, CLICK_AREA_BOTTOM
    if !Running || !WinActive(ROBLOX_WINDOW)
        return

    ; The primary target always wins when both happen to be visible.
    primary := PixelGetColor(PRIMARY_X, PRIMARY_Y, "RGB")
    if ColorNear(primary, PRIMARY_COLOR, COLOR_TOLERANCE) {
        Click PRIMARY_X, PRIMARY_Y
        return
    }

    secondary := PixelGetColor(SECONDARY_X, SECONDARY_Y, "RGB")
    if ColorNear(secondary, SECONDARY_COLOR, COLOR_TOLERANCE) {
        Click SECONDARY_X, SECONDARY_Y
        return
    }

    if A_TickCount - LastAreaClickTick >= AREA_CLICK_INTERVAL_MS {
        clickX := Random(CLICK_AREA_LEFT + 5, CLICK_AREA_RIGHT - 5)
        clickY := Random(CLICK_AREA_TOP + 5, CLICK_AREA_BOTTOM - 5)
        Click clickX, clickY
        LastAreaClickTick := A_TickCount
    }
}

RunAreaOneSetup() {
    global Running, ZOOM_OUT_MS
    global CAMERA_DRAG_START_X, CAMERA_DRAG_START_Y, CAMERA_DRAG_DISTANCE
    global CAMERA_DRAG_SETTLE_MS
    global MOVE_RIGHT_MS, MOVE_DOWN_MS

    AppendLog("AREA 1 SETUP begin")
    ShowStatus("AREA 1 SETUP | Zooming out", 0)
    SendEvent "{o down}"
    Sleep ZOOM_OUT_MS
    SendEvent "{o up}"
    if !Running
        return

    ShowStatus("AREA 1 SETUP | Setting top-down camera", 0)
    MouseMove CAMERA_DRAG_START_X, CAMERA_DRAG_START_Y, 0
    Click "Right Down"
    Sleep 50
    if Running
        MouseMove 0, CAMERA_DRAG_DISTANCE, 0, "R"
    Sleep CAMERA_DRAG_SETTLE_MS
    Click "Right Up"
    if !Running
        return

    ShowStatus("AREA 1 SETUP | Moving right", 0)
    SendEvent "{d down}"
    Sleep MOVE_RIGHT_MS
    SendEvent "{d up}"
    if !Running
        return

    ShowStatus("AREA 1 SETUP | Moving down", 0)
    SendEvent "{s down}"
    Sleep MOVE_DOWN_MS
    SendEvent "{s up}"
    AppendLog("AREA 1 SETUP complete")
}

ReleaseSetupInputs() {
    SendEvent "{o up}{d up}{s up}{RButton up}"
}

ShowClickAreaOutline() {
    global ROBLOX_WINDOW, CLICK_AREA_LEFT, CLICK_AREA_TOP
    global CLICK_AREA_RIGHT, CLICK_AREA_BOTTOM, OUTLINE_THICKNESS, OutlineGuis

    hwnd := WinExist(ROBLOX_WINDOW)
    if !hwnd
        return

    topLeft := ClientPointToScreen(hwnd, CLICK_AREA_LEFT, CLICK_AREA_TOP)
    bottomRight := ClientPointToScreen(hwnd, CLICK_AREA_RIGHT, CLICK_AREA_BOTTOM)
    width := bottomRight.x - topLeft.x + 1
    height := bottomRight.y - topLeft.y + 1
    border := OUTLINE_THICKNESS

    if !OutlineGuis.Length {
        Loop 4 {
            line := Gui("+AlwaysOnTop -Caption +ToolWindow +E0x20")
            line.BackColor := "FF0000"
            OutlineGuis.Push(line)
        }
    }

    OutlineGuis[1].Show("NA x" topLeft.x " y" topLeft.y " w" width " h" border)
    OutlineGuis[2].Show("NA x" topLeft.x " y" (bottomRight.y - border + 1)
        " w" width " h" border)
    OutlineGuis[3].Show("NA x" topLeft.x " y" topLeft.y " w" border " h" height)
    OutlineGuis[4].Show("NA x" (bottomRight.x - border + 1) " y" topLeft.y
        " w" border " h" height)
}

HideClickAreaOutline() {
    global OutlineGuis
    for line in OutlineGuis
        line.Hide()
}

DestroyClickAreaOutline() {
    global OutlineGuis
    for line in OutlineGuis
        line.Destroy()
    OutlineGuis := []
}

ClientPointToScreen(hwnd, x, y) {
    point := Buffer(8, 0)
    NumPut "Int", x, point, 0
    NumPut "Int", y, point, 4
    DllCall "ClientToScreen", "Ptr", hwnd, "Ptr", point
    return {x: NumGet(point, 0, "Int"), y: NumGet(point, 4, "Int")}
}

ColorNear(actual, expected, tolerance) {
    actualRed := (actual >> 16) & 0xFF
    actualGreen := (actual >> 8) & 0xFF
    actualBlue := actual & 0xFF
    expectedRed := (expected >> 16) & 0xFF
    expectedGreen := (expected >> 8) & 0xFF
    expectedBlue := expected & 0xFF
    return Abs(actualRed - expectedRed) <= tolerance
        && Abs(actualGreen - expectedGreen) <= tolerance
        && Abs(actualBlue - expectedBlue) <= tolerance
}

OcrTick() {
    global Running, OcrBusy
    if !Running || OcrBusy
        return
    OcrBusy := true
    try {
        ReadAndProcessLevel()
    } catch Error as err {
        AppendLog("OCR ERROR: " err.Message)
    } finally {
        OcrBusy := false
    }
}

ReadAndProcessLevel(showDiagnostic := false) {
    global ROBLOX_WINDOW, OCR_X, OCR_Y, OCR_W, OCR_H, LastRawOcrText
    global LastOcrLevel, StableOcrReads, OCR_CONFIRMATIONS

    hwnd := WinExist(ROBLOX_WINDOW)
    if !hwnd
        return 0

    result := OCR.FromWindow(hwnd, {
        scale: 4,
        grayscale: 1,
        X: OCR_X,
        Y: OCR_Y,
        W: OCR_W,
        H: OCR_H
    })
    LastRawOcrText := Trim(StrReplace(result.Text, "`n", " "))
    level := ParseLevel(LastRawOcrText)

    if showDiagnostic {
        message := "OCR text: " (LastRawOcrText = "" ? "<empty>" : LastRawOcrText)
            . "`nParsed level: " (level ? level : "none")
            . "`nCrop: Client " OCR_X "," OCR_Y " " OCR_W "x" OCR_H
        MsgBox message
        return level
    }

    if !level {
        LastOcrLevel := 0
        StableOcrReads := 0
        return 0
    }

    if level = LastOcrLevel
        StableOcrReads += 1
    else {
        LastOcrLevel := level
        StableOcrReads := 1
    }

    if StableOcrReads >= OCR_CONFIRMATIONS
        AcceptLevel(level)
    return level
}

ParseLevel(text) {
    ; Preferred result: "Ruins Level 21". The second expression tolerates
    ; occasional OCR confusion between lowercase L and uppercase I.
    if RegExMatch(text, "i)\bLeve[lI1]\s*[:#-]?\s*(\d{1,3})\b", &match)
        return Integer(match[1])
    return 0
}

AcceptLevel(level) {
    global CurrentLevel, HighestLevelThisCycle, AwaitingLevelOne
    global HandledMilestones, MILESTONES, CycleNumber, TEST_AREA_ONE_ONLY

    if level = CurrentLevel
        return
    CurrentLevel := level

    if level > HighestLevelThisCycle
        HighestLevelThisCycle := level

    AppendLog("LEVEL " level)

    ; During Area 1 calibration, walking back from 21 to 20 rearms the stop.
    if TEST_AREA_ONE_ONLY && level <= 20 && HandledMilestones.Has(21)
        HandledMilestones.Delete(21)

    if level = 1 && (AwaitingLevelOne || HighestLevelThisCycle >= 180) {
        CycleNumber += 1
        HighestLevelThisCycle := 1
        AwaitingLevelOne := false
        HandledMilestones := Map()
        AppendLog("RESET cycle=" CycleNumber)
        ShowStatus("RESET CONFIRMED | Cycle " CycleNumber, 2500)
        return
    }

    if MILESTONES.Has(level) && !HandledMilestones.Has(level) {
        HandledMilestones[level] := true
        if level = 180
            AwaitingLevelOne := true
        HandleMilestone(level)
    }
}

HandleMilestone(level) {
    global TEST_AREA_ONE_ONLY

    if TEST_AREA_ONE_ONLY {
        if level = 21 {
            AppendLog("AREA 1 TEST complete at level 21")
            PauseMacro()
            ShowStatus("LEVEL 21 | AREA 1 TEST PAUSED", 4000)
        }
        return
    }

    ; Camera/character actions belong here after they are calibrated.
    ; This function is deliberately single-fire for each milestone per cycle.
    if level = 180 {
        AppendLog("MILESTONE 180 | boss/reset phase")
        ShowStatus("LEVEL 180 CONFIRMED | Waiting for reset", 2500)
        return
    }

    AppendLog("MILESTONE " level " | camera adjustment required")
    ShowStatus("LEVEL " level " CONFIRMED | Camera action pending", 2000)
}

RunOcrDiagnostic() {
    global OCRAvailable, ROBLOX_WINDOW
    if !OCRAvailable {
        MsgBox "OCR is not installed.`n`nPlace OCR.ahk in:`n" A_ScriptDir "\Lib\OCR.ahk"
        return
    }
    hwnd := WinExist(ROBLOX_WINDOW)
    if !hwnd {
        MsgBox "Roblox was not found."
        return
    }
    ReadAndProcessLevel(true)
}

AppendLog(message) {
    global LogFile
    FileAppend FormatTime(, "yyyy-MM-dd HH:mm:ss") " | " message "`n", LogFile, "UTF-8"
}

ShowStatus(message, duration := 0) {
    ToolTip message, 10, 10
    if duration
        SetTimer ClearStatus, -duration
}

ClearStatus() {
    ToolTip()
}
