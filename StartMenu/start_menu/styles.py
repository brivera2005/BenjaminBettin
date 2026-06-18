from __future__ import annotations

DARK_THEME = """
QWidget#StartMenuRoot {
    background-color: rgba(32, 32, 32, 245);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 12px;
}

QLabel#TitleLabel {
    color: #ffffff;
    font-size: 15px;
    font-weight: 600;
}

QLabel#SubtitleLabel {
    color: rgba(255, 255, 255, 0.55);
    font-size: 12px;
}

QLabel#EmptyLabel {
    color: rgba(255, 255, 255, 0.45);
    font-size: 13px;
}

QPushButton#RecentButton {
    background-color: transparent;
    border: none;
    border-radius: 8px;
    color: #ffffff;
    font-size: 13px;
    padding: 8px 10px;
    text-align: left;
}

QPushButton#RecentButton:hover {
    background-color: rgba(255, 255, 255, 0.08);
}

QPushButton#RecentButton:pressed {
    background-color: rgba(255, 255, 255, 0.12);
}

QPushButton#IconButton {
    background-color: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 8px;
    color: #ffffff;
    font-size: 12px;
    padding: 8px 14px;
}

QPushButton#IconButton:hover {
    background-color: rgba(255, 255, 255, 0.12);
}

QPushButton#PowerButton {
    background-color: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 8px;
    color: #ffffff;
    font-size: 12px;
    min-width: 72px;
    padding: 8px 12px;
}

QPushButton#PowerButton:hover {
    background-color: rgba(255, 255, 255, 0.12);
}

QScrollArea {
    background: transparent;
    border: none;
}

QScrollBar:vertical {
    background: transparent;
    width: 8px;
    margin: 0;
}

QScrollBar::handle:vertical {
    background: rgba(255, 255, 255, 0.18);
    border-radius: 4px;
    min-height: 24px;
}

QScrollBar::add-line:vertical, QScrollBar::sub-line:vertical {
    height: 0;
}

QWidget#SettingsRoot {
    background-color: rgba(32, 32, 32, 250);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 12px;
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

QPushButton#SecondaryButton {
    background-color: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 6px;
    color: #ffffff;
    font-size: 13px;
    padding: 8px 16px;
}

QPushButton#SecondaryButton:hover {
    background-color: rgba(255, 255, 255, 0.12);
}
"""

LIGHT_THEME = """
QWidget#StartMenuRoot {
    background-color: rgba(243, 243, 243, 250);
    border: 1px solid rgba(0, 0, 0, 0.08);
    border-radius: 12px;
}

QLabel#TitleLabel {
    color: #1a1a1a;
    font-size: 15px;
    font-weight: 600;
}

QLabel#SubtitleLabel {
    color: rgba(0, 0, 0, 0.55);
    font-size: 12px;
}

QLabel#EmptyLabel {
    color: rgba(0, 0, 0, 0.45);
    font-size: 13px;
}

QPushButton#RecentButton {
    background-color: transparent;
    border: none;
    border-radius: 8px;
    color: #1a1a1a;
    font-size: 13px;
    padding: 8px 10px;
    text-align: left;
}

QPushButton#RecentButton:hover {
    background-color: rgba(0, 0, 0, 0.05);
}

QPushButton#RecentButton:pressed {
    background-color: rgba(0, 0, 0, 0.08);
}

QPushButton#IconButton {
    background-color: rgba(0, 0, 0, 0.04);
    border: 1px solid rgba(0, 0, 0, 0.08);
    border-radius: 8px;
    color: #1a1a1a;
    font-size: 12px;
    padding: 8px 14px;
}

QPushButton#IconButton:hover {
    background-color: rgba(0, 0, 0, 0.08);
}

QPushButton#PowerButton {
    background-color: rgba(0, 0, 0, 0.04);
    border: 1px solid rgba(0, 0, 0, 0.08);
    border-radius: 8px;
    color: #1a1a1a;
    font-size: 12px;
    min-width: 72px;
    padding: 8px 12px;
}

QPushButton#PowerButton:hover {
    background-color: rgba(0, 0, 0, 0.08);
}

QScrollArea {
    background: transparent;
    border: none;
}

QScrollBar:vertical {
    background: transparent;
    width: 8px;
    margin: 0;
}

QScrollBar::handle:vertical {
    background: rgba(0, 0, 0, 0.18);
    border-radius: 4px;
    min-height: 24px;
}

QScrollBar::add-line:vertical, QScrollBar::sub-line:vertical {
    height: 0;
}

QWidget#SettingsRoot {
    background-color: rgba(255, 255, 255, 250);
    border: 1px solid rgba(0, 0, 0, 0.08);
    border-radius: 12px;
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

QPushButton#PrimaryButton:hover {
    background-color: #1084d8;
}

QPushButton#SecondaryButton {
    background-color: rgba(0, 0, 0, 0.04);
    border: 1px solid rgba(0, 0, 0, 0.12);
    border-radius: 6px;
    color: #1a1a1a;
    font-size: 13px;
    padding: 8px 16px;
}

QPushButton#SecondaryButton:hover {
    background-color: rgba(0, 0, 0, 0.08);
}
"""


def theme_stylesheet(theme: str) -> str:
    return LIGHT_THEME if theme == "light" else DARK_THEME
