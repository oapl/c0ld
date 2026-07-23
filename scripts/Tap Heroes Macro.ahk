#NoEnv
#SingleInstance Force
SetWorkingDir %A_ScriptDir%

; Coordinates are in SCREEN space (from your provided values)
CoordMode, Mouse, Screen

; Toggle state
IsRunning := false
IsInRun := false
CycleIntervalMs := 30000
PreOffsetPx := 5

F1::
    IsRunning := !IsRunning
    if (IsRunning) {
        ToolTip, Macro running (F1 = pause/unpause, F3 = stop), 10, 10
        SetTimer, RunJumpMacro, %CycleIntervalMs%
        Gosub, RunJumpMacro
    } else {
        SetTimer, RunJumpMacro, Off
        ToolTip, Macro paused (F1 to resume), 10, 10
    }
return

F3::
    IsRunning := false
    IsInRun := false
    SetTimer, RunJumpMacro, Off
    ToolTip
    ExitApp
return

RunJumpMacro:
    if (!IsRunning || IsInRun) {
        return
    }
    IsInRun := true

    ; jump
    Send, {Space}

    ; click 1: 671, 311
    ClickWithPreOffsetAndDouble(671, 311)
    Sleep, 1000

    ; click 2: 442, 403
    ClickWithPreOffsetAndDouble(442, 403)
    Sleep, 1000

    ; click 3: 651, 424
    ClickWithPreOffsetAndDouble(651, 424)
    Sleep, 1000

    ; click 4: 442, 403
    ClickWithPreOffsetAndDouble(442, 403)
    Sleep, 1000

    ; click 5: 482, 101
    ClickWithPreOffsetAndDouble(482, 101)

    IsInRun := false
return

ClickWithPreOffsetAndDouble(x, y) {
    global PreOffsetPx
    MouseMove, x + PreOffsetPx, y, 0
    Sleep, 50
    MouseMove, x, y, 0
    Sleep, 30
    Click
    Sleep, 50
    Click
}
