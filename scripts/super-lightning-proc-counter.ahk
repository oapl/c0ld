#Requires AutoHotkey v2.0
#SingleInstance Force

; Screen coordinates supplied from Window Spy.
CLICK_X := 851
CLICK_Y := 536
CLICK_INTERVAL_MS := 250
CLICK_HOLD_MS := 35
HOVER_RESET_OFFSET_X := 100
HOVER_SETTLE_MS := 35

DETECT_LEFT := 704
DETECT_TOP := 404
DETECT_RIGHT := 1032
DETECT_BOTTOM := 678
PROC_COLOR := 0xFF22FF
COLOR_VARIATION := 8
DETECTION_SCAN_INTERVAL_MS := 25
CLEAR_SCANS_REQUIRED := 4

REQUIRE_ROBLOX_ACTIVE := true
ROBLOX_WINDOW := "ahk_exe RobloxPlayerBeta.exe"

if A_Args.Length > 0 && A_Args[1] = "--validate"
    ExitApp

CoordMode "Mouse", "Screen"
CoordMode "Pixel", "Screen"
SetMouseDelay 35
SetDefaultMouseSpeed 0

Running := false
ClickCount := 0
TotalProcs := 0
LastProcClicks := 0
ProcLatched := false
ClearScanCount := 0
ButtonPrimed := false

OutputFile := A_Desktop "\super-lightning-procs-" FormatTime(A_Now, "yyyyMMdd-HHmmss") ".txt"
FileAppend "Super Lightning:`n", OutputFile, "UTF-8"

CounterGui := Gui("+AlwaysOnTop +ToolWindow", "Super Lightning Counter")
CounterGui.BackColor := "17131F"
CounterGui.MarginX := 16
CounterGui.MarginY := 14
CounterGui.SetFont "s10 cF6F0FF", "Segoe UI"

CounterGui.AddText "xm ym w115", "Status"
StatusValue := CounterGui.AddText("x+8 yp w145", "Stopped")
StatusValue.SetFont "s10 bold cFF5CE1", "Segoe UI"

CounterGui.AddText "xm y+12 w115", "Current clicks"
CurrentClicksValue := CounterGui.AddText("x+8 yp w145", "0")
CurrentClicksValue.SetFont "s11 bold cFFFFFF", "Segoe UI"

CounterGui.AddText "xm y+10 w115", "Total procs"
TotalProcsValue := CounterGui.AddText("x+8 yp w145", "0")
TotalProcsValue.SetFont "s11 bold cFFFFFF", "Segoe UI"

CounterGui.AddText "xm y+10 w115", "Last proc"
LastProcValue := CounterGui.AddText("x+8 yp w145", "-")
LastProcValue.SetFont "s11 bold cFFFFFF", "Segoe UI"

CounterGui.AddText "xm y+12 w268 h32 cAAA2B8", "Output: " RegExReplace(OutputFile, "^.*\\", "")
CounterGui.OnEvent "Close", CloseCounter
CounterGui.Show "x20 y100 w300 h180 NoActivate"

F1::StartCounter()
F3::StopCounter()

StartCounter() {
    global Running, ProcLatched, ClearScanCount, ButtonPrimed
    global CLICK_INTERVAL_MS, DETECTION_SCAN_INTERVAL_MS
    global REQUIRE_ROBLOX_ACTIVE, StatusValue

    if Running
        return

    Running := true
    ClearScanCount := 0
    ButtonPrimed := false
    ProcLatched := CanReadRobloxScreen() ? ProcColorVisible() : false
    StatusValue.Text := REQUIRE_ROBLOX_ACTIVE && !CanReadRobloxScreen()
        ? "Waiting for Roblox"
        : "Running"

    SetTimer CheckForProc, DETECTION_SCAN_INTERVAL_MS
    SetTimer PerformClick, CLICK_INTERVAL_MS
    PerformClick()
}

StopCounter() {
    global Running, StatusValue

    Running := false
    SetTimer PerformClick, 0
    SetTimer CheckForProc, 0
    StatusValue.Text := "Stopped"
}

PerformClick() {
    global Running, ClickCount, CurrentClicksValue, StatusValue, ButtonPrimed

    if !Running
        return
    if !CanReadRobloxScreen() {
        StatusValue.Text := "Waiting for Roblox"
        return
    }

    StatusValue.Text := "Running"
    if !ButtonPrimed {
        PrimeRobloxButton()
        ButtonPrimed := true
    }
    SendRobloxClick()
    ClickCount += 1
    CurrentClicksValue.Text := ClickCount
}

SendRobloxClick() {
    global CLICK_HOLD_MS

    ; Roblox can ignore AutoHotkey's default SendInput click, so use a complete
    ; foreground mouse press and release after the one-time hover setup.
    DllCall "mouse_event", "UInt", 0x0002, "UInt", 0, "UInt", 0, "UInt", 0, "UPtr", 0
    Sleep CLICK_HOLD_MS
    DllCall "mouse_event", "UInt", 0x0004, "UInt", 0, "UInt", 0, "UInt", 0, "UPtr", 0
}

PrimeRobloxButton() {
    global CLICK_X, CLICK_Y, HOVER_RESET_OFFSET_X, HOVER_SETTLE_MS

    ; Run once after each F1 start so Roblox enters the button's hover state.
    MouseMove CLICK_X + HOVER_RESET_OFFSET_X, CLICK_Y, 0
    Sleep 25
    MouseMove CLICK_X, CLICK_Y, 5
    Sleep HOVER_SETTLE_MS
}

CheckForProc() {
    global Running, ProcLatched, ClearScanCount, CLEAR_SCANS_REQUIRED
    global StatusValue

    if !Running
        return
    if !CanReadRobloxScreen() {
        StatusValue.Text := "Waiting for Roblox"
        return
    }

    StatusValue.Text := "Running"
    if ProcColorVisible() {
        ClearScanCount := 0
        if !ProcLatched {
            ProcLatched := true
            RecordProc()
        }
        return
    }

    if ProcLatched {
        ClearScanCount += 1
        if ClearScanCount >= CLEAR_SCANS_REQUIRED {
            ProcLatched := false
            ClearScanCount := 0
        }
    }
}

ProcColorVisible() {
    global DETECT_LEFT, DETECT_TOP, DETECT_RIGHT, DETECT_BOTTOM
    global PROC_COLOR, COLOR_VARIATION

    return PixelSearch(
        &FoundX,
        &FoundY,
        DETECT_LEFT,
        DETECT_TOP,
        DETECT_RIGHT,
        DETECT_BOTTOM,
        PROC_COLOR,
        COLOR_VARIATION
    )
}

RecordProc() {
    global ClickCount, TotalProcs, LastProcClicks, OutputFile
    global CurrentClicksValue, TotalProcsValue, LastProcValue

    ; ClickCount includes the click which caused the visible proc.
    LastProcClicks := ClickCount
    TotalProcs += 1
    FileAppend LastProcClicks "`n", OutputFile, "UTF-8"

    ClickCount := 0
    CurrentClicksValue.Text := "0"
    TotalProcsValue.Text := TotalProcs
    LastProcValue.Text := LastProcClicks " clicks"
}

CanReadRobloxScreen() {
    global REQUIRE_ROBLOX_ACTIVE, ROBLOX_WINDOW
    return !REQUIRE_ROBLOX_ACTIVE || WinActive(ROBLOX_WINDOW)
}

CloseCounter(*) {
    StopCounter()
    ExitApp
}
