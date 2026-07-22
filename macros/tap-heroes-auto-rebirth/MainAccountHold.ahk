#Requires AutoHotkey v2.0
#SingleInstance Force
#Warn

; Basic main-account hold macro.
; F1 starts/pauses. F3 stops and exits.

ROBLOX_WINDOW := "ahk_exe RobloxPlayerBeta.exe"
LOOP_INTERVAL_MS := 50
REFOCUS_WAIT_SECONDS := 0.2
COLOR_TOLERANCE := 2
SCAN_HALF_WIDTH := 6
SCAN_HALF_HEIGHT := 7
STAGING_PAUSE_MS := 15
TARGET_MOVE_SPEED := 1
POST_JUMP_PAUSE_MS := 15
POST_JUMP_GREEN_EVERY_LOOPS := 30
PROMPT_RENDER_DELAY_MS := 75
PROMPT_WAIT_MS := 350
PROMPT_POLL_MS := 25
LEGACY_16X10 := StrLower(A_ScriptName) = "mainaccounthold-16x10.ahk"

PRIMARY_X := 1170
PRIMARY_Y := 190
PRIMARY_COLOR := 0xFF54F9
PRIMARY_CLICK_JITTER := 3

SECOND_X := 1376
SECOND_Y := 598
SECOND_COLOR := 0x78F50B
SECOND_STAGE_X := 1321
SECOND_STAGE_Y := 554

THIRD_X := 1367
THIRD_Y := 689
THIRD_COLOR := 0x95FA16
THIRD_STAGE_X := 1327
THIRD_STAGE_Y := 691

if LEGACY_16X10 {
    PINK_X := 1290
    PINK_Y := 273
    PINK_COLOR := 0xFF155F
    PINK_STAGE_X := 1274
    PINK_STAGE_Y := 225
    PROMPT_OK_LEFT := 820
    PROMPT_OK_TOP := 650
    PROMPT_OK_RIGHT := 1110
    PROMPT_OK_BOTTOM := 780
    global PROMPT_GREEN_COLORS := [0x95FA16, 0x86F711, 0x78F50B
        , 0x94E821, 0x6BE112]
} else {
    PINK_X := 1260
    PINK_Y := 207
    PINK_COLOR := 0xFF2172
    PINK_STAGE_X := 1242
    PINK_STAGE_Y := 170
    PROMPT_OK_LEFT := 0
    PROMPT_OK_TOP := 0
    PROMPT_OK_RIGHT := 0
    PROMPT_OK_BOTTOM := 0
    global PROMPT_GREEN_COLORS := []
}
PROMPT_GREEN_TOLERANCE := 12

FOURTH_X := 857
FOURTH_Y := 766
FOURTH_COLOR := 0x86F711
FOURTH_STAGE_X := 805
FOURTH_STAGE_Y := 709

RANDOM_CLICK_LEFT := 721
RANDOM_CLICK_TOP := 166
RANDOM_CLICK_RIGHT := 1204
RANDOM_CLICK_BOTTOM := 170

global Running := false
global LoopBusy := false
global TargetHwnd := 0
global LoopCounter := 0

CoordMode "Mouse", "Client"
CoordMode "Pixel", "Client"
SetMouseDelay -1
SetWinDelay 0
DllCall "Winmm\timeBeginPeriod", "UInt", 1
OnExit Cleanup

if A_Args.Length && A_Args[1] = "--validate"
    ExitApp

F1::ToggleMacro()
F3::StopMacro()

