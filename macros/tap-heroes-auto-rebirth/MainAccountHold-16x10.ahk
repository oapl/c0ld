#Include CameraRotation.ahk
#Include MainAccountHold.ahk

F4::RotateMainAccountCamera()

RotateMainAccountCamera() {
    global Running, LoopBusy, TargetHwnd, ROBLOX_WINDOW
    global LOOP_INTERVAL_MS, REFOCUS_WAIT_SECONDS

    if Running
        SetTimer MacroTick, 0

    deadline := A_TickCount + 1000
    while LoopBusy && A_TickCount < deadline
        Sleep 10

    if LoopBusy {
        if Running
            SetTimer MacroTick, LOOP_INTERVAL_MS
        ShowStatus("Camera is busy. Try F4 again.", 1500)
        return
    }

    LoopBusy := true
    try {
        if TargetHwnd && WinExist("ahk_id " TargetHwnd) {
            WinActivate "ahk_id " TargetHwnd
            if !WinWaitActive("ahk_id " TargetHwnd,, REFOCUS_WAIT_SECONDS) {
                ShowStatus("Could not focus Roblox for camera rotation.", 2500)
                return
            }
        } else if WinActive(ROBLOX_WINDOW) {
            TargetHwnd := WinActive(ROBLOX_WINDOW)
        } else {
            ShowStatus("Activate the intended Roblox window, then press F4.", 3000)
            return
        }

        RotateCameraRight()
        ShowStatus("Camera rotated right.", 1000)
    } finally {
        LoopBusy := false
        if Running
            SetTimer MacroTick, LOOP_INTERVAL_MS
    }
}
