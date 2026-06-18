@echo off
setlocal
cd /d "%~dp0"

if not exist ".venv\Scripts\python.exe" (
    python -m venv .venv
)
call .venv\Scripts\activate.bat
pip install -r requirements.txt pyinstaller -q

pyinstaller --noconfirm --onefile --windowed --name BlackGlassStart ^
  --collect-all PyQt6 ^
  --hidden-import win32com ^
  --hidden-import win32com.client ^
  --hidden-import pythoncom ^
  --hidden-import pywintypes ^
  black_glass\__main__.py

echo Built: dist\BlackGlassStart.exe
