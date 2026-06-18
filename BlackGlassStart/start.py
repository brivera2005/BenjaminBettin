"""
Black Glass Start — one file, dead simple.
Win key = open. 3x3 most-used apps. Restart / Shut down.
"""
from __future__ import annotations

import ctypes
import os
import struct
import subprocess
import sys
import threading
import winreg
from ctypes import wintypes
from dataclasses import dataclass
from pathlib import Path

from PyQt6.QtCore import Qt, QSize, QObject, pyqtSignal, QEvent
from PyQt6.QtGui import QIcon, QPixmap, QPainter, QColor
from PyQt6.QtWidgets import (
    QApplication,
    QGridLayout,
    QHBoxLayout,
    QPushButton,
    QSystemTrayIcon,
    QMenu,
    QVBoxLayout,
    QWidget,
)

# --- config ---
APP_NAME = "BlackGlassStart"
RECENT = Path(os.environ.get("APPDATA", "")) / "Microsoft/Windows/Recent"
UA_KEY = r"Software\Microsoft\Windows\CurrentVersion\Explorer\UserAssist\{F4E57C4B-2036-45F0-A9AB-443BCFE33D9F}\Count"

STYLE = """
QWidget#Root {
    background-color: #111111;
    border: 1px solid #2a2a2a;
    border-radius: 16px;
}
QPushButton#Tile {
    background-color: #1a1a1a;
    border: 1px solid #2a2a2a;
    border-radius: 12px;
    color: #eeeeee;
    font-size: 10px;
    padding: 6px;
}
QPushButton#Tile:hover { background-color: #252525; }
QPushButton#Power {
    background-color: #1a1a1a;
    border: 1px solid #333333;
    border-radius: 10px;
    color: #eeeeee;
    font-size: 13px;
    min-height: 38px;
}
QPushButton#Power:hover { background-color: #282828; }
"""


@dataclass
class App:
    name: str
    path: str
    icon: str | None = None


def rot13(s: str) -> str:
    out = []
    for c in s:
        o = ord(c)
        if 65 <= o <= 90:
            out.append(chr((o - 65 + 13) % 26 + 65))
        elif 97 <= o <= 122:
            out.append(chr((o - 97 + 13) % 26 + 97))
        else:
            out.append(c)
    return "".join(out)


def resolve_lnk(path: str) -> tuple[str, str, str | None] | None:
    try:
        import win32com.client
        sc = win32com.client.Dispatch("WScript.Shell").CreateShortcut(path)
        target = sc.TargetPath or ""
        if not target or not Path(target).exists():
            return None
        icon = (sc.IconLocation or "").split(",")[0] or target
        return Path(target).stem[:20], target, icon
    except Exception:
        return None


def top_apps(n: int = 9) -> list[App]:
    scored: list[tuple[float, App]] = []

    def add(path: str, score: float) -> None:
        path = path.strip()
        if not path or path.startswith("UEME_"):
            return
        if path.lower().endswith(".lnk"):
            if not Path(path).is_absolute():
                return
            r = resolve_lnk(path)
        elif Path(path).is_file():
            r = (Path(path).stem[:20], path, path)
        else:
            return
        if r:
            p = r[1].lower()
            bonus = 1000.0 if "\\users\\" in p and "system32" not in p else 0.0
            scored.append((score + bonus, App(r[0], r[1], r[2])))

    try:
        with winreg.OpenKey(winreg.HKEY_CURRENT_USER, UA_KEY) as key:
            i = 0
            while True:
                try:
                    name, raw, typ = winreg.EnumValue(key, i)
                except OSError:
                    break
                i += 1
                if typ != winreg.REG_BINARY or len(raw) < 8:
                    continue
                count = struct.unpack("i", raw[4:8])[0]
                if count < 1:
                    continue
                add(rot13(name), float(count))
    except OSError:
        pass

    if scored:
        scored.sort(key=lambda x: x[0], reverse=True)
        seen: set[str] = set()
        out: list[App] = []
        for _, app in scored:
            k = app.path.lower()
            if k in seen:
                continue
            seen.add(k)
            out.append(app)
            if len(out) >= n:
                return out

    # fallback: start menu shortcuts
    dirs = [
        Path(os.environ.get("PROGRAMDATA", "")) / "Microsoft/Windows/Start Menu/Programs",
        Path(os.environ.get("APPDATA", "")) / "Microsoft/Windows/Start Menu/Programs",
        Path(os.environ.get("PUBLIC", "")) / "Desktop",
        Path.home() / "Desktop",
    ]
    out = []
    seen = set()
    for d in dirs:
        if not d.exists():
            continue
        for lnk in sorted(d.rglob("*.lnk")):
            r = resolve_lnk(str(lnk))
            if not r or r[1].lower() in seen:
                continue
            seen.add(r[1].lower())
            out.append(App(r[0], r[1], r[2]))
            if len(out) >= n:
                return out
    return out


