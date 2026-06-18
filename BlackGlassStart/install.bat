@echo off
setlocal EnableDelayedExpansion

net session >nul 2>&1
if errorlevel 1 (
    powershell -NoProfile -Command "Start-Process -FilePath '%~f0' -Verb RunAs"
    exit /b
)

cd /d "%~dp0"

echo.
echo  Black Glass Start Menu
echo  ======================
echo.

echo Removing Open-Shell conflict...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0disable-openshell.ps1"

echo Setting up Black Glass...
if not exist ".venv\Scripts\python.exe" (
    python -m venv .venv
)
call .venv\Scripts\activate.bat
pip install -r requirements.txt -q

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
    "$w = New-Object -ComObject WScript.Shell; ^
     foreach ($t in @('%USERPROFILE%\Desktop\Black Glass Start.lnk', '%USERPROFILE%\Projects\Black Glass Start.lnk')) { ^
       $d = Split-Path $t -Parent; if (-not (Test-Path $d)) { continue }; ^
       $s = $w.CreateShortcut($t); $s.TargetPath = '%~dp0launch.bat'; $s.WorkingDirectory = '%~dp0'; $s.Save() ^
     }"

echo Unpinning Windows Start clutter...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0unpin-windows.ps1"

echo.
echo Starting Black Glass...
taskkill /F /IM pythonw.exe >nul 2>&1
ping 127.0.0.1 -n 2 >nul
start "" "%~dp0launch.bat"

echo Done. Press Win for your menu.
echo.
