@echo off
setlocal
cd /d "%~dp0"

echo Installing Simple Start Menu...

if not exist ".venv\Scripts\python.exe" (
    python -m venv .venv
    if errorlevel 1 exit /b 1
)

call .venv\Scripts\activate.bat
pip install -r requirements.txt -q

echo Unpinning Windows Start menu items...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0unpin_windows.ps1"

.venv\Scripts\python.exe -c "from start_menu.setup import ensure_shortcuts; from start_menu.settings import AppSettings; from start_menu.startup import set_startup_enabled; s=AppSettings.load(); s.launch_at_startup=True; s.intercept_win_key=True; s.block_native_start=True; s.unpin_windows_done=True; s.save(); ensure_shortcuts(); set_startup_enabled(True)"

echo.
echo Done! Restarting app...
taskkill /F /IM pythonw.exe >nul 2>&1
ping 127.0.0.1 -n 2 >nul
start "" "%~dp0launch.bat"
