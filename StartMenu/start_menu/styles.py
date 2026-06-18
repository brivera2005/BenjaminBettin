from __future__ import annotations

BASE_DARK = """
* {
    font-family: "Segoe UI Variable", "Segoe UI", sans-serif;
}

QWidget#StartMenuRoot {
    background-color: rgba(28, 28, 28, 248);
    border: 1px solid rgba(255, 255, 255, 0.10);
    border-radius: 14px;
}

QLineEdit#SearchBox {
    background-color: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-bottom: 2px solid rgba(255, 255, 255, 0.18);
    border-radius: 6px;
    color: #ffffff;
    font-size: 14px;
    padding: 10px 14px;
}

QLineEdit#SearchBox:focus {
    border-bottom: 2px solid #0078d4;
    background-color: rgba(255, 255, 255, 0.09);
}

QLabel#SectionTitle {
    color: rgba(255, 255, 255, 0.92);
    font-size: 13px;
    font-weight: 600;
}

QLabel#UserLabel {
    color: rgba(255, 255, 255, 0.85);
    font-size: 12px;
}

QLabel#EmptyLabel {
    color: rgba(255, 255, 255, 0.45);
    font-size: 12px;
}

QPushButton#AppTile {
    background-color: transparent;
    border: none;
    border-radius: 8px;
    color: #ffffff;
    font-size: 11px;
    padding: 8px 4px;
    text-align: center;
}

QPushButton#AppTile:hover {
    background-color: rgba(255, 255, 255, 0.08);
}

QPushButton#AppTile:pressed {
    background-color: rgba(255, 255, 255, 0.12);
}

QPushButton#ListItem {
    background-color: transparent;
    border: none;
    border-radius: 8px;
    color: #ffffff;
    font-size: 13px;
    padding: 8px 10px;
    text-align: left;
}

QPushButton#ListItem:hover {
    background-color: rgba(255, 255, 255, 0.08);
}

QPushButton#FooterButton {
    background-color: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 8px;
    color: #ffffff;
    font-size: 12px;
    min-height: 34px;
    padding: 6px 14px;
}

QPushButton#FooterButton:hover {
    background-color: rgba(255, 255, 255, 0.12);
}

QPushButton#TextLink {
    background: transparent;
    border: none;
    color: #60a5fa;
    font-size: 12px;
    padding: 4px 0;
    text-align: left;
}

QPushButton#TextLink:hover {
    color: #93c5fd;
}

QPushButton#BackButton {
    background: transparent;
    border: none;
    color: rgba(255, 255, 255, 0.85);
    font-size: 13px;
    padding: 6px 8px;
    text-align: left;
}

QPushButton#BackButton:hover {
    background-color: rgba(255, 255, 255, 0.08);
    border-radius: 6px;
}

QScrollArea {
    background: transparent;
    border: none;
}

QScrollBar:vertical {
    background: transparent;
    width: 8px;
}

QScrollBar::handle:vertical {
    background: rgba(255, 255, 255, 0.18);
    border-radius: 4px;
    min-height: 24px;
}

QScrollBar::add-line:vertical, QScrollBar::sub-line:vertical {
    height: 0;
}

QWidget#Divider {
    background-color: rgba(255, 255, 255, 0.08);
    max-width: 1px;
}

QWidget#SettingsPanel {
    background-color: rgba(24, 24, 24, 250);
}

QLabel#SettingsTitle {
    color: #ffffff;
    font-size: 18px;
    font-weight: 600;
}

QLabel#SettingsLabel {
    color: rgba(255, 255, 255, 0.85);
    font-size: 13px;
}

QComboBox, QSpinBox {
    background-color: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 6px;
    color: #ffffff;
    padding: 6px 8px;
}

QCheckBox {
    color: rgba(255, 255, 255, 0.85);
    font-size: 13px;
}

QCheckBox::indicator {
    width: 16px;
    height: 16px;
    border-radius: 4px;
    border: 1px solid rgba(255, 255, 255, 0.25);
    background: rgba(255, 255, 255, 0.04);
}

QCheckBox::indicator:checked {
    background: #0078d4;
    border-color: #0078d4;
}

QPushButton#PrimaryButton {
    background-color: #0078d4;
    border: none;
    border-radius: 6px;
    color: #ffffff;
    font-size: 13px;
    padding: 8px 16px;
}

QPushButton#PrimaryButton:hover {
    background-color: #1084d8;
}

QMenu {
    background-color: rgba(32, 32, 32, 250);
    border: 1px solid rgba(255, 255, 255, 0.10);
    border-radius: 8px;
    color: #ffffff;
    padding: 4px;
}

QMenu::item {
    padding: 8px 24px 8px 12px;
    border-radius: 4px;
}

QMenu::item:selected {
    background-color: rgba(255, 255, 255, 0.10);
}
"""