# --- win key hook ---
WH_KEYBOARD_LL = 13
WM_KEYDOWN, WM_SYSKEYDOWN = 0x0100, 0x0104
WM_KEYUP, WM_SYSKEYUP = 0x0101, 0x0105
WM_QUIT, VK_LWIN, VK_RWIN, HC_ACTION = 0x0012, 0x5B, 0x5C, 0


class KBDLLHOOKSTRUCT(ctypes.Structure):
    _fields_ = [("vkCode", wintypes.DWORD), ("scanCode", wintypes.DWORD),
                ("flags", wintypes.DWORD), ("time", wintypes.DWORD),
                ("dwExtraInfo", ctypes.c_ulonglong)]


class WinHook(QObject):
    pressed = pyqtSignal()

    def __init__(self):
        super().__init__()
        self._on = True
        self._run = True
        self._hook = None
        self._tid = None
        self._proc = ctypes.WINFUNCTYPE(ctypes.c_long, ctypes.c_int, wintypes.WPARAM, wintypes.LPARAM)(self._cb)
        threading.Thread(target=self._loop, daemon=True).start()

    def _cb(self, n, w, l):
        if n == HC_ACTION and self._on:
            k = ctypes.cast(l, ctypes.POINTER(KBDLLHOOKSTRUCT)).contents.vkCode
            if k in (VK_LWIN, VK_RWIN):
                if w in (WM_KEYDOWN, WM_SYSKEYDOWN):
                    self.pressed.emit()
                return 1
        return ctypes.windll.user32.CallNextHookEx(self._hook, n, w, l) if self._hook else 0

    def _loop(self):
        u, k = ctypes.windll.user32, ctypes.windll.kernel32
        self._tid = k.GetCurrentThreadId()
        self._hook = u.SetWindowsHookExW(WH_KEYBOARD_LL, self._proc, k.GetModuleHandleW(None), 0)
        msg = wintypes.MSG()
        while self._run and u.GetMessageW(ctypes.byref(msg), None, 0, 0) not in (0, -1):
            u.TranslateMessage(ctypes.byref(msg))
            u.DispatchMessageW(ctypes.byref(msg))
        if self._hook:
            u.UnhookWindowsHookEx(self._hook)

    def stop(self):
        self._run = False
        if self._tid:
            ctypes.windll.user32.PostThreadMessageW(self._tid, WM_QUIT, 0, 0)


