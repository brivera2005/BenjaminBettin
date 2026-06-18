from __future__ import annotations

import getpass
import os
import subprocess
from enum import Enum, auto

from PyQt6.QtCore import Qt, QSize, pyqtSignal, QTimer
from PyQt6.QtGui import QAction
from PyQt6.QtWidgets import (
    QApplication,
    QCheckBox,
    QComboBox,
    QFormLayout,
    QFrame,
    QGridLayout,
    QHBoxLayout,
    QLabel,
    QLineEdit,
    QMenu,
    QPushButton,
    QScrollArea,
    QSpinBox,
    QStackedWidget,
    QVBoxLayout,
    QWidget,
)

from start_menu.apps import AppItem, get_all_apps, launch_app, search_apps
from start_menu.icons import load_icon
from start_menu.recent_items import get_recent_items
from start_menu.settings import AppSettings
from start_menu.startup import set_startup_enabled
from start_menu.styles import theme_stylesheet
from start_menu.window_effects import apply_popup_window_flags, enable_blur


class Page(Enum):
    HOME = auto()
    ALL_APPS = auto()
    SETTINGS = auto()


class AppTileButton(QPushButton):
    def __init__(self, app: AppItem, parent: QWidget | None = None) -> None:
        super().__init__(parent)
        self.app = app
        self.setObjectName("AppTile")
        self.setCursor(Qt.CursorShape.PointingHandCursor)
        self.setFixedSize(96, 88)
        icon = load_icon(app.icon_path or app.path)
        if not icon.isNull():
            self.setIcon(icon)
            self.setIconSize(QSize(36, 36))
        self.setText(app.name)
        self.setToolTip(app.path)


class ListItemButton(QPushButton):
    def __init__(self, app: AppItem, parent: QWidget | None = None) -> None:
        super().__init__(parent)
        self.app = app
        self.setObjectName("ListItem")
        self.setCursor(Qt.CursorShape.PointingHandCursor)
        self.setMinimumHeight(42)
        icon = load_icon(app.icon_path or app.path)
        if not icon.isNull():
            self.setIcon(icon)
            self.setIconSize(QSize(24, 24))
        self.setText(f"  {app.name}")
        self.setToolTip(app.path)


