@echo off
setlocal
cd /d "%~dp0"

if not exist ".venv\Scripts\pythonw.exe" (
    if not exist ".venv\Scripts\python.exe" (
        python -m venv .venv
        if errorlevel 1 exit /b 1
    )
    call .venv\Scripts\activate.bat
    pip install -r requirements.txt -q
)

.venv\Scripts\pythonw.exe -m start_menu
