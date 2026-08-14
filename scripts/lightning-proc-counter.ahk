#Requires AutoHotkey v2.0
#SingleInstance Force

; Screen coordinates supplied for the original proc counter.
CLICK_X := 851
CLICK_Y := 536
CLICK_INTERVAL_MS := 250
CLICK_HOLD_MS := 35
HOVER_RESET_OFFSET_X := 100
HOVER_SETTLE_MS := 35

; This open-field subregion of the original detection box avoids cyan health
; bars and static UI. The recording shows all three Lightning flashes crossing
; it, while no normal frame contains the target cyan range here.
DETECT_LEFT := 792
DETECT_TOP := 556
DETECT_RIGHT := 840
DETECT_BOTTOM := 604
LIGHTNING_COLOR := 0x80F0F0
LIGHTNING_COLOR_VARIATION := 40
DETECTION_SCAN_INTERVAL_MS := 25
DETECTION_CONFIRM_SCANS := 2
CLEAR_SCANS_REQUIRED := 6
PAUSE_CLICKS_DURING_EFFECT := true

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
DetectionScanCount := 0
ClearScanCount := 0
ButtonPrimed := false
DetectionOutlineGuis := []
if A_Args.Length > 0 && A_Args[1] = "--capture-test" {
    TestStarted := A_TickCount
    TestResult := LightningVisible()
    TestElapsed := A_TickCount - TestStarted
    FileAppend "visible=" TestResult " elapsed_ms=" TestElapsed "`n", "*"
    ExitApp
}

OutputFile := A_Desktop "\lightning-procs-" FormatTime(A_Now, "yyyyMMdd-HHmmss") ".txt"
FileAppend "Lightning:`n", OutputFile, "UTF-8"

CounterGui := Gui("+AlwaysOnTop +ToolWindow", "Lightning Counter")
CounterGui.BackColor := "111A24"
CounterGui.MarginX := 16
CounterGui.MarginY := 14
CounterGui.SetFont "s10 cEFF8FF", "Segoe UI"

CounterGui.AddText "xm ym w125", "Status"
StatusValue := CounterGui.AddText("x+8 yp w145", "Stopped")
StatusValue.SetFont "s10 bold c64DFFF", "Segoe UI"

CounterGui.AddText "xm y+12 w125", "Current clicks"
CurrentClicksValue := CounterGui.AddText("x+8 yp w145", "0")
CurrentClicksValue.SetFont "s11 bold cFFFFFF", "Segoe UI"

CounterGui.AddText "xm y+10 w125", "Total procs"
TotalProcsValue := CounterGui.AddText("x+8 yp w145", "0")
TotalProcsValue.SetFont "s11 bold cFFFFFF", "Segoe UI"

CounterGui.AddText "xm y+10 w125", "Last proc"
LastProcValue := CounterGui.AddText("x+8 yp w145", "-")
LastProcValue.SetFont "s11 bold cFFFFFF", "Segoe UI"

CounterGui.AddText "xm y+10 w125", "Lightning signal"
SignalValue := CounterGui.AddText("x+8 yp w145", "-")
SignalValue.SetFont "s10 bold c9CEBFF", "Segoe UI"

CounterGui.AddText "xm y+12 w278 h32 c9AA8B8", "Output: " RegExReplace(OutputFile, "^.*\\", "")
CounterGui.OnEvent "Close", CloseCounter
CounterGui.Show "x20 y100 w310 h212 NoActivate"
ShowDetectionOutline()

F1::StartCounter()
F3::StopCounter()

StartCounter() {
    global Running, ProcLatched, DetectionScanCount, ClearScanCount, ButtonPrimed
    global CLICK_INTERVAL_MS, DETECTION_SCAN_INTERVAL_MS
    global REQUIRE_ROBLOX_ACTIVE, StatusValue

    if Running
        return

    Running := true
    DetectionScanCount := 0
    ClearScanCount := 0
    ButtonPrimed := false
    ProcLatched := CanReadRobloxScreen() ? LightningVisible() : false
    StatusValue.Text := REQUIRE_ROBLOX_ACTIVE && !CanReadRobloxScreen()
        ? "Waiting for Roblox"
        : "Running"

    SetTimer CheckForLightning, DETECTION_SCAN_INTERVAL_MS
    SetTimer PerformClick, CLICK_INTERVAL_MS
    PerformClick()
}

