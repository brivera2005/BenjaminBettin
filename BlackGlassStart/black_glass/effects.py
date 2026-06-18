from __future__ import annotations

import ctypes
from ctypes import wintypes

from PyQt6.QtCore import Qt
from PyQt6.QtWidgets import QWidget


ACCENT_ENABLE_ACRYLICBLURBEHIND = 4
WCA_ACCENT_POLICY = 19


class ACCENT_POLICY(ctypes.Structure):
    _fields_ = [
        ("AccentState", ctypes.c_int),
        ("AccentFlags", ctypes.c_int),
        ("GradientColor", ctypes.c_uint),
        ("AnimationId", ctypes.c_int),
    ]


class WINDOWCOMPOSITIONATTRIBDATA(ctypes.Structure):
    _fields_ = [
        ("Attribute", ctypes.c_int),
        ("Data", ctypes.c_void_p),
        ("SizeOfData", ctypes.c_size_t),
    ]


def apply_popup_window_flags(widget: QWidget) -> None:
    widget.setWindowFlags(
        Qt.WindowType.FramelessWindowHint
        | Qt.WindowType.Popup
        | Qt.WindowType.NoDropShadowWindowHint
    )
    widget.setAttribute(Qt.WidgetAttribute.WA_TranslucentBackground, True)


def enable_acrylic(widget: QWidget, tint_abgr: int = 0xD0101010) -> None:
    try:
        hwnd = int(widget.winId())
        accent = ACCENT_POLICY()
        accent.AccentState = ACCENT_ENABLE_ACRYLICBLURBEHIND
        accent.AccentFlags = 2
        accent.GradientColor = tint_abgr

        data = WINDOWCOMPOSITIONATTRIBDATA()
        data.Attribute = WCA_ACCENT_POLICY
        data.Data = ctypes.cast(ctypes.pointer(accent), ctypes.c_void_p)
        data.SizeOfData = ctypes.sizeof(accent)

        setter = ctypes.windll.user32.SetWindowCompositionAttribute
        setter.argtypes = [wintypes.HWND, ctypes.POINTER(WINDOWCOMPOSITIONATTRIBDATA)]
        setter.restype = wintypes.BOOL
        setter(hwnd, ctypes.byref(data))
    except Exception:
        pass
