@echo off
setlocal enabledelayedexpansion

set PROFILE=Profile 1
if not "%~1"=="" set PROFILE=%~1

title Brave RP Profile (%PROFILE%) - Debug Mode
echo.
echo  ==========================================
echo   Launching Brave (Default/Profile Picker)
echo   Remote debugging on port 9222
echo  ==========================================
echo.

rem Cache Program Files (x86) early — its name breaks if-blocks when used as %VAR%
rem Using delayed expansion (!VAR!) inside blocks avoids this entirely.
set "PFILES86=%ProgramFiles(x86)%"

set "BRAVE_EXE="

if exist "!LOCALAPPDATA!\BraveSoftware\Brave-Browser\Application\brave.exe" (
    set "BRAVE_EXE=!LOCALAPPDATA!\BraveSoftware\Brave-Browser\Application\brave.exe"
) else if exist "!PROGRAMFILES!\BraveSoftware\Brave-Browser\Application\brave.exe" (
    set "BRAVE_EXE=!PROGRAMFILES!\BraveSoftware\Brave-Browser\Application\brave.exe"
) else if exist "!PFILES86!\BraveSoftware\Brave-Browser\Application\brave.exe" (
    set "BRAVE_EXE=!PFILES86!\BraveSoftware\Brave-Browser\Application\brave.exe"
)

if "!BRAVE_EXE!"=="" (
    echo  [ERROR] Could not automatically find brave.exe in any of these locations:
    echo    - !LOCALAPPDATA!\BraveSoftware\Brave-Browser\Application\brave.exe
    echo    - !PROGRAMFILES!\BraveSoftware\Brave-Browser\Application\brave.exe
    echo    - !PFILES86!\BraveSoftware\Brave-Browser\Application\brave.exe
    echo.
    echo  Please edit this batch file and set BRAVE_EXE manually at the top.
    echo.
    pause
    exit /b 1
)

echo  Found Brave at: !BRAVE_EXE!
start "" "!BRAVE_EXE!" --remote-debugging-port=9222 --no-first-run --no-default-browser-check

echo  [OK] Brave launched!
echo  [OK] CDP listening on http://127.0.0.1:9222
echo.
echo  You can now tell the AI to attach.
echo  Do NOT close this window until done.
echo.
pause