StopCounter() {
    global Running, StatusValue

    Running := false
    SetTimer PerformClick, 0
    SetTimer CheckForLightning, 0
    StatusValue.Text := "Stopped"
}

PerformClick() {
    global Running, ProcLatched, PAUSE_CLICKS_DURING_EFFECT
    global ClickCount, CurrentClicksValue, StatusValue, ButtonPrimed

    if !Running
        return
    if !CanReadRobloxScreen() {
        StatusValue.Text := "Waiting for Roblox"
        return
    }
    if PAUSE_CLICKS_DURING_EFFECT && ProcLatched {
        StatusValue.Text := "Effect detected"
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

CheckForLightning() {
    global Running, ProcLatched, DetectionScanCount, ClearScanCount
    global DETECTION_CONFIRM_SCANS, CLEAR_SCANS_REQUIRED
    global SignalValue, StatusValue

    if !Running
        return
    if !CanReadRobloxScreen() {
        StatusValue.Text := "Waiting for Roblox"
        return
    }

    Visible := LightningVisible()
    SignalValue.Text := Visible ? "Detected" : "Clear"
    if Visible {
        ClearScanCount := 0
        DetectionScanCount += 1
        if !ProcLatched && DetectionScanCount >= DETECTION_CONFIRM_SCANS {
            ProcLatched := true
            RecordProc()
        }
        if ProcLatched
            StatusValue.Text := "Effect detected"
        return
    }

    DetectionScanCount := 0
    if ProcLatched {
        ClearScanCount += 1
        if ClearScanCount >= CLEAR_SCANS_REQUIRED {
            ProcLatched := false
            ClearScanCount := 0
            StatusValue.Text := "Running"
        }
    }
}

LightningVisible() {
    global DETECT_LEFT, DETECT_TOP, DETECT_RIGHT, DETECT_BOTTOM
    global LIGHTNING_COLOR, LIGHTNING_COLOR_VARIATION

    return PixelSearch(
        &FoundX,
        &FoundY,
        DETECT_LEFT,
        DETECT_TOP,
        DETECT_RIGHT,
        DETECT_BOTTOM,
        LIGHTNING_COLOR,
        LIGHTNING_COLOR_VARIATION
    )
}

ShowDetectionOutline() {
    global DetectionOutlineGuis
    global DETECT_LEFT, DETECT_TOP, DETECT_RIGHT, DETECT_BOTTOM

    Border := 3
    Width := DETECT_RIGHT - DETECT_LEFT + 1
    Height := DETECT_BOTTOM - DETECT_TOP + 1
    Segments := [
        [DETECT_LEFT - Border, DETECT_TOP - Border, Width + Border * 2, Border],
        [DETECT_LEFT - Border, DETECT_BOTTOM + 1, Width + Border * 2, Border],
        [DETECT_LEFT - Border, DETECT_TOP, Border, Height],
        [DETECT_RIGHT + 1, DETECT_TOP, Border, Height]
    ]

    for Segment in Segments {
        Outline := Gui("+AlwaysOnTop -Caption +ToolWindow +E0x20")
        Outline.BackColor := "00B7FF"
        Outline.Show(
            "x" Segment[1]
            " y" Segment[2]
            " w" Segment[3]
            " h" Segment[4]
            " NoActivate"
        )
        DetectionOutlineGuis.Push(Outline)
    }
}

HideDetectionOutline() {
    global DetectionOutlineGuis

    for Outline in DetectionOutlineGuis
        Outline.Destroy()
    DetectionOutlineGuis := []
}

SendRobloxClick() {
    global CLICK_HOLD_MS

    DllCall "mouse_event", "UInt", 0x0002, "UInt", 0, "UInt", 0, "UInt", 0, "UPtr", 0
    Sleep CLICK_HOLD_MS
    DllCall "mouse_event", "UInt", 0x0004, "UInt", 0, "UInt", 0, "UInt", 0, "UPtr", 0
}

PrimeRobloxButton() {
    global CLICK_X, CLICK_Y, HOVER_RESET_OFFSET_X, HOVER_SETTLE_MS

    MouseMove CLICK_X + HOVER_RESET_OFFSET_X, CLICK_Y, 0
    Sleep 25
    MouseMove CLICK_X, CLICK_Y, 5
    Sleep HOVER_SETTLE_MS
}

RecordProc() {
    global ClickCount, TotalProcs, LastProcClicks, OutputFile
    global CurrentClicksValue, TotalProcsValue, LastProcValue

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
    HideDetectionOutline()
    ExitApp
}
