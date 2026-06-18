from __future__ import annotations

import os
import subprocess
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path

import win32com.client


RECENT_DIR = Path(os.environ.get("APPDATA", "")) / "Microsoft" / "Windows" / "Recent"


@dataclass(frozen=True)
class RecentItem:
    name: str
    path: str
    shortcut_path: str
    last_used: datetime
    icon_path: str | None = None

    @property
    def display_name(self) -> str:
        stem = Path(self.name).stem
        if stem.endswith(".lnk"):
            return Path(stem).stem
        return stem


def _resolve_shortcut(shortcut_path: Path) -> tuple[str, str | None]:
    shell = win32com.client.Dispatch("WScript.Shell")
    shortcut = shell.CreateShortcut(str(shortcut_path))
    target = shortcut.TargetPath or ""
    icon_path = shortcut.IconLocation.split(",")[0] if shortcut.IconLocation else None
    if not icon_path and target:
        icon_path = target
    return target, icon_path or None


def get_recent_items(limit: int = 12) -> list[RecentItem]:
    if not RECENT_DIR.exists():
        return []

    shortcuts: list[tuple[Path, datetime]] = []
    for entry in RECENT_DIR.glob("*.lnk"):
        if entry.name.startswith("AutomaticDestinations") or entry.name.startswith("CustomDestinations"):
            continue
        try:
            modified = datetime.fromtimestamp(entry.stat().st_mtime)
        except OSError:
            continue
        shortcuts.append((entry, modified))

    shortcuts.sort(key=lambda item: item[1], reverse=True)

    seen_targets: set[str] = set()
    results: list[RecentItem] = []

    for shortcut_path, modified in shortcuts:
        try:
            target, icon_path = _resolve_shortcut(shortcut_path)
        except Exception:
            continue

        if not target or not Path(target).exists():
            continue

        normalized = target.lower()
        if normalized in seen_targets:
            continue
        seen_targets.add(normalized)

        results.append(
            RecentItem(
                name=shortcut_path.name,
                path=target,
                shortcut_path=str(shortcut_path),
                last_used=modified,
                icon_path=icon_path,
            )
        )

        if len(results) >= limit:
            break

    return results


def launch_item(item: RecentItem) -> None:
    path = Path(item.path)
    if path.suffix.lower() == ".exe" or path.is_file():
        os.startfile(item.path)
        return
    if path.is_dir():
        os.startfile(item.path)
        return
    subprocess.Popen(["explorer", item.path], shell=False)
