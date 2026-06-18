from __future__ import annotations

import sys
from pathlib import Path

import winreg


APP_NAME = "SimpleStartMenu"
RUN_KEY = r"Software\Microsoft\Windows\CurrentVersion\Run"
START_MENU_DIR = Path(__file__).resolve().parent.parent
LAUNCHER = START_MENU_DIR / "launch.bat"


def _executable_path() -> str:
    if getattr(sys, "frozen", False):
        return f'"{sys.executable}"'
    return f'"{LAUNCHER}"'


def is_startup_enabled() -> bool:
    try:
        with winreg.OpenKey(winreg.HKEY_CURRENT_USER, RUN_KEY, 0, winreg.KEY_READ) as key:
            winreg.QueryValueEx(key, APP_NAME)
            return True
    except FileNotFoundError:
        return False
    except OSError:
        return False


def set_startup_enabled(enabled: bool) -> None:
    try:
        with winreg.OpenKey(winreg.HKEY_CURRENT_USER, RUN_KEY, 0, winreg.KEY_SET_VALUE) as key:
            if enabled:
                winreg.SetValueEx(key, APP_NAME, 0, winreg.REG_SZ, _executable_path())
            else:
                try:
                    winreg.DeleteValue(key, APP_NAME)
                except FileNotFoundError:
                    pass
    except OSError as exc:
        raise RuntimeError(f"Could not update startup setting: {exc}") from exc
