@echo off
setlocal EnableDelayedExpansion

:: Request admin if needed
net session >nul 2>&1
if errorlevel 1 (
    powershell -NoProfile -Command "Start-Process -FilePath '%~f0' -Verb RunAs"
    exit /b
)

cd /d "%~dp0"

echo.
echo  Black Glass Start Menu
echo  ======================
echo.

set "INSTALLER=%~dp0OpenShellSetup.exe"
set "DOWNLOAD_URL=https://github.com/Open-Shell/Open-Shell-Menu/releases/download/v4.4.198/OpenShellSetup_4_4_198.exe"

if not exist "%INSTALLER%" (
    echo Downloading Open-Shell...
    powershell -NoProfile -Command ^
        "$ProgressPreference='SilentlyContinue'; Invoke-WebRequest -Uri '%DOWNLOAD_URL%' -OutFile '%INSTALLER%'"
    if errorlevel 1 (
        echo Download failed.
        exit /b 1
    )
)

echo Installing Open-Shell...
"%INSTALLER%" /quiet
if errorlevel 1 (
    echo Install failed. Try running as administrator.
    exit /b 1
)

echo Applying Black Glass settings...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0apply-settings.ps1"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0unpin-windows.ps1"

echo Creating shortcuts...
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
    "$w = New-Object -ComObject WScript.Shell; ^
     $targets = @('%USERPROFILE%\Desktop\Black Glass Start.lnk', '%USERPROFILE%\Projects\Black Glass Start.lnk'); ^
     foreach ($t in $targets) { ^
       $d = Split-Path $t -Parent; if (-not (Test-Path $d)) { continue }; ^
       $s = $w.CreateShortcut($t); ^
       $s.TargetPath = '%ProgramFiles%\Open-Shell\StartMenu.exe'; ^
       $s.Arguments = ''; ^
       $s.WorkingDirectory = '%ProgramFiles%\Open-Shell'; ^
       $s.Description = 'Black Glass Start Menu Settings'; ^
       $s.Save() ^
     }"

echo.
echo Done! Press Win or click Start - you should see the Black Glass menu.
echo Top 9 most-used apps appear in a 3x3 grid after installing the fork build.
echo.
echo Restarting Explorer to apply changes...
taskkill /F /IM explorer.exe >nul 2>&1
start explorer.exe
