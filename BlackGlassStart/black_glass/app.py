from __future__ import annotations

import sys

from PyQt6.QtCore import QTimer
from PyQt6.QtGui import QAction, QIcon, QPixmap, QPainter, QColor
from PyQt6.QtWidgets import QApplication, QMenu, QSystemTrayIcon

from black_glass import __version__
from black_glass.hook import WinKeyHook
from black_glass.menu import MenuWindow, OutsideClickFilter, acquire_single_instance, enable_startup
from black_glass.shell import block_native_start, disable_open_shell


class BlackGlassApp:
    def __init__(self) -> None:
        disable_open_shell()
        enable_startup()

        self.app = QApplication(sys.argv)
        self.app.setApplicationName("Black Glass Start")
        self.app.setApplicationVersion(__version__)
        self.app.setQuitOnLastWindowClosed(False)

        self.menu = MenuWindow()
        self.menu.closed.connect(self._on_closed)

        self._click_filter = OutsideClickFilter(self.menu)
        self.app.installEventFilter(self._click_filter)

        self.hook = WinKeyHook()
        self.hook.win_pressed.connect(self._on_win_key)
        self.hook.start()

        self._block_timer = QTimer()
        self._block_timer.timeout.connect(self._watch_start)
        self._block_timer.start(200)

        self._setup_tray()

    def _setup_tray(self) -> None:
        pixmap = QPixmap(64, 64)
        pixmap.fill(QColor(0, 0, 0, 0))
        painter = QPainter(pixmap)
        painter.setRenderHint(QPainter.RenderHint.Antialiasing)
        painter.setBrush(QColor(20, 20, 22))
        painter.setPen(QColor(255, 255, 255, 40))
        painter.drawRoundedRect(8, 8, 48, 48, 14, 14)
        painter.end()

        self.tray = QSystemTrayIcon(QIcon(pixmap), self.app)
        self.tray.setToolTip("Black Glass Start")

        tray_menu = QMenu()
        open_action = QAction("Open menu", self.app)
        open_action.triggered.connect(self.show_menu)
        quit_action = QAction("Exit", self.app)
        quit_action.triggered.connect(self.quit)
        tray_menu.addAction(open_action)
        tray_menu.addSeparator()
        tray_menu.addAction(quit_action)
        self.tray.setContextMenu(tray_menu)
        self.tray.activated.connect(
            lambda reason: self.show_menu() if reason == QSystemTrayIcon.ActivationReason.Trigger else None
        )
        self.tray.show()

    def _watch_start(self) -> None:
        if self.menu.isVisible():
            return
        try:
            import win32gui

            found = False

            def callback(hwnd, _):
                nonlocal found
                if win32gui.IsWindowVisible(hwnd) and win32gui.GetWindowText(hwnd) == "Start":
                    if win32gui.GetClassName(hwnd) == "Windows.UI.Core.CoreWindow":
                        found = True
                return True

            win32gui.EnumWindows(callback, None)
            if found:
                block_native_start()
                self.show_menu()
        except Exception:
            pass

    def _on_win_key(self) -> None:
        block_native_start()
        self.toggle_menu()

    def _on_closed(self) -> None:
        pass

    def show_menu(self) -> None:
        if self.menu.isVisible():
            self.menu.hide_smooth()
            return
        self.menu.show_centered()

    def toggle_menu(self) -> None:
        if self.menu.isVisible():
            self.menu.hide_smooth()
        else:
            self.show_menu()

    def quit(self) -> None:
        self.hook.stop()
        self.tray.hide()
        self.app.quit()

    def run(self) -> int:
        return self.app.exec()


def main() -> int:
    if not acquire_single_instance():
        return 0
    return BlackGlassApp().run()
