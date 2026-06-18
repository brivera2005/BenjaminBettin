from __future__ import annotations

import ctypes
import sys

from PyQt6.QtCore import Qt, QTimer
from PyQt6.QtGui import QAction, QIcon, QPixmap, QPainter, QColor
from PyQt6.QtWidgets import QApplication, QMenu, QSystemTrayIcon

from start_menu import __version__
from start_menu.keyboard_hook import WinKeyHook
from start_menu.menu_window import StartMenuWindow
from start_menu.settings import AppSettings
from start_menu.setup import ensure_installed
from start_menu.startup import is_startup_enabled, set_startup_enabled


MUTEX_NAME = "SimpleStartMenu_SingleInstance_Mutex"


class StartMenuApp:
    def __init__(self) -> None:
        self.settings = AppSettings.load()
        self.settings = ensure_installed(self.settings)

        if self.settings.launch_at_startup != is_startup_enabled():
            try:
                set_startup_enabled(self.settings.launch_at_startup)
            except RuntimeError:
                pass

        self.app = QApplication(sys.argv)
        self.app.setApplicationName("Simple Start Menu")
        self.app.setApplicationVersion(__version__)
        self.app.setQuitOnLastWindowClosed(False)

        self.menu = StartMenuWindow(self.settings)
        self.menu.closed.connect(self._on_menu_closed)
        self.menu.settings_changed.connect(self._on_settings_changed)

        self.hook = WinKeyHook()
        self.hook.win_pressed.connect(self.toggle_menu)
        self.hook.set_enabled(self.settings.intercept_win_key)

        self._menu_visible = False
        self._setup_tray()
        self._setup_hook_timer()

    def _setup_tray(self) -> None:
        icon = self._create_tray_icon()
        self.tray = QSystemTrayIcon(icon, self.app)
        self.tray.setToolTip("Simple Start Menu")

        tray_menu = QMenu()
        open_action = QAction("Open Start Menu", self.app)
        open_action.triggered.connect(self.show_menu)
        tray_menu.addAction(open_action)

        tray_menu.addSeparator()

        quit_action = QAction("Exit", self.app)
        quit_action.triggered.connect(self.quit)
        tray_menu.addAction(quit_action)

        self.tray.setContextMenu(tray_menu)
        self.tray.activated.connect(self._tray_activated)
        self.tray.show()

    def _create_tray_icon(self) -> QIcon:
        pixmap = QPixmap(64, 64)
        pixmap.fill(Qt.GlobalColor.transparent)
        painter = QPainter(pixmap)
        painter.setRenderHint(QPainter.RenderHint.Antialiasing)
        painter.setBrush(QColor("#0078d4"))
        painter.setPen(Qt.PenStyle.NoPen)
        painter.drawRoundedRect(8, 8, 48, 48, 12, 12)
        painter.end()
        return QIcon(pixmap)

    def _setup_hook_timer(self) -> None:
        self._hook_timer = QTimer()
        self._hook_timer.timeout.connect(self._pump_messages)
        self._hook_timer.start(10)
        QTimer.singleShot(0, self._start_hook)

    def _start_hook(self) -> None:
        try:
            self.hook.start()
        except RuntimeError:
            self.settings.intercept_win_key = False
            self.settings.save()
            self.tray.showMessage(
                "Simple Start Menu",
                "Could not capture the Windows key. Use the tray icon instead.",
                QSystemTrayIcon.MessageIcon.Warning,
                5000,
            )

    def _pump_messages(self) -> None:
        self.app.processEvents()

    def _tray_activated(self, reason: QSystemTrayIcon.ActivationReason) -> None:
        if reason == QSystemTrayIcon.ActivationReason.Trigger:
            self.toggle_menu()

    def _on_menu_closed(self) -> None:
        self._menu_visible = False

    def _on_settings_changed(self, settings: AppSettings) -> None:
        self.settings = settings
        self.hook.set_enabled(settings.intercept_win_key)

    def show_menu(self) -> None:
        if self._menu_visible and self.menu.isVisible():
            self.menu.hide()
            self._menu_visible = False
            return
        self.menu.show_at_bottom_center()
        self._menu_visible = True

    def toggle_menu(self) -> None:
        if self.menu.isVisible():
            self.menu.hide()
            self._menu_visible = False
        else:
            self.show_menu()

    def quit(self) -> None:
        self.hook.stop()
        self.tray.hide()
        self.app.quit()

    def run(self) -> int:
        self.tray.showMessage(
            "Simple Start Menu",
            "Press the Windows key or click the tray icon to open.",
            QSystemTrayIcon.MessageIcon.Information,
            4000,
        )
        return self.app.exec()


def acquire_single_instance() -> bool:
    kernel32 = ctypes.windll.kernel32
    mutex = kernel32.CreateMutexW(None, False, MUTEX_NAME)
    last_error = kernel32.GetLastError()
    return last_error != 183


def main() -> int:
    if not acquire_single_instance():
        return 0
    app = StartMenuApp()
    return app.run()
