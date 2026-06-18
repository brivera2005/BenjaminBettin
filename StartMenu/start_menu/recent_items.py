from __future__ import annotations

import os
import subprocess
from datetime import datetime
from pathlib import Path

import win32com.client

from start_menu.apps import AppItem


RECENT_DIR = Path(os.environ.get("APPDATA", "")) / "Microsoft" / "Windows" / "Recent"


def _resolve_shortcut(shortcut_path: Path) -> tuple[str, str | None, str]:
    shell = win32com.client.Dispatch("WScript.Shell")
    shortcut = shell.CreateShortcut(str(shortcut_path))
    target = shortcut.TargetPath or ""
    icon_path = shortcut.IconLocation.split(",")[0] if shortcut.IconLocation else None
    if not icon_path and target:
        icon_path = target
    return target, icon_path or None, shortcut_path.stem


def get_recent_items(limit: int = 6) -> list[AppItem]:
    if not RECENT_DIR.exists():
        return []

    shortcuts: list[tuple[Path, datetime]] = []
    for entry in RECENT_DIR.glob("*.lnk"):
        if entry.name.startswith(("AutomaticDestinations", "CustomDestinations")):
            continue
        try:
            modified = datetime.fromtimestamp(entry.stat().st_mtime)
        except OSError:
            continue
        shortcuts.append((entry, modified))

    shortcuts.sort(key=lambda item: item[1], reverse=True)

    seen: set[str] = set()
    results: list[AppItem] = []

    for shortcut_path, _modified in shortcuts:
        try:
            target, icon_path, name = _resolve_shortcut(shortcut_path)
        except Exception:
            continue
        if not target or not Path(target).exists():
            continue
        key = target.lower()
        if key in seen:
            continue
        seen.add(key)
        results.append(AppItem(name=name, path=target, icon_path=icon_path))
        if len(results) >= limit:
            break

    return results
