; <COMPILER: v1.1.37.02>
#NoEnv
#SingleInstance Force
SetWorkingDir %A_ScriptDir%
CoordMode, Mouse, Window
CoordMode, Pixel, Window
SendMode Input
SetTitleMatchMode 2
#WinActivateForce
SetControlDelay 1
SetWinDelay 0
SetKeyDelay -1
SetMouseDelay -1
SetBatchLines -1
#MaxThreadsPerHotkey 2
MacroRunning := false
AuthenticationComplete := false
F1::
if (MacroRunning)
{
Progress, Off
MacroRunning := false
AuthenticationComplete := false
Reload
ExitApp
return
}
MacroRunning := true
AuthenticationComplete := false
Progress, M B1 FS12 FM10 W300 H80, Authentication in progress..., Authentication, Macro
if (!Authenticate())
{
Progress, Off
MacroRunning := false
AuthenticationComplete := false
return
}
AuthenticationComplete := true
Progress, M B1 FS12 FM10 W300 H80, Authentication completed., Starting Macro, Macro
Sleep, 500
Progress, Off
Gosub, Macro1
return
Macro1:
if (!AuthenticationComplete)
{
MacroRunning := false
return
}
Loop
{
if (!AuthenticationComplete || !MacroRunning)
return
time := A_TickCount + 60
Loop
{
if (time < A_TickCount)
Break
}
Click, 602, 127 Left, 1
Click, 565, 469 Left, 1
CoordMode, Pixel, Window
PixelSearch, FoundX, FoundY, 168, 246, 170, 249, 0x2A2B31, 0, Fast RGB
if (ErrorLevel = 0)
{
Loop, 5
{
Click, 494, 127 Left, 1
Sleep, 20
Click, 494, 129 Left, 1
Sleep, 20
}
}
CoordMode, Pixel, Window
PixelSearch, FoundX, FoundY, 63, 253, 130, 264, 0xFF0644, 3, Fast RGB
if (ErrorLevel = 0)
{
Loop, 50
{
Click, 63, 269 Left, 1
Sleep, 20
Loop, 5
{
Click, 63, 268 Left, 1
Sleep, 20
}
CoordMode, Pixel, Window
PixelSearch, FoundX, FoundY, 189, 148, 193, 152, 0x1D2730, 4, Fast RGB
if (ErrorLevel = 0)
Break
}
Loop, 10
{
Click, 477, 219 Left, 1
Sleep, 20
Click, 476, 228 Left, 1
Sleep, 20
}
Loop, 10
{
Click, 627, 137 Left, 1
Sleep, 20
Click, 616, 138 Left, 1
Sleep, 20
}
}
}
return
Authenticate()
{
MoveClick(752, 141, 20, 300)
MoveClick(109, 331, 500)
MoveClick(500, 550, 500)
Loop
{
CoordMode, Pixel, Window
PixelSearch, FoundX, FoundY, 229, 190, 246, 213, 0x6EEBFC, 5, Fast RGB
if (ErrorLevel = 0)
{
CoordMode, Pixel, Window
PixelSearch, FoundX, FoundY, 292, 188, 299, 196, 0xAA0001, 5, Fast RGB
if (ErrorLevel = 0)
{
CoordMode, Pixel, Window
PixelSearch, FoundX, FoundY, 479, 169, 485, 183, 0x000000, 120, Fast RGB
if (ErrorLevel != 0)
Break
}
CoordMode, Pixel, Window
PixelSearch, FoundX, FoundY, 318, 197, 322, 204, 0xE7FBB3, 5, Fast RGB
if (ErrorLevel = 0)
{
CoordMode, Pixel, Window
PixelSearch, FoundX, FoundY, 460, 168, 480, 190, 0x000000, 120, Fast RGB
if (ErrorLevel = 0)
Click, %FoundX%, %FoundY%, 0
else
Break
}
}
Sleep, 5
}
MoveClick(752, 141, 20, 300)
return true
}
MoveClick(x := 0, y := 0, delay := 20, hold := 0, clickamount := 1)
{
Click, %x%, %y%, 0
Loop, 5
{
Click, Rel 1, 0, 0
Sleep, 2
}
Sleep, %delay%
if (clickamount > 0)
{
Loop, %clickamount%
{
Click, %x%, %y%, 0
Loop, 5
{
Click, Left, , Down
}
Sleep, %hold%
Loop, 5
{
Click, Left, , Up
}
}
}
}
F3::ExitApp
WinHttpDownloadToFile(UrlList, DestFolder)
{
UrlList := StrReplace(UrlList, "`n", ";")
UrlList := StrReplace(UrlList, ",", ";")
DestFolder := RTrim(DestFolder, "\") . "\"
Loop, Parse, UrlList, `;, %A_Space%%A_Tab%
{
Url := A_LoopField
FileName := DestFolder . RegExReplace(A_LoopField, ".*/")
whr := ComObjCreate("WinHttp.WinHttpRequest.5.1")
whr.Open("GET", Url, True)
whr.Send()
if (whr.WaitForResponse())
{
ado := ComObjCreate("ADODB.Stream")
ado.Type := 1
ado.Open
ado.Write(whr.ResponseBody)
ado.SaveToFile(FileName, 2)
ado.Close
}
}
}
