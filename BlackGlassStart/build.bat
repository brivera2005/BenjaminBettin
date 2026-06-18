@echo off
setlocal
cd /d "%~dp0"

if not exist ".venv\Scripts\python.exe" (
    python -m venv .venv
    call .venv\Scripts\activate.bat
    pip install -r requirements.txt pyinstaller -q
)

call .venv\Scripts\activate.bat
pyinstaller --noconfirm --onefile --windowed --name BlackGlassStart --hidden-import win32com.client black_glass\__main__.py
echo Built: dist\BlackGlassStart.exe
