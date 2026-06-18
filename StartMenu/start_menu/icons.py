from __future__ import annotations

from pathlib import Path

from PyQt6.QtCore import QSize
from PyQt6.QtGui import QIcon


def load_icon(path: str | None, size: int = 32) -> QIcon:
    if path and Path(path).exists():
        icon = QIcon(path)
        if not icon.isNull():
            return icon
    return QIcon()
