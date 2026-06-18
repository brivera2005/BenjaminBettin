from __future__ import annotations

import struct
import winreg
from dataclasses import dataclass
from pathlib import Path

import win32com.client


USERASSIST_LINKS = r"Software\Microsoft\Windows\CurrentVersion\Explorer\UserAssist\{F4E57C4B-2036-45F0-A9AB-443BCFE33D9F}\Count"
USERASSIST_APPS = r"Software\Microsoft\Windows\CurrentVersion\Explorer\UserAssist\{CEBFF5CD-ACE2-4F4F-9178-9926F41749EA}\Count"
RECENT_DIR = Path.home() / "AppData/Roaming/Microsoft/Windows/Recent"

IGNORE_NAMES = {
    "setup.exe", "uninstall.exe", "update.exe", "install.exe",
    "cmd.exe", "conhost.exe", "dllhost.exe", "searchhost.exe",
}


@dataclass(frozen=True)
class AppTile:
    name: str
    path: str
    icon_path: str | None = None


def _rot13(text: str) -> str:
    out: list[str] = []
    for ch in text:
        o = ord(ch)
        if 65 <= o <= 90:
            out.append(chr((o - 65 + 13) % 26 + 65))
        elif 97 <= o <= 122:
            out.append(chr((o - 97 + 13) % 26 + 97))
        else:
            out.append(ch)
    return "".join(out)


def _rank(count: int, history: tuple[float, ...], last: int) -> float:
    score = count / 10.0
    weight = 0.95
    idx = max(0, min(last, 9))
    for _ in range(10):
        h = history[idx]
        if h < 0 or h > 1:
            break
        score += h * weight
        weight -= 0.07
        idx = (idx + 9) % 10
    return score


def _read_userassist(key_path: str) -> list[tuple[str, float]]:
    results: list[tuple[str, float]] = []
    try:
        with winreg.OpenKey(winreg.HKEY_CURRENT_USER, key_path, 0, winreg.KEY_READ) as key:
            index = 0
            while True:
                try:
                    name, raw, reg_type = winreg.EnumValue(key, index)
                except OSError:
                    break
                index += 1
                if reg_type != winreg.REG_BINARY or len(raw) < 72:
                    continue
                try:
                    fields = struct.unpack("iiii" + "f" * 10 + "iIIi", raw[:72])
                except struct.error:
                    continue
                count = fields[1]
                history = fields[4:14]
                last = fields[14]
                timestamp = fields[15] | (fields[16] << 32)
                if count <= 0 or timestamp == 0:
                    continue
                decoded = _rot13(name)
                if not decoded or len(decoded) < 3:
                    continue
                score = _rank(count, history, last)
                if score > 0:
                    results.append((decoded, score))
    except OSError:
        pass
    return results


def _resolve_path(raw: str) -> tuple[str, str, str | None] | None:
    if raw.startswith("{") and "}" in raw:
        return None
    if raw.lower().endswith(".lnk"):
        try:
            shell = win32com.client.Dispatch("WScript.Shell")
            sc = shell.CreateShortcut(raw)
            target = sc.TargetPath or ""
            if not target or not Path(target).exists():
                return None
            icon = (sc.IconLocation or "").split(",")[0] or target
            return Path(target).stem, target, icon
        except Exception:
            return None
    if not Path(raw).exists():
        return None
    if Path(raw).suffix.lower() not in {".exe", ".bat", ".cmd"} and not Path(raw).is_dir():
        return None
    return Path(raw).stem, raw, raw


def _from_recent(limit: int) -> list[AppTile]:
    if not RECENT_DIR.exists():
        return []
    entries = sorted(RECENT_DIR.glob("*.lnk"), key=lambda p: p.stat().st_mtime, reverse=True)
    seen: set[str] = set()
    tiles: list[AppTile] = []
    for entry in entries:
        if entry.name.startswith(("AutomaticDestinations", "CustomDestinations")):
            continue
        resolved = _resolve_path(str(entry))
        if not resolved:
            continue
        name, path, icon = resolved
        key = path.lower()
        if key in seen:
            continue
        seen.add(key)
        tiles.append(AppTile(name=name, path=path, icon_path=icon))
        if len(tiles) >= limit:
            break
    return tiles


def get_top_apps(limit: int = 9) -> list[AppTile]:
    ranked: dict[str, tuple[float, str, str, str | None]] = {}
    for key_path in (USERASSIST_LINKS, USERASSIST_APPS):
        for raw_path, score in _read_userassist(key_path):
            resolved = _resolve_path(raw_path)
            if not resolved:
                continue
            name, path, icon = resolved
            if Path(path).name.lower() in IGNORE_NAMES:
                continue
            norm = path.lower()
            if norm not in ranked or ranked[norm][0] < score:
                ranked[norm] = (score, name, path, icon)

    if ranked:
        ordered = sorted(ranked.values(), key=lambda item: item[0], reverse=True)
        return [
            AppTile(name=name, path=path, icon_path=icon)
            for _score, name, path, icon in ordered[:limit]
        ]

    return _from_recent(limit)
