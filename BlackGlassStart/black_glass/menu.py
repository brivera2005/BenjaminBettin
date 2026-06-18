from __future__ import annotations

import ctypes
import os
import subprocess
import sys
import winreg
from pathlib import Path

from PyQt6.QtCore import Qt, QSize, pyqtSignal, QEvent, QPropertyAnimation, QEasingCurve, QObject
from PyQt6.QtGui import QIcon, QPainter, QColor, QPen, QPainterPath
from PyQt6.QtWidgets import (
    QApplication,
    QGridLayout,
    QHBoxLayout,
    QLabel,
    QPushButton,
    QVBoxLayout,
    QWidget,
    QGraphicsDropShadowEffect,
)

from black_glass.effects import apply_popup_window_flags, enable_acrylic
from black_glass.frequent import AppTile, get_top_apps


APP_NAME = "BlackGlassStart"
RUN_KEY = r"Software\Microsoft\Windows\CurrentVersion\Run"
LAUNCHER = Path(__file__).resolve().parent.parent / "launch.bat"


class GlassPanel(QWidget):
    def paintEvent(self, event) -> None:  # noqa: N802
        painter = QPainter(self)
        painter.setRenderHint(QPainter.RenderHint.Antialiasing)
        rect = self.rect().adjusted(1, 1, -1, -1)
        path = QPainterPath()
        path.addRoundedRect(rect.x(), rect.y(), rect.width(), rect.height(), 18, 18)
        painter.fillPath(path, QColor(12, 12, 14, 242))
        painter.setPen(QPen(QColor(255, 255, 255, 28), 1))
        painter.drawPath(path)


class TileButton(QPushButton):
    def __init__(self, app: AppTile, parent: QWidget | None = None) -> None:
        super().__init__(parent)
        self.app = app
        self.setCursor(Qt.CursorShape.PointingHandCursor)
        self.setFixedSize(128, 118)
        self.setToolTip(app.name)
        icon_path = app.icon_path or app.path
        if icon_path and Path(icon_path).exists():
            icon = QIcon(icon_path)
            if not icon.isNull():
                self.setIcon(icon)
                self.setIconSize(QSize(52, 52))
        self.setText(app.name)
        self.setStyleSheet(
            """
            QPushButton {
                background: transparent;
                border: none;
                border-radius: 14px;
                color: rgba(255, 255, 255, 0.92);
                font-size: 11px;
                padding-top: 8px;
                text-align: center;
            }
            QPushButton:hover {
                background: rgba(255, 255, 255, 0.09);
            }
            QPushButton:pressed {
                background: rgba(255, 255, 255, 0.14);
            }
            """
        )


