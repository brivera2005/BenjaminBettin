@echo off
cd /d "%~dp0"
if not exist ".venv\Scripts\pythonw.exe" (
    python -m venv .venv
    .venv\Scripts\pip install PyQt6 pywin32 -q
)
.venv\Scripts\pythonw.exe "%~dp0start.py"
