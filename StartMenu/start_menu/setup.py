from __future__ import annotations

import os
import sys
from pathlib import Path

import win32com.client

from start_menu.settings import AppSettings, CONFIG_FILE


APP_NAME = "Simple Start Menu"
START_MENU_DIR = Path(__file__).resolve().parent.parent
LAUNCHER = START_MENU_DIR / "launch.bat"
PROJECTS_DIR = Path.home() / "Projects"


def _desktop_dir() -> Path:
    return Path(os.environ.get("USERPROFILE", Path.home())) / "Desktop"


def _shortcut_paths() -> list[Path]:
    paths = [
        _desktop_dir() / f"{APP_NAME}.lnk",
        PROJECTS_DIR / f"{APP_NAME}.lnk",
        START_MENU_DIR / f"{APP_NAME}.lnk",
    ]
    return [path for path in paths if path.parent.exists()]


def _create_shortcut(shortcut_path: Path) -> None:
    shell = win32com.client.Dispatch("WScript.Shell")
    shortcut = shell.CreateShortcut(str(shortcut_path))
    shortcut.TargetPath = str(LAUNCHER)
    shortcut.WorkingDirectory = str(START_MENU_DIR)
    shortcut.Description = APP_NAME
    shortcut.Save()


def ensure_shortcuts() -> None:
    for shortcut_path in _shortcut_paths():
        if not shortcut_path.exists():
            _create_shortcut(shortcut_path)


def ensure_installed(settings: AppSettings) -> AppSettings:
    missing = [path for path in _shortcut_paths() if not path.exists()]
    ensure_shortcuts()

    if missing and not settings.launch_at_startup:
        settings.launch_at_startup = True
        settings.save()

    return settings
