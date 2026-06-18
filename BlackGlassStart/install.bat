@echo off
cd /d "%~dp0"
echo Installing Black Glass Start...

taskkill /F /IM StartMenu.exe 2>nul
taskkill /F /IM pythonw.exe 2>nul
taskkill /F /IM BlackGlassStart.exe 2>nul

python -m venv .venv 2>nul
.venv\Scripts\pip install PyQt6 pywin32 -q

reg add "HKCU\Software\Microsoft\Windows\CurrentVersion\Run" /v BlackGlassStart /t REG_SZ /d "%~dp0launch.bat" /f >nul

powershell -NoProfile -Command "Get-ChildItem '$env:LOCALAPPDATA\Packages\Microsoft.Windows.StartMenuExperienceHost*\LocalState\*.bin' -ErrorAction SilentlyContinue | Remove-Item -Force"

start "" "%~dp0launch.bat"
echo Done. Press Win.
