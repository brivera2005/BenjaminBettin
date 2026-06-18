# Simple Start Menu

A lightweight Windows 11-style start menu replacement. Press **Win** to open a clean panel showing your recently used apps and files, plus a small settings panel.

Inspired by Start11, but intentionally minimal — no pinned apps grid, no search clutter, no ads.

## Features

- **Recently used** — reads Windows Recent shortcuts and shows apps/files you've actually opened
- **Win key replacement** — intercepts the Windows key and opens this menu instead
- **Settings** — theme (dark/light), item count, startup, power actions
- **System tray** — runs in the background; click the tray icon if Win key capture fails
- **Standalone** — build a single `.exe` with `build.bat`

## Quick start

Double-click **`run.bat`** — it creates a venv, installs dependencies, and launches the app.

Or manually:

```bat
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python -m start_menu
```

## Build standalone exe

```bat
build.bat
```

Output: `dist\SimpleStartMenu.exe`

## Settings

Stored at `%LOCALAPPDATA%\SimpleStartMenu\settings.json`

| Setting | Default | Description |
|---------|---------|-------------|
| Theme | Dark | Dark or light menu |
| Recent items | 12 | How many items to show (4–24) |
| Win key | On | Replace Windows start with this menu |
| Launch at sign-in | Off | Add to Windows startup |
| Power actions | On | Sleep / Restart / Shut down buttons |

## Notes

- The app must stay running in the system tray for Win key interception to work.
- Recent items come from `%APPDATA%\Microsoft\Windows\Recent`.
- If Windows still opens its own Start menu alongside this one, turn off Win key interception in settings and use the tray icon instead.

## Requirements

- Windows 10/11
- Python 3.10+ (for development); the built `.exe` needs no Python installed