class Menu(QWidget):
    def __init__(self):
        super().__init__()
        self.setObjectName("Root")
        self.setWindowFlags(Qt.WindowType.FramelessWindowHint | Qt.WindowType.Popup)
        self.setFixedSize(400, 430)
        self.setStyleSheet(STYLE)

        lay = QVBoxLayout(self)
        lay.setContentsMargins(16, 16, 16, 16)
        lay.setSpacing(12)

        self.grid = QGridLayout()
        self.grid.setSpacing(8)
        lay.addLayout(self.grid, stretch=1)

        row = QHBoxLayout()
        row.setSpacing(10)
        for label, cmd in (("Restart", "restart"), ("Shut down", "shutdown")):
            b = QPushButton(label)
            b.setObjectName("Power")
            b.setCursor(Qt.CursorShape.PointingHandCursor)
            b.clicked.connect(lambda _, c=cmd: self._power(c))
            row.addWidget(b, stretch=1)
        lay.addLayout(row)

    def refresh(self):
        while self.grid.count():
            w = self.grid.takeAt(0).widget()
            if w:
                w.deleteLater()
        apps = top_apps(9)
        for i, app in enumerate(apps):
            b = QPushButton(app.name)
            b.setObjectName("Tile")
            b.setFixedSize(112, 96)
            b.setCursor(Qt.CursorShape.PointingHandCursor)
            if app.icon and Path(app.icon).exists():
                ic = QIcon(app.icon)
                if not ic.isNull():
                    b.setIcon(ic)
                    b.setIconSize(QSize(40, 40))
            b.clicked.connect(lambda _, p=app.path: self._open(p))
            self.grid.addWidget(b, i // 3, i % 3)

    def show_menu(self):
        s = QApplication.primaryScreen()
        if s:
            g = s.availableGeometry()
            self.move(g.x() + (g.width() - self.width()) // 2, g.y() + g.height() - self.height() - 48)
        self.refresh()
        self.show()
        self.raise_()
        self.activateWindow()

    def _open(self, path: str):
        os.startfile(path)
        self.hide()

    def _power(self, cmd: str):
        self.hide()
        subprocess.Popen(["shutdown", "/r" if cmd == "restart" else "/s", "/t", "0"])

    def keyPressEvent(self, e):
        if e.key() == Qt.Key.Key_Escape:
            self.hide()


class AppController(QObject):
    def __init__(self):
        super().__init__()
        self.q = QApplication(sys.argv)
        self.q.setQuitOnLastWindowClosed(False)
        self.menu = Menu()
        self.hook = WinHook()
        self.hook.pressed.connect(self._toggle)
        self.q.installEventFilter(self)
        self._tray()

    def _tray(self):
        px = QPixmap(32, 32)
        px.fill(QColor(0, 0, 0, 0))
        p = QPainter(px)
        p.fillRect(4, 4, 24, 24, QColor("#111111"))
        p.end()
        tray = QSystemTrayIcon(QIcon(px), self.q)
        tray.setToolTip("Black Glass Start — press Win")
        m = QMenu()
        m.addAction("Open menu", self._toggle)
        m.addAction("Quit", self.q.quit)
        tray.setContextMenu(m)
        tray.activated.connect(
            lambda r: self._toggle() if r == QSystemTrayIcon.ActivationReason.Trigger else None
        )
        tray.show()
        self.tray = tray

    def eventFilter(self, obj, event):
        if event.type() == QEvent.Type.MouseButtonPress and self.menu.isVisible():
            if not self.menu.geometry().contains(event.globalPosition().toPoint()):
                self.menu.hide()
        return False

    def _toggle(self):
        if self.menu.isVisible():
            self.menu.hide()
        else:
            subprocess.run(["taskkill", "/F", "/IM", "StartMenuExperienceHost.exe"],
                           capture_output=True, check=False)
            self.menu.show_menu()

    def run(self):
        return self.q.exec()


def ensure_startup():
    bat = Path(__file__).resolve().parent / "launch.bat"
    cmd = f'"{sys.executable}"' if getattr(sys, "frozen", False) else f'"{bat}"'
    with winreg.OpenKey(winreg.HKEY_CURRENT_USER,
                        r"Software\Microsoft\Windows\CurrentVersion\Run", 0, winreg.KEY_SET_VALUE) as k:
        winreg.SetValueEx(k, APP_NAME, 0, winreg.REG_SZ, cmd)


def single_instance() -> bool:
    ctypes.windll.kernel32.CreateMutexW(None, False, "BlackGlassStartMutex")
    return ctypes.windll.kernel32.GetLastError() != 183


def main():
    if not single_instance():
        return 0
    ensure_startup()
    return AppController().run()


if __name__ == "__main__":
    sys.exit(main())
