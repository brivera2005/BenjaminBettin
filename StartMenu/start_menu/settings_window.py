from __future__ import annotations

import subprocess

from PyQt6.QtCore import pyqtSignal
from PyQt6.QtWidgets import (
    QCheckBox,
    QComboBox,
    QFormLayout,
    QHBoxLayout,
    QLabel,
    QPushButton,
    QSpinBox,
    QVBoxLayout,
    QWidget,
)

from start_menu.settings import AppSettings
from start_menu.startup import set_startup_enabled
from start_menu.styles import theme_stylesheet
from start_menu.window_effects import apply_popup_window_flags


class SettingsWindow(QWidget):
    saved = pyqtSignal(AppSettings)

    def __init__(self, settings: AppSettings, parent: QWidget | None = None) -> None:
        super().__init__(parent)
        self._settings = settings
        self._build_ui()
        self._load_values()

    def _build_ui(self) -> None:
        apply_popup_window_flags(self)
        self.setObjectName("SettingsRoot")
        self.setFixedSize(420, 420)

        layout = QVBoxLayout(self)
        layout.setContentsMargins(24, 24, 24, 24)
        layout.setSpacing(16)

        title = QLabel("Settings")
        title.setObjectName("SettingsTitle")
        layout.addWidget(title)

        form = QFormLayout()
        form.setSpacing(12)

        self.theme_combo = QComboBox()
        self.theme_combo.addItems(["Dark", "Light"])
        form.addRow(self._label("Theme"), self.theme_combo)

        self.recent_spin = QSpinBox()
        self.recent_spin.setRange(4, 24)
        self.recent_spin.setSingleStep(1)
        form.addRow(self._label("Recent items"), self.recent_spin)

        self.win_key_check = QCheckBox("Replace Windows key with Simple Start Menu")
        form.addRow(self.win_key_check)

        self.startup_check = QCheckBox("Launch at Windows sign-in")
        form.addRow(self.startup_check)

        self.power_check = QCheckBox("Show power actions")
        form.addRow(self.power_check)

        layout.addLayout(form)
        layout.addStretch(1)

        buttons = QHBoxLayout()
        buttons.addStretch(1)

        cancel = QPushButton("Cancel")
        cancel.setObjectName("SecondaryButton")
        cancel.clicked.connect(self.hide)
        buttons.addWidget(cancel)

        save = QPushButton("Save")
        save.setObjectName("PrimaryButton")
        save.clicked.connect(self._save)
        buttons.addWidget(save)

        layout.addLayout(buttons)
        self.setStyleSheet(theme_stylesheet(self._settings.theme))

    def _label(self, text: str) -> QLabel:
        label = QLabel(text)
        label.setObjectName("SettingsLabel")
        return label

    def refresh(self, settings: AppSettings) -> None:
        self._settings = settings
        self._load_values()
        self.setStyleSheet(theme_stylesheet(settings.theme))

    def _load_values(self) -> None:
        self.theme_combo.setCurrentText(self._settings.theme.capitalize())
        self.recent_spin.setValue(self._settings.max_recent_items)
        self.win_key_check.setChecked(self._settings.intercept_win_key)
        self.startup_check.setChecked(self._settings.launch_at_startup)
        self.power_check.setChecked(self._settings.show_power_actions)

    def show_centered_over(self, parent: QWidget) -> None:
        parent_geo = parent.geometry()
        x = parent_geo.x() + (parent_geo.width() - self.width()) // 2
        y = parent_geo.y() + (parent_geo.height() - self.height()) // 2
        self.move(x, y)
        self.show()
        self.raise_()
        self.activateWindow()

    def _save(self) -> None:
        self._settings.theme = self.theme_combo.currentText().lower()
        self._settings.max_recent_items = self.recent_spin.value()
        self._settings.intercept_win_key = self.win_key_check.isChecked()
        self._settings.launch_at_startup = self.startup_check.isChecked()
        self._settings.show_power_actions = self.power_check.isChecked()
        self._settings.save()

        try:
            set_startup_enabled(self._settings.launch_at_startup)
        except RuntimeError as exc:
            self.startup_check.setChecked(not self._settings.launch_at_startup)
            self._settings.launch_at_startup = self.startup_check.isChecked()
            self._settings.save()

        self.saved.emit(self._settings)
        self.hide()