ToggleMacro() {
    global Running, TargetHwnd, ROBLOX_WINDOW, LOOP_INTERVAL_MS, LoopCounter
    global PRIMARY_X, PRIMARY_Y, SECOND_X, SECOND_Y, THIRD_X, THIRD_Y
    global PINK_X, PINK_Y, FOURTH_X, FOURTH_Y
    global LEGACY_16X10, PROMPT_OK_RIGHT, PROMPT_OK_BOTTOM
    global SCAN_HALF_WIDTH, SCAN_HALF_HEIGHT

    if Running {
        PauseMacro()
        return
    }

    TargetHwnd := WinActive(ROBLOX_WINDOW)
    if !TargetHwnd {
        ShowStatus("Activate the intended Roblox window, then press F1.", 3000)
        return
    }

    WinGetClientPos ,, &clientWidth, &clientHeight, TargetHwnd
    requiredWidth := Max(PRIMARY_X, SECOND_X, THIRD_X, PINK_X, FOURTH_X
        , LEGACY_16X10 ? PROMPT_OK_RIGHT : 0)
        + SCAN_HALF_WIDTH + 1
    requiredHeight := Max(PRIMARY_Y, SECOND_Y, THIRD_Y, PINK_Y, FOURTH_Y
        , LEGACY_16X10 ? PROMPT_OK_BOTTOM : 0)
        + SCAN_HALF_HEIGHT + 1
    if clientWidth < requiredWidth || clientHeight < requiredHeight {
        ShowStatus("Roblox client is too small: " clientWidth "x" clientHeight
            ". Need at least " requiredWidth "x" requiredHeight ".", 4000)
        TargetHwnd := 0
        return
    }

    Running := true
    LoopCounter := 0
    SetTimer MacroTick, LOOP_INTERVAL_MS
    ShowStatus("RUNNING | F1 pauses | F3 exits", 2000)
}

PauseMacro() {
    global Running
    Running := false
    SetTimer MacroTick, 0
    ReleaseInputs()
    ShowStatus("PAUSED | F1 resumes | F3 exits", 2000)
}

StopMacro() {
    PauseMacro()
    ExitApp
}

MacroTick() {
    global Running, LoopBusy, TargetHwnd, LoopCounter
    global PRIMARY_X, PRIMARY_Y, PRIMARY_COLOR
    global SECOND_X, SECOND_Y, SECOND_COLOR, SECOND_STAGE_X, SECOND_STAGE_Y
    global THIRD_X, THIRD_Y, THIRD_COLOR, THIRD_STAGE_X, THIRD_STAGE_Y
    global PINK_X, PINK_Y, PINK_COLOR, PINK_STAGE_X, PINK_STAGE_Y
    global FOURTH_X, FOURTH_Y, FOURTH_COLOR, FOURTH_STAGE_X, FOURTH_STAGE_Y
    global POST_JUMP_PAUSE_MS, POST_JUMP_GREEN_EVERY_LOOPS

    if !Running || LoopBusy || !TargetHwnd
        return

    LoopBusy := true
    try {
        if !FocusRobloxWindow()
            return

        targetDetected := false

        ; Highest-priority check always runs first.
        if FindTarget(PRIMARY_X, PRIMARY_Y, PRIMARY_COLOR, &foundX, &foundY) {
            JitterClick(foundX, foundY)
            targetDetected := true
        }

        if FindTarget(SECOND_X, SECOND_Y, SECOND_COLOR, &foundX, &foundY) {
            StagedClick(SECOND_STAGE_X, SECOND_STAGE_Y, foundX, foundY)
            targetDetected := true
            if CloseUpgradePrompt()
                targetDetected := true
        }

        if FindTarget(THIRD_X, THIRD_Y, THIRD_COLOR, &foundX, &foundY) {
            StagedClick(THIRD_STAGE_X, THIRD_STAGE_Y, foundX, foundY)
            targetDetected := true
            if CloseUpgradePrompt()
                targetDetected := true
        }

        if CloseUpgradePrompt(false) {
            targetDetected := true
        }

        if FindTarget(FOURTH_X, FOURTH_Y, FOURTH_COLOR, &foundX, &foundY) {
            StagedClick(FOURTH_STAGE_X, FOURTH_STAGE_Y, foundX, foundY)
            targetDetected := true
        }

        if !targetDetected
            RandomFallbackClick()

        ; One jump at the end of every completed loop.
        SendEvent "{Space}"
        LoopCounter += 1

        ; Revisit the second green location periodically without pulling the
        ; cursor away from the upper random-click region on every loop.
        if Mod(LoopCounter, POST_JUMP_GREEN_EVERY_LOOPS) = 0 {
            Sleep POST_JUMP_PAUSE_MS
            StagedClick(SECOND_STAGE_X, SECOND_STAGE_Y, SECOND_X, SECOND_Y)
        }
    } finally {
        LoopBusy := false
    }
}