class StartMenuWindow(QWidget):
    closed = pyqtSignal()
    settings_changed = pyqtSignal(AppSettings)

    def __init__(self, settings: AppSettings, parent: QWidget | None = None) -> None:
        super().__init__(parent)
        self.settings = settings
        self._all_apps: list[AppItem] = []
        self._apps_by_path: dict[str, AppItem] = {}
        self._search_timer = QTimer(self)
        self._search_timer.setSingleShot(True)
        self._search_timer.setInterval(120)
        self._search_timer.timeout.connect(self._apply_search)
        self._build_ui()
        self.apply_settings(settings)

    def _build_ui(self) -> None:
        apply_popup_window_flags(self)
        self.setObjectName("StartMenuRoot")

        root = QVBoxLayout(self)
        root.setContentsMargins(20, 20, 20, 16)
        root.setSpacing(12)

        top = QHBoxLayout()
        self.search_box = QLineEdit()
        self.search_box.setObjectName("SearchBox")
        self.search_box.setPlaceholderText("Search for apps, settings, and documents")
        self.search_box.textChanged.connect(self._on_search_changed)
        self.search_box.returnPressed.connect(self._launch_first_search_result)
        top.addWidget(self.search_box, stretch=1)

        user = QLabel(getpass.getuser())
        user.setObjectName("UserLabel")
        top.addWidget(user)
        root.addLayout(top)

        self.stack = QStackedWidget()
        root.addWidget(self.stack, stretch=1)

        self.home_page = self._build_home_page()
        self.all_apps_page = self._build_all_apps_page()
        self.settings_page = self._build_settings_page()
        self.search_page = self._build_search_page()

        self.stack.addWidget(self.home_page)
        self.stack.addWidget(self.all_apps_page)
        self.stack.addWidget(self.settings_page)
        self.stack.addWidget(self.search_page)

        footer = QHBoxLayout()
        self.power_button = QPushButton("Power")
        self.power_button.setObjectName("FooterButton")
        self.power_button.setCursor(Qt.CursorShape.PointingHandCursor)
        self.power_button.clicked.connect(self._show_power_menu)
        footer.addWidget(self.power_button)

        footer.addStretch(1)

        settings_btn = QPushButton("Settings")
        settings_btn.setObjectName("FooterButton")
        settings_btn.setCursor(Qt.CursorShape.PointingHandCursor)
        settings_btn.clicked.connect(lambda: self._show_page(Page.SETTINGS))
        footer.addWidget(settings_btn)
        root.addLayout(footer)

    def _build_home_page(self) -> QWidget:
        page = QWidget()
        layout = QHBoxLayout(page)
        layout.setContentsMargins(0, 0, 0, 0)
        layout.setSpacing(16)

        left = QVBoxLayout()
        pinned_title = QLabel("Pinned")
        pinned_title.setObjectName("SectionTitle")
        left.addWidget(pinned_title)

        self.pinned_scroll = QScrollArea()
        self.pinned_scroll.setWidgetResizable(True)
        self.pinned_scroll.setHorizontalScrollBarPolicy(Qt.ScrollBarPolicy.ScrollBarAlwaysOff)
        self.pinned_container = QWidget()
        self.pinned_grid = QGridLayout(self.pinned_container)
        self.pinned_grid.setContentsMargins(0, 0, 0, 0)
        self.pinned_grid.setHorizontalSpacing(4)
        self.pinned_grid.setVerticalSpacing(4)
        self.pinned_scroll.setWidget(self.pinned_container)
        left.addWidget(self.pinned_scroll, stretch=1)

        all_apps_link = QPushButton("All apps  →")
        all_apps_link.setObjectName("TextLink")
        all_apps_link.setCursor(Qt.CursorShape.PointingHandCursor)
        all_apps_link.clicked.connect(lambda: self._show_page(Page.ALL_APPS))
        left.addWidget(all_apps_link)

        layout.addLayout(left, stretch=3)

        divider = QFrame()
        divider.setObjectName("Divider")
        divider.setFrameShape(QFrame.Shape.VLine)
        layout.addWidget(divider)

        right = QVBoxLayout()
        recent_title = QLabel("Recommended")
        recent_title.setObjectName("SectionTitle")
        right.addWidget(recent_title)

        self.recent_scroll = QScrollArea()
        self.recent_scroll.setWidgetResizable(True)
        self.recent_scroll.setHorizontalScrollBarPolicy(Qt.ScrollBarPolicy.ScrollBarAlwaysOff)
        self.recent_container = QWidget()
        self.recent_layout = QVBoxLayout(self.recent_container)
        self.recent_layout.setContentsMargins(0, 0, 0, 0)
        self.recent_layout.setSpacing(2)
        self.recent_scroll.setWidget(self.recent_container)
        right.addWidget(self.recent_scroll, stretch=1)

        layout.addLayout(right, stretch=2)
        return page

    def _build_all_apps_page(self) -> QWidget:
        page = QWidget()
        layout = QVBoxLayout(page)
        layout.setContentsMargins(0, 0, 0, 0)

        back = QPushButton("← Back")
        back.setObjectName("BackButton")
        back.setCursor(Qt.CursorShape.PointingHandCursor)
        back.clicked.connect(lambda: self._show_page(Page.HOME))
        layout.addWidget(back)

        title = QLabel("All apps")
        title.setObjectName("SectionTitle")
        layout.addWidget(title)

        self.all_apps_scroll = QScrollArea()
        self.all_apps_scroll.setWidgetResizable(True)
        self.all_apps_scroll.setHorizontalScrollBarPolicy(Qt.ScrollBarPolicy.ScrollBarAlwaysOff)
        self.all_apps_container = QWidget()
        self.all_apps_grid = QGridLayout(self.all_apps_container)
        self.all_apps_grid.setContentsMargins(0, 0, 0, 0)
        self.all_apps_grid.setHorizontalSpacing(4)
        self.all_apps_grid.setVerticalSpacing(4)
        self.all_apps_scroll.setWidget(self.all_apps_container)
        layout.addWidget(self.all_apps_scroll, stretch=1)
        return page

    def _build_search_page(self) -> QWidget:
        page = QWidget()
        layout = QVBoxLayout(page)
        layout.setContentsMargins(0, 0, 0, 0)

        title = QLabel("Search results")
        title.setObjectName("SectionTitle")
        layout.addWidget(title)

        self.search_scroll = QScrollArea()
        self.search_scroll.setWidgetResizable(True)
        self.search_scroll.setHorizontalScrollBarPolicy(Qt.ScrollBarPolicy.ScrollBarAlwaysOff)
        self.search_container = QWidget()
        self.search_layout = QVBoxLayout(self.search_container)
        self.search_layout.setContentsMargins(0, 0, 0, 0)
        self.search_layout.setSpacing(2)
        self.search_scroll.setWidget(self.search_container)
        layout.addWidget(self.search_scroll, stretch=1)
        return page

    def _build_settings_page(self) -> QWidget:
        page = QWidget()
        page.setObjectName("SettingsPanel")
        layout = QVBoxLayout(page)
        layout.setContentsMargins(8, 8, 8, 8)
        layout.setSpacing(14)

        header = QHBoxLayout()
        back = QPushButton("← Back")
        back.setObjectName("BackButton")
        back.setCursor(Qt.CursorShape.PointingHandCursor)
        back.clicked.connect(lambda: self._show_page(Page.HOME))
        header.addWidget(back)
        header.addStretch(1)
        layout.addLayout(header)

        title = QLabel("Settings")
        title.setObjectName("SettingsTitle")
        layout.addWidget(title)

        form = QFormLayout()
        form.setSpacing(10)

        self.theme_combo = QComboBox()
        self.theme_combo.addItems(["Dark", "Light"])
        form.addRow(self._settings_label("Theme"), self.theme_combo)

        self.recent_spin = QSpinBox()
        self.recent_spin.setRange(3, 12)
        form.addRow(self._settings_label("Recommended items"), self.recent_spin)

        self.pinned_spin = QSpinBox()
        self.pinned_spin.setRange(6, 24)
        form.addRow(self._settings_label("Max pinned slots"), self.pinned_spin)

        self.win_key_check = QCheckBox("Replace Windows key")
        form.addRow(self.win_key_check)

        self.block_native_check = QCheckBox("Block Windows Start menu (Start button + Win key)")
        form.addRow(self.block_native_check)

        self.startup_check = QCheckBox("Launch at Windows sign-in")
        form.addRow(self.startup_check)

        self.unpin_btn = QPushButton("Unpin all Windows Start menu items")
        self.unpin_btn.setObjectName("PrimaryButton")
        self.unpin_btn.clicked.connect(self._unpin_windows)
        form.addRow(self.unpin_btn)

        layout.addLayout(form)
        layout.addStretch(1)

        save = QPushButton("Save settings")
        save.setObjectName("PrimaryButton")
        save.clicked.connect(self._save_settings)
        layout.addWidget(save)
        return page

    def _settings_label(self, text: str) -> QLabel:
        label = QLabel(text)
        label.setObjectName("SettingsLabel")
        return label

    def apply_settings(self, settings: AppSettings) -> None:
        self.settings = settings
        self.setFixedSize(settings.menu_width, settings.menu_height)
        self.setStyleSheet(theme_stylesheet(settings.theme))
        self.power_button.setVisible(settings.show_power_actions)
        self._load_settings_form()
        self.refresh_content()

    def refresh_content(self) -> None:
        self._all_apps = get_all_apps()
        self._apps_by_path = {app.path: app for app in self._all_apps}
        self._populate_pinned()
        self._populate_recent()
        self._populate_all_apps()

    def _load_settings_form(self) -> None:
        self.theme_combo.setCurrentText(self.settings.theme.capitalize())
        self.recent_spin.setValue(self.settings.max_recent_items)
        self.pinned_spin.setValue(self.settings.max_pinned_items)
        self.win_key_check.setChecked(self.settings.intercept_win_key)
        self.block_native_check.setChecked(self.settings.block_native_start)
        self.startup_check.setChecked(self.settings.launch_at_startup)

    def _clear_layout(self, layout: QGridLayout | QVBoxLayout) -> None:
        while layout.count():
            item = layout.takeAt(0)
            widget = item.widget()
            if widget:
                widget.deleteLater()

    def _populate_pinned(self) -> None:
        self._clear_layout(self.pinned_grid)
        pinned_paths = self.settings.pinned_apps[: self.settings.max_pinned_items]
        pinned_apps = [self._apps_by_path[path] for path in pinned_paths if path in self._apps_by_path]

        if not pinned_apps:
            empty = QLabel("Right-click any app to pin it here.\nClean slate — no clutter.")
            empty.setObjectName("EmptyLabel")
            empty.setWordWrap(True)
            self.pinned_grid.addWidget(empty, 0, 0, 1, 3)
            return

        columns = 3
        for index, app in enumerate(pinned_apps):
            tile = AppTileButton(app)
            tile.clicked.connect(lambda _checked=False, a=app: self._launch(a))
            tile.setContextMenuPolicy(Qt.ContextMenuPolicy.CustomContextMenu)
            tile.customContextMenuRequested.connect(
                lambda pos, a=app, btn=tile: self._show_app_menu(a, btn.mapToGlobal(pos), pinned=True)
            )
            row, col = divmod(index, columns)
            self.pinned_grid.addWidget(tile, row, col)

    def _populate_recent(self) -> None:
        self._clear_layout(self.recent_layout)
        recent = get_recent_items(self.settings.max_recent_items)
        if not recent:
            empty = QLabel("No recent items yet.")
            empty.setObjectName("EmptyLabel")
            self.recent_layout.addWidget(empty)
            return
        for app in recent:
            item = ListItemButton(app)
            item.clicked.connect(lambda _checked=False, a=app: self._launch(a))
            item.setContextMenuPolicy(Qt.ContextMenuPolicy.CustomContextMenu)
            item.customContextMenuRequested.connect(
                lambda pos, a=app, btn=item: self._show_app_menu(a, btn.mapToGlobal(pos), pinned=False)
            )
            self.recent_layout.addWidget(item)
        self.recent_layout.addStretch(1)

    def _populate_all_apps(self) -> None:
        self._clear_layout(self.all_apps_grid)
        columns = 6
        for index, app in enumerate(self._all_apps):
            tile = AppTileButton(app)
            tile.clicked.connect(lambda _checked=False, a=app: self._launch(a))
            tile.setContextMenuPolicy(Qt.ContextMenuPolicy.CustomContextMenu)
            tile.customContextMenuRequested.connect(
                lambda pos, a=app, btn=tile: self._show_app_menu(a, btn.mapToGlobal(pos), pinned=False)
            )
            row, col = divmod(index, columns)
            self.all_apps_grid.addWidget(tile, row, col)

    def _populate_search(self, results: list[AppItem]) -> None:
        self._clear_layout(self.search_layout)
        if not results:
            empty = QLabel("No results found.")
            empty.setObjectName("EmptyLabel")
            self.search_layout.addWidget(empty)
            return
        for app in results[:30]:
            item = ListItemButton(app)
            item.clicked.connect(lambda _checked=False, a=app: self._launch(a))
            self.search_layout.addWidget(item)
        self.search_layout.addStretch(1)

    def _show_app_menu(self, app: AppItem, global_pos, pinned: bool) -> None:
        menu = QMenu(self)
        if pinned or app.path in self.settings.pinned_apps:
            unpin = QAction("Unpin from Start", self)
            unpin.triggered.connect(lambda: self._unpin_app(app))
            menu.addAction(unpin)
        else:
            pin = QAction("Pin to Start", self)
            pin.triggered.connect(lambda: self._pin_app(app))
            menu.addAction(pin)
        menu.exec(global_pos)

    def _pin_app(self, app: AppItem) -> None:
        if app.path not in self.settings.pinned_apps:
            self.settings.pinned_apps.insert(0, app.path)
            self.settings.pinned_apps = self.settings.pinned_apps[: self.settings.max_pinned_items]
            self.settings.save()
            self._populate_pinned()

    def _unpin_app(self, app: AppItem) -> None:
        self.settings.unpin_app(app.path)
        self._populate_pinned()

    def _on_search_changed(self, text: str) -> None:
        if not text.strip():
            if self.stack.currentWidget() == self.search_page:
                self._show_page(Page.HOME)
            return
        self._search_timer.start()

    def _apply_search(self) -> None:
        query = self.search_box.text().strip()
        if not query:
            self._show_page(Page.HOME)
            return
        results = search_apps(query, self._all_apps)
        self._populate_search(results)
        self.stack.setCurrentWidget(self.search_page)

    def _launch_first_search_result(self) -> None:
        query = self.search_box.text().strip()
        if not query:
            return
        results = search_apps(query, self._all_apps)
        if results:
            self._launch(results[0])

    def _show_page(self, page: Page) -> None:
        mapping = {
            Page.HOME: self.home_page,
            Page.ALL_APPS: self.all_apps_page,
            Page.SETTINGS: self.settings_page,
        }
        widget = mapping[page]
        self.stack.setCurrentWidget(widget)
        if page == Page.ALL_APPS:
            self._populate_all_apps()

    def show_at_bottom_center(self) -> None:
        screen = QApplication.primaryScreen()
        if not screen:
            self.show()
            return
        geo = screen.availableGeometry()
        x = geo.x() + (geo.width() - self.width()) // 2
        y = geo.y() + geo.height() - self.height() - 48
        self.move(x, y)
        self.search_box.clear()
        self._show_page(Page.HOME)
        self.refresh_content()
        self.show()
        self.raise_()
        self.activateWindow()
        self.search_box.setFocus()
        enable_blur(self)

    def _launch(self, app: AppItem) -> None:
        launch_app(app)
        self.hide()
        self.closed.emit()

    def _show_power_menu(self) -> None:
        menu = QMenu(self)
        for label, action in (("Sleep", "sleep"), ("Restart", "restart"), ("Shut down", "shutdown")):
            item = QAction(label, self)
            item.triggered.connect(lambda _checked=False, a=action: self._power_action(a))
            menu.addAction(item)
        menu.exec(self.power_button.mapToGlobal(self.power_button.rect().bottomLeft()))

    def _power_action(self, action: str) -> None:
        self.hide()
        self.closed.emit()
        if action == "sleep":
            os.system("rundll32.exe powrprof.dll,SetSuspendState 0,1,0")
        elif action == "restart":
            subprocess.Popen(["shutdown", "/r", "/t", "0"], shell=False)
        elif action == "shutdown":
            subprocess.Popen(["shutdown", "/s", "/t", "0"], shell=False)

    def _unpin_windows(self) -> None:
        from start_menu.windows_start import unpin_windows_start

        unpin_windows_start()
        self.settings.unpin_windows_done = True
        self.settings.save()

    def _save_settings(self) -> None:
        self.settings.theme = self.theme_combo.currentText().lower()
        self.settings.max_recent_items = self.recent_spin.value()
        self.settings.max_pinned_items = self.pinned_spin.value()
        self.settings.intercept_win_key = self.win_key_check.isChecked()
        self.settings.block_native_start = self.block_native_check.isChecked()
        self.settings.launch_at_startup = self.startup_check.isChecked()
        self.settings.save()
        try:
            set_startup_enabled(self.settings.launch_at_startup)
        except RuntimeError:
            pass
        self.apply_settings(self.settings)
        self.settings_changed.emit(self.settings)
        self._show_page(Page.HOME)

    def keyPressEvent(self, event) -> None:  # noqa: N802
        if event.key() == Qt.Key.Key_Escape:
            if self.stack.currentWidget() != self.home_page:
                self._show_page(Page.HOME)
                return
            self.hide()
            self.closed.emit()
            return
        super().keyPressEvent(event)
