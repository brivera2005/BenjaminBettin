# Simple Start Menu

A Start11-style Windows 11 start menu replacement. Clean, fast, and fully under your control.

## Features

- **Start11 layout** — pinned grid + recommended recent items, search bar, all apps view
- **Unpins Windows defaults** — clears Microsoft's pinned clutter on install
- **Blocks native Start** — Win key and Start button open this menu instead
- **Pin/unpin apps** — right-click any app to pin it; starts with a clean slate
- **Search** — filter 70+ installed apps instantly
- **Settings** — theme, item counts, startup, power menu
- **Auto-start** — launches at Windows sign-in

## Quick start

Double-click **`install.bat`** once. After that, press **Win** or click the **Start button**.

Shortcuts live on your Desktop and in `C:\Users\Benjamin\Projects\`.

## Manual run

```bat
launch.bat
```

## Build standalone exe

```bat
build.bat
```

## Settings

Stored at `%LOCALAPPDATA%\SimpleStartMenu\settings.json`

## Requirements

- Windows 10/11
- Python 3.10+ (for dev); built `.exe` needs no Python
