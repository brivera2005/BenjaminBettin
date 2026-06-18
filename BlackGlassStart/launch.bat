@echo off
setlocal
cd /d "%~dp0"

if not exist ".venv\Scripts\pythonw.exe" (
    if not exist ".venv\Scripts\python.exe" (
        python -m venv .venv
    )
    call .venv\Scripts\activate.bat
    pip install -r requirements.txt -q
)

.venv\Scripts\pythonw.exe -m black_glass
