@echo off
setlocal
cd /d "%~dp0"

if not exist ".venv\Scripts\python.exe" (
    echo Creating virtual environment...
    python -m venv .venv
    if errorlevel 1 exit /b 1
)

call .venv\Scripts\activate.bat
pip install -r requirements.txt pyinstaller -q

pyinstaller ^
  --noconfirm ^
  --onefile ^
  --windowed ^
  --name SimpleStartMenu ^
  --hidden-import win32com.client ^
  start_menu\__main__.py

echo.
echo Built: dist\SimpleStartMenu.exe
echo Copy dist\SimpleStartMenu.exe anywhere and double-click to run.
