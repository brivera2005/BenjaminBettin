from __future__ import annotations

import os
import subprocess
from pathlib import Path

from PyQt6.QtCore import Qt, QSize, pyqtSignal
from PyQt6.QtGui import QIcon
from PyQt6.QtWidgets import (
    QApplication,
    QFrame,
    QHBoxLayout,
    QLabel,
    QPushButton,
    QScrollArea,
    QVBoxLayout,
    QWidget,
)

from start_menu.recent_items import RecentItem, get_recent_items, launch_item
from start_menu.settings import AppSettings
from start_menu.settings_window import SettingsWindow
from start_menu.styles import theme_stylesheet
from start_menu.window_effects import apply_popup_window_flags, enable_blur


class RecentButton(QPushButton):
    def __init__(self, item: RecentItem, parent: QWidget | None = None) -> None:
        super().__init__(parent)
        self.item = item
        self.setObjectName("RecentButton")
        self.setCursor(Qt.CursorShape.PointingHandCursor)
        self.setMinimumHeight(44)

        icon = self._load_icon(item.icon_path or item.path)
        if icon:
            self.setIcon(icon)
            self.setIconSize(QSize(24, 24))

        self.setText(f"  {item.display_name}")

    def _load_icon(self, path: str) -> QIcon | None:
        if not path or not Path(path).exists():
            return None
        icon = QIcon(path)
        if icon.isNull():
            return None
        return icon


class StartMenuWindow(QWidget):
    closed = pyqtSignal()
    settings_changed = pyqtSignal(AppSettings)

    def __init__(self, settings: AppSettings, parent: QWidget | None = None) -> None:
        super().__init__(parent)
        self.settings = settings
        self._settings_window: SettingsWindow | None = None
        self._build_ui()
        self.apply_settings(settings)

    def _build_ui(self) -> None:
        apply_popup_window_flags(self)
        self.setObjectName("StartMenuRoot")
        self.setFixedSize(self.settings.menu_width, self.settings.menu_height)

        outer = QVBoxLayout(self)
        outer.setContentsMargins(18, 18, 18, 18)
        outer.setSpacing(14)

        header = QHBoxLayout()
        title_block = QVBoxLayout()
        title_block.setSpacing(2)

        title = QLabel("Recently used")
        title.setObjectName("TitleLabel")
        subtitle = QLabel("Your most recent apps and files")
        subtitle.setObjectName("SubtitleLabel")
        title_block.addWidget(title)
        title_block.addWidget(subtitle)

        header.addLayout(title_block)
        header.addStretch(1)

        self.settings_button = QPushButton("Settings")
        self.settings_button.setObjectName("IconButton")
        self.settings_button.setCursor(Qt.CursorShape.PointingHandCursor)
        self.settings_button.clicked.connect(self._open_settings)
        header.addWidget(self.settings_button)

        outer.addLayout(header)

        self.scroll = QScrollArea()
        self.scroll.setWidgetResizable(True)
        self.scroll.setHorizontalScrollBarPolicy(Qt.ScrollBarPolicy.ScrollBarAlwaysOff)

        self.list_container = QWidget()
        self.list_layout = QVBoxLayout(self.list_container)
        self.list_layout.setContentsMargins(0, 0, 0, 0)
        self.list_layout.setSpacing(4)
        self.scroll.setWidget(self.list_container)
        outer.addWidget(self.scroll, stretch=1)

        self.empty_label = QLabel("No recent items yet.\nOpen some apps and they'll show up here.")
        self.empty_label.setObjectName("EmptyLabel")
        self.empty_label.setAlignment(Qt.AlignmentFlag.AlignCenter)
        self.empty_label.setWordWrap(True)
        self.list_layout.addWidget(self.empty_label)

        self.power_row = QFrame()
        power_layout = QHBoxLayout(self.power_row)
        power_layout.setContentsMargins(0, 0, 0, 0)
        power_layout.setSpacing(8)

        for label, action in (
            ("Sleep", "sleep"),
            ("Restart", "restart"),
            ("Shut down", "shutdown"),
        ):
            button = QPushButton(label)
            button.setObjectName("PowerButton")
            button.setCursor(Qt.CursorShape.PointingHandCursor)
            button.clicked.connect(lambda _checked=False, a=action: self._power_action(a))
            power_layout.addWidget(button)

        power_layout.addStretch(1)
        outer.addWidget(self.power_row)

    def apply_settings(self, settings: AppSettings) -> None:
        self.settings = settings
        self.setFixedSize(settings.menu_width, settings.menu_height)
        self.setStyleSheet(theme_stylesheet(settings.theme))
        self.power_row.setVisible(settings.show_power_actions)
        self.refresh_items()

    def refresh_items(self) -> None:
        while self.list_layout.count():
            item = self.list_layout.takeAt(0)
            widget = item.widget()
            if widget:
                widget.deleteLater()

        items = get_recent_items(self.settings.max_recent_items)
        if not items:
            self.empty_label = QLabel("No recent items yet.\nOpen some apps and they'll show up here.")
            self.empty_label.setObjectName("EmptyLabel")
            self.empty_label.setAlignment(Qt.AlignmentFlag.AlignCenter)
            self.empty_label.setWordWrap(True)
            self.list_layout.addWidget(self.empty_label)
            return

        for recent in items:
            button = RecentButton(recent)
            button.clicked.connect(lambda _checked=False, r=recent: self._launch(r))
            self.list_layout.addWidget(button)

        self.list_layout.addStretch(1)

    def show_at_bottom_center(self) -> None:
        screen = QApplication.primaryScreen()
        if not screen:
            self.show()
            return

        geo = screen.availableGeometry()
        x = geo.x() + (geo.width() - self.width()) // 2
        y = geo.y() + geo.height() - self.height() - 48
        self.move(x, y)
        self.refresh_items()
        self.show()
        self.raise_()
        self.activateWindow()
        enable_blur(self)

    def _launch(self, item: RecentItem) -> None:
        launch_item(item)
        self.hide()
        self.closed.emit()

    def _open_settings(self) -> None:
        if self._settings_window is None:
            self._settings_window = SettingsWindow(self.settings, self)
            self._settings_window.saved.connect(self._on_settings_saved)
        self._settings_window.refresh(self.settings)
        self._settings_window.show_centered_over(self)

    def _on_settings_saved(self, settings: AppSettings) -> None:
        self.apply_settings(settings)
        self.settings_changed.emit(settings)

    def _power_action(self, action: str) -> None:
        self.hide()
        self.closed.emit()
        if action == "sleep":
            os.system("rundll32.exe powrprof.dll,SetSuspendState 0,1,0")
        elif action == "restart":
            subprocess.Popen(["shutdown", "/r", "/t", "0"], shell=False)
        elif action == "shutdown":
            subprocess.Popen(["shutdown", "/s", "/t", "0"], shell=False)

    def keyPressEvent(self, event) -> None:  # noqa: N802
        if event.key() == Qt.Key.Key_Escape:
            self.hide()
            self.closed.emit()
            return
        super().keyPressEvent(event)
