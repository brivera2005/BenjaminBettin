from __future__ import annotations

import os
import subprocess
from dataclasses import dataclass
from pathlib import Path

import win32com.client


START_MENU_DIRS = (
    Path(os.environ.get("PROGRAMDATA", "")) / "Microsoft/Windows/Start Menu/Programs",
    Path(os.environ.get("APPDATA", "")) / "Microsoft/Windows/Start Menu/Programs",
)


@dataclass(frozen=True)
class AppItem:
    name: str
    path: str
    icon_path: str | None = None

    @property
    def key(self) -> str:
        return self.path.lower()


def _resolve_shortcut(shortcut_path: Path) -> tuple[str, str | None, str]:
    shell = win32com.client.Dispatch("WScript.Shell")
    shortcut = shell.CreateShortcut(str(shortcut_path))
    target = shortcut.TargetPath or ""
    icon_path = shortcut.IconLocation.split(",")[0] if shortcut.IconLocation else None
    if not icon_path and target:
        icon_path = target
    name = shortcut_path.stem
    return target, icon_path or None, name


def _collect_from_dir(directory: Path, results: dict[str, AppItem]) -> None:
    if not directory.exists():
        return
    for entry in directory.rglob("*.lnk"):
        try:
            target, icon_path, name = _resolve_shortcut(entry)
        except Exception:
            continue
        if not target or not Path(target).exists():
            continue
        key = target.lower()
        if key in results:
            continue
        results[key] = AppItem(name=name, path=target, icon_path=icon_path)


def get_all_apps() -> list[AppItem]:
    results: dict[str, AppItem] = {}
    for directory in START_MENU_DIRS:
        _collect_from_dir(directory, results)
    return sorted(results.values(), key=lambda item: item.name.lower())


def search_apps(query: str, apps: list[AppItem] | None = None) -> list[AppItem]:
    apps = apps or get_all_apps()
    needle = query.strip().lower()
    if not needle:
        return apps
    return [app for app in apps if needle in app.name.lower() or needle in app.path.lower()]


def launch_app(item: AppItem) -> None:
    path = Path(item.path)
    if path.suffix.lower() == ".exe" or path.is_file():
        os.startfile(item.path)
        return
    if path.is_dir():
        os.startfile(item.path)
        return
    subprocess.Popen(["explorer", item.path], shell=False)