FocusRobloxWindow() {
    global TargetHwnd, REFOCUS_WAIT_SECONDS
    targetTitle := "ahk_id " TargetHwnd

    if !WinExist(targetTitle) {
        TargetHwnd := 0
        PauseMacro()
        return false
    }

    WinActivate targetTitle
    return WinWaitActive(targetTitle,, REFOCUS_WAIT_SECONDS)
}

FindTarget(centerX, centerY, color, &foundX, &foundY) {
    global SCAN_HALF_WIDTH, SCAN_HALF_HEIGHT, COLOR_TOLERANCE
    return PixelSearch(&foundX, &foundY
        , centerX - SCAN_HALF_WIDTH, centerY - SCAN_HALF_HEIGHT
        , centerX + SCAN_HALF_WIDTH, centerY + SCAN_HALF_HEIGHT
        , color, COLOR_TOLERANCE)
}

FindTargetInRect(left, top, right, bottom, color, tolerance, &foundX, &foundY) {
    return PixelSearch(&foundX, &foundY, left, top, right, bottom
        , color, tolerance)
}

CloseUpgradePrompt(waitForRender := true) {
    global PINK_X, PINK_Y, PINK_COLOR, PINK_STAGE_X, PINK_STAGE_Y
    global LEGACY_16X10, PROMPT_OK_LEFT, PROMPT_OK_TOP
    global PROMPT_OK_RIGHT, PROMPT_OK_BOTTOM
    global PROMPT_GREEN_COLORS, PROMPT_GREEN_TOLERANCE
    global PROMPT_RENDER_DELAY_MS, PROMPT_WAIT_MS, PROMPT_POLL_MS

    if waitForRender
        Sleep PROMPT_RENDER_DELAY_MS

    deadline := A_TickCount + (waitForRender ? PROMPT_WAIT_MS : 0)
    loop {
        ; Use the measured 16:9 red-X sample in its small box.
        if FindTarget(PINK_X, PINK_Y, PINK_COLOR, &foundX, &foundY) {
            StagedClick(PINK_STAGE_X, PINK_STAGE_Y, foundX, foundY)
            return true
        }

        ; Preserve the earlier 16:10 popup fallback only in its separate build.
        if LEGACY_16X10 {
            for color in PROMPT_GREEN_COLORS {
                if FindTargetInRect(PROMPT_OK_LEFT, PROMPT_OK_TOP
                    , PROMPT_OK_RIGHT, PROMPT_OK_BOTTOM
                    , color, PROMPT_GREEN_TOLERANCE, &foundX, &foundY) {
                    StagedClick(PINK_STAGE_X, PINK_STAGE_Y, foundX, foundY)
                    return true
                }
            }
        }

        if A_TickCount >= deadline
            return false
        Sleep PROMPT_POLL_MS
    }
}

StagedClick(stageX, stageY, targetX, targetY) {
    global STAGING_PAUSE_MS, TARGET_MOVE_SPEED
    MouseMove stageX, stageY, 0
    Sleep STAGING_PAUSE_MS
    MouseMove targetX, targetY, TARGET_MOVE_SPEED
    Click
}

JitterClick(targetX, targetY) {
    global PRIMARY_CLICK_JITTER
    offsetX := 0
    offsetY := 0
    while offsetX = 0 && offsetY = 0 {
        offsetX := Random(-PRIMARY_CLICK_JITTER, PRIMARY_CLICK_JITTER)
        offsetY := Random(-PRIMARY_CLICK_JITTER, PRIMARY_CLICK_JITTER)
    }
    Click targetX + offsetX, targetY + offsetY
}

RandomFallbackClick() {
    global RANDOM_CLICK_LEFT, RANDOM_CLICK_TOP
    global RANDOM_CLICK_RIGHT, RANDOM_CLICK_BOTTOM
    clickX := Random(RANDOM_CLICK_LEFT, RANDOM_CLICK_RIGHT)
    clickY := Random(RANDOM_CLICK_TOP, RANDOM_CLICK_BOTTOM)
    MouseMove clickX, clickY, 0
    Click
}

ReleaseInputs() {
    SendEvent "{Space up}{LButton up}{RButton up}"
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
    SetTimer MacroTick, 0
    ReleaseInputs()
    DllCall "Winmm\timeEndPeriod", "UInt", 1
    ToolTip()
}
