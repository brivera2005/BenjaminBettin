from __future__ import annotations

import ctypes
from ctypes import wintypes

from PyQt6.QtCore import QObject, pyqtSignal


WH_KEYBOARD_LL = 13
WM_KEYDOWN = 0x0100
WM_SYSKEYDOWN = 0x0104
WM_KEYUP = 0x0101
WM_SYSKEYUP = 0x0105
VK_LWIN = 0x5B
VK_RWIN = 0x5C
HC_ACTION = 0


class KBDLLHOOKSTRUCT(ctypes.Structure):
    _fields_ = [
        ("vkCode", wintypes.DWORD),
        ("scanCode", wintypes.DWORD),
        ("flags", wintypes.DWORD),
        ("time", wintypes.DWORD),
        ("dwExtraInfo", ctypes.c_ulonglong),
    ]


LowLevelKeyboardProc = ctypes.WINFUNCTYPE(
    ctypes.c_long,
    ctypes.c_int,
    wintypes.WPARAM,
    wintypes.LPARAM,
)


class WinKeyHook(QObject):
    win_pressed = pyqtSignal()

    def __init__(self, parent: QObject | None = None) -> None:
        super().__init__(parent)
        self._enabled = True
        self._hook_id = None
        self._proc = LowLevelKeyboardProc(self._handle_event)
        self._user32 = ctypes.windll.user32
        self._kernel32 = ctypes.windll.kernel32

    def set_enabled(self, enabled: bool) -> None:
        self._enabled = enabled

    def start(self) -> None:
        if self._hook_id:
            return
        module_handle = self._kernel32.GetModuleHandleW(None)
        self._hook_id = self._user32.SetWindowsHookExW(
            WH_KEYBOARD_LL,
            self._proc,
            module_handle,
            0,
        )
        if not self._hook_id:
            raise RuntimeError("Failed to install keyboard hook")

    def stop(self) -> None:
        if self._hook_id:
            self._user32.UnhookWindowsHookEx(self._hook_id)
            self._hook_id = None

    def _handle_event(self, n_code: int, w_param: int, l_param: int) -> int:
        if n_code == HC_ACTION and self._enabled:
            event = ctypes.cast(l_param, ctypes.POINTER(KBDLLHOOKSTRUCT)).contents
            is_down = w_param in (WM_KEYDOWN, WM_SYSKEYDOWN)
            is_up = w_param in (WM_KEYUP, WM_SYSKEYUP)
            if event.vkCode in (VK_LWIN, VK_RWIN):
                if is_down:
                    self.win_pressed.emit()
                    return 1
                if is_up:
                    return 1
        return self._user32.CallNextHookEx(self._hook_id, n_code, w_param, l_param)