class MenuWindow(QWidget):
    closed = pyqtSignal()

    def __init__(self) -> None:
        super().__init__()
        self._opacity = 1.0
        self._build_ui()

    def _build_ui(self) -> None:
        apply_popup_window_flags(self)
        self.setFixedSize(432, 468)

        outer = QVBoxLayout(self)
        outer.setContentsMargins(14, 14, 14, 14)

        self.panel = GlassPanel()
        shadow = QGraphicsDropShadowEffect(self.panel)
        shadow.setBlurRadius(36)
        shadow.setOffset(0, 10)
        shadow.setColor(QColor(0, 0, 0, 160))
        self.panel.setGraphicsEffect(shadow)

        layout = QVBoxLayout(self.panel)
        layout.setContentsMargins(20, 22, 20, 18)
        layout.setSpacing(16)

        title = QLabel("Most used")
        title.setStyleSheet("color: rgba(255,255,255,0.55); font-size: 12px; letter-spacing: 0.5px;")
        layout.addWidget(title)

        self.grid_host = QWidget()
        self.grid = QGridLayout(self.grid_host)
        self.grid.setContentsMargins(0, 0, 0, 0)
        self.grid.setHorizontalSpacing(10)
        self.grid.setVerticalSpacing(10)
        layout.addWidget(self.grid_host, stretch=1)

        footer = QHBoxLayout()
        footer.setSpacing(10)

        restart = QPushButton("Restart")
        shutdown = QPushButton("Shut down")
        for btn in (restart, shutdown):
            btn.setFixedHeight(40)
            btn.setCursor(Qt.CursorShape.PointingHandCursor)
            btn.setStyleSheet(
                """
                QPushButton {
                    background: rgba(255, 255, 255, 0.07);
                    border: 1px solid rgba(255, 255, 255, 0.10);
                    border-radius: 10px;
                    color: white;
                    font-size: 13px;
                    padding: 0 18px;
                }
                QPushButton:hover {
                    background: rgba(255, 255, 255, 0.13);
                }
                """
            )
            footer.addWidget(btn, stretch=1)

        restart.clicked.connect(lambda: self._power("restart"))
        shutdown.clicked.connect(lambda: self._power("shutdown"))
        layout.addLayout(footer)

        outer.addWidget(self.panel)

    def refresh(self) -> None:
        while self.grid.count():
            item = self.grid.takeAt(0)
            widget = item.widget()
            if widget:
                widget.deleteLater()

        apps = get_top_apps(9)
        if not apps:
            empty = QLabel("Open some apps and they'll appear here.")
            empty.setAlignment(Qt.AlignmentFlag.AlignCenter)
            empty.setStyleSheet("color: rgba(255,255,255,0.45); font-size: 12px;")
            self.grid.addWidget(empty, 0, 0, 3, 3)
            return

        for index, app in enumerate(apps):
            tile = TileButton(app)
            tile.clicked.connect(lambda _checked=False, a=app: self._launch(a))
            row, col = divmod(index, 3)
            self.grid.addWidget(tile, row, col)

    def show_centered(self) -> None:
        screen = QApplication.primaryScreen()
        if screen:
            geo = screen.availableGeometry()
            x = geo.x() + (geo.width() - self.width()) // 2
            y = geo.y() + geo.height() - self.height() - 52
            self.move(x, y)
        self.refresh()
        self.setWindowOpacity(0.0)
        self.show()
        self.raise_()
        self.activateWindow()
        enable_acrylic(self)

        anim = QPropertyAnimation(self, b"windowOpacity")
        anim.setDuration(140)
        anim.setStartValue(0.0)
        anim.setEndValue(1.0)
        anim.setEasingCurve(QEasingCurve.Type.OutCubic)
        anim.start(QPropertyAnimation.DeletionPolicy.DeleteWhenStopped)
        self._show_anim = anim

    def hide_smooth(self) -> None:
        anim = QPropertyAnimation(self, b"windowOpacity")
        anim.setDuration(100)
        anim.setStartValue(self.windowOpacity())
        anim.setEndValue(0.0)
        anim.setEasingCurve(QEasingCurve.Type.InCubic)
        anim.finished.connect(self._finish_hide)
        anim.start(QPropertyAnimation.DeletionPolicy.DeleteWhenStopped)
        self._hide_anim = anim

    def _finish_hide(self) -> None:
        self.hide()
        self.setWindowOpacity(1.0)
        self.closed.emit()

    def _launch(self, app: AppTile) -> None:
        os.startfile(app.path)
        self.hide_smooth()

    def _power(self, action: str) -> None:
        self.hide_smooth()
        if action == "restart":
            subprocess.Popen(["shutdown", "/r", "/t", "0"], shell=False)
        else:
            subprocess.Popen(["shutdown", "/s", "/t", "0"], shell=False)

    def keyPressEvent(self, event) -> None:  # noqa: N802
        if event.key() == Qt.Key.Key_Escape:
            self.hide_smooth()
            return
        super().keyPressEvent(event)


class OutsideClickFilter(QObject):
    def __init__(self, menu: MenuWindow) -> None:
        super().__init__()
        self.menu = menu

    def eventFilter(self, obj, event) -> bool:  # noqa: N802
        if event.type() == QEvent.Type.MouseButtonPress and self.menu.isVisible():
            if not self.menu.geometry().contains(event.globalPosition().toPoint()):
                self.menu.hide_smooth()
                return True
        return False


def launcher_command() -> str:
    if getattr(sys, "frozen", False):
        return f'"{sys.executable}"'
    return f'"{LAUNCHER}"'


def enable_startup() -> None:
    with winreg.OpenKey(winreg.HKEY_CURRENT_USER, RUN_KEY, 0, winreg.KEY_SET_VALUE) as key:
        winreg.SetValueEx(key, APP_NAME, 0, winreg.REG_SZ, launcher_command())


MUTEX_NAME = "BlackGlassStart_SingleInstance"


def acquire_single_instance() -> bool:
    kernel32 = ctypes.windll.kernel32
    kernel32.CreateMutexW(None, False, MUTEX_NAME)
    return kernel32.GetLastError() != 183
