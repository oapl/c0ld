; <COMPILER: v1.1.37.02>
#NoEnv
#SingleInstance Force
SetWorkingDir %A_ScriptDir%
CoordMode, Mouse, Window
SendMode Input
SetTitleMatchMode 2
#WinActivateForce
SetControlDelay 1
SetWinDelay 0
SetKeyDelay -1
SetMouseDelay -1
SetBatchLines -1
#MaxThreadsPerHotkey 2
F1::
if (MacroRunning) {
Progress, Off
MacroRunning := false
Reload
ExitApp
return
}
MacroRunning := true
Main:
Loop
{
CoordMode, Pixel, Window
PixelSearch, FoundX, FoundY, 48, 122, 55, 127, 0x0C80DF, 3, Fast RGB
If (ErrorLevel)
{
MoveClick(64,365,,666)
MoveClick(505,555,,290)
}
Loop
{
CoordMode, Pixel, Window
PixelSearch, FoundX, FoundY, 231, 189, 246, 212, 0x6CE9FD, 5, Fast RGB
If (ErrorLevel = 0)
{
CoordMode, Pixel, Window
PixelSearch, FoundX, FoundY, 286, 189, 294, 195, 0xAA0001, 5, Fast RGB
If (ErrorLevel = 0)
{
CoordMode, Pixel, Window
PixelSearch, FoundX, FoundY, 418, 167, 425, 197, 0xFFFFFF, 20, Fast RGB
If (ErrorLevel)
{
CoordMode, Pixel, Window
PixelSearch, FoundX, FoundY, 479, 167, 484, 183, 0x000000, 50, Fast RGB
If (ErrorLevel)
{
Break
}
}
}
CoordMode, Pixel, Window
PixelSearch, FoundX, FoundY, 358, 161, 367, 173, 0xAE762A, 5, Fast RGB
If ErrorLevel = 0
Click, %FoundX%, %FoundY%, 0
If (ErrorLevel = 0)
{
CoordMode, Pixel, Window
PixelSearch, FoundX, FoundY, 409, 195, 421, 196, 0xFFFFFF, 50, Fast RGB
If (ErrorLevel)
{
CoordMode, Pixel, Window
PixelSearch, FoundX, FoundY, 422, 196, 514, 198, 0x000000, 50, Fast RGB
If (ErrorLevel)
{
Break
}
}
}
}
}
MoveClick(752,141,,300)
Loop
{
CoordMode, Pixel, Window
PixelSearch, X, Y, 125, 350, 133, 355, 0xFF1B69, 5, Fast RGB
If (ErrorLevel = 0)
{
MoveClick(113,372)
Sleep, 300
}
CoordMode, Pixel, Window
PixelSearch, X, Y, 126, 285, 133, 290, 0xFF1B69, 10, Fast RGB
If (ErrorLevel = 0)
{
MoveClick(113,300)
Sleep, 300
}
SideX := 140
Loop, 17
{
CoordMode, Pixel, Window
PixelSearch, X, Y, 11, 32, 807, 154, 0xE2A06D, 18, Fast RGB
If (ErrorLevel = 0)
{
MoveClick(X,Y,0,0)
}
CoordMode, Pixel, Window
PixelSearch, X, FoundY, 75, 243, 800, 320, 0x7F7F7F, 1, Fast RGB
If (ErrorLevel = 0)
{
MoveClick(x,333,0,0)
}
If (ErrorLevel)
{
Loop, 2
{
Send, {Left Down}
}
Send, {o Down}
MoveClick(SideX,333,0,0)
Loop, 3
{
Send, {o Up}
Sleep, 2
}
Loop, 3
{
Send, {Left Up}
Sleep, 2
}
}
SideX += 38
}
}
}
Return
MoveClick(x := 0, y := 0, delay := 20, hold := 0, clickamount := 1)
{
Click, %x%, %y%, 0
Loop, 5
{
Click, Rel 1, 0, 0
Sleep, 2
}
Sleep, %delay%
If (clickamount > 0)
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
