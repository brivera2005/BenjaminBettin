@echo off
setlocal
cd /d "%~dp0"

echo Installing Simple Start Menu...

if not exist ".venv\Scripts\python.exe" (
    echo Creating virtual environment...
    python -m venv .venv
    if errorlevel 1 exit /b 1
)

call .venv\Scripts\activate.bat
pip install -r requirements.txt -q

.venv\Scripts\python.exe -c "from start_menu.setup import ensure_installed, ensure_shortcuts; from start_menu.settings import AppSettings; from start_menu.startup import set_startup_enabled; s=AppSettings.load(); s.launch_at_startup=True; s.save(); ensure_shortcuts(); set_startup_enabled(True); print('Shortcuts created and startup enabled.')"

echo.
echo Done! Simple Start Menu will start automatically when Windows boots.
echo Shortcuts added to Desktop and Projects folder.
echo.
echo Starting now...
start "" "%~dp0launch.bat"