BASE_LIGHT = """
* {
    font-family: "Segoe UI Variable", "Segoe UI", sans-serif;
}

QWidget#StartMenuRoot {
    background-color: rgba(245, 245, 245, 252);
    border: 1px solid rgba(0, 0, 0, 0.08);
    border-radius: 14px;
}

QLineEdit#SearchBox {
    background-color: #ffffff;
    border: 1px solid rgba(0, 0, 0, 0.08);
    border-bottom: 2px solid rgba(0, 0, 0, 0.18);
    border-radius: 6px;
    color: #1a1a1a;
    font-size: 14px;
    padding: 10px 14px;
}

QLineEdit#SearchBox:focus {
    border-bottom: 2px solid #0078d4;
}

QLabel#SectionTitle {
    color: rgba(0, 0, 0, 0.88);
    font-size: 13px;
    font-weight: 600;
}

QLabel#UserLabel {
    color: rgba(0, 0, 0, 0.75);
    font-size: 12px;
}

QLabel#EmptyLabel {
    color: rgba(0, 0, 0, 0.45);
    font-size: 12px;
}

QPushButton#AppTile {
    background-color: transparent;
    border: none;
    border-radius: 8px;
    color: #1a1a1a;
    font-size: 11px;
    padding: 8px 4px;
}

QPushButton#AppTile:hover {
    background-color: rgba(0, 0, 0, 0.05);
}

QPushButton#ListItem {
    background-color: transparent;
    border: none;
    border-radius: 8px;
    color: #1a1a1a;
    font-size: 13px;
    padding: 8px 10px;
    text-align: left;
}

QPushButton#ListItem:hover {
    background-color: rgba(0, 0, 0, 0.05);
}

QPushButton#FooterButton {
    background-color: rgba(0, 0, 0, 0.04);
    border: 1px solid rgba(0, 0, 0, 0.08);
    border-radius: 8px;
    color: #1a1a1a;
    font-size: 12px;
    min-height: 34px;
    padding: 6px 14px;
}

QPushButton#FooterButton:hover {
    background-color: rgba(0, 0, 0, 0.08);
}

QPushButton#TextLink {
    background: transparent;
    border: none;
    color: #0067c0;
    font-size: 12px;
    padding: 4px 0;
}

QPushButton#BackButton {
    background: transparent;
    border: none;
    color: rgba(0, 0, 0, 0.85);
    font-size: 13px;
    padding: 6px 8px;
}

QPushButton#BackButton:hover {
    background-color: rgba(0, 0, 0, 0.05);
    border-radius: 6px;
}

QScrollArea {
    background: transparent;
    border: none;
}

QScrollBar:vertical {
    background: transparent;
    width: 8px;
}

QScrollBar::handle:vertical {
    background: rgba(0, 0, 0, 0.18);
    border-radius: 4px;
}

QWidget#Divider {
    background-color: rgba(0, 0, 0, 0.08);
    max-width: 1px;
}

QWidget#SettingsPanel {
    background-color: rgba(255, 255, 255, 250);
}

QLabel#SettingsTitle {
    color: #1a1a1a;
    font-size: 18px;
    font-weight: 600;
}

QLabel#SettingsLabel {
    color: rgba(0, 0, 0, 0.85);
    font-size: 13px;
}

QComboBox, QSpinBox {
    background-color: #ffffff;
    border: 1px solid rgba(0, 0, 0, 0.12);
    border-radius: 6px;
    color: #1a1a1a;
    padding: 6px 8px;
}

QCheckBox {
    color: rgba(0, 0, 0, 0.85);
    font-size: 13px;
}

QCheckBox::indicator {
    width: 16px;
    height: 16px;
    border-radius: 4px;
    border: 1px solid rgba(0, 0, 0, 0.25);
    background: #ffffff;
}

QCheckBox::indicator:checked {
    background: #0078d4;
    border-color: #0078d4;
}

QPushButton#PrimaryButton {
    background-color: #0078d4;
    border: none;
    border-radius: 6px;
    color: #ffffff;
    font-size: 13px;
    padding: 8px 16px;
}

QMenu {
    background-color: #ffffff;
    border: 1px solid rgba(0, 0, 0, 0.10);
    border-radius: 8px;
    color: #1a1a1a;
    padding: 4px;
}

QMenu::item:selected {
    background-color: rgba(0, 0, 0, 0.06);
}
"""


def theme_stylesheet(theme: str) -> str:
    return BASE_LIGHT if theme == "light" else BASE_DARK
