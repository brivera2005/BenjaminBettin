from __future__ import annotations

import json
from dataclasses import asdict, dataclass, field
from pathlib import Path


CONFIG_DIR = Path.home() / "AppData" / "Local" / "SimpleStartMenu"
CONFIG_FILE = CONFIG_DIR / "settings.json"


@dataclass
class AppSettings:
    theme: str = "dark"
    max_recent_items: int = 6
    max_pinned_items: int = 18
    intercept_win_key: bool = True
    block_native_start: bool = True
    launch_at_startup: bool = True
    menu_width: int = 680
    menu_height: int = 740
    show_power_actions: bool = True
    pinned_apps: list[str] = field(default_factory=list)
    unpin_windows_done: bool = False

    @classmethod
    def load(cls) -> AppSettings:
        if not CONFIG_FILE.exists():
            return cls()
        try:
            data = json.loads(CONFIG_FILE.read_text(encoding="utf-8"))
            allowed = {field.name for field in cls.__dataclass_fields__.values()}
            filtered = {key: value for key, value in data.items() if key in allowed}
            return cls(**filtered)
        except (json.JSONDecodeError, TypeError, ValueError):
            return cls()

    def save(self) -> None:
        CONFIG_DIR.mkdir(parents=True, exist_ok=True)
        CONFIG_FILE.write_text(
            json.dumps(asdict(self), indent=2),
            encoding="utf-8",
        )

    def pin_app(self, path: str) -> None:
        if path not in self.pinned_apps:
            self.pinned_apps.append(path)
            self.save()

    def unpin_app(self, path: str) -> None:
        if path in self.pinned_apps:
            self.pinned_apps.remove(path)
            self.save()
