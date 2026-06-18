# Disable Open-Shell so it stops fighting Black Glass Start.
$ErrorActionPreference = "SilentlyContinue"

Get-Process StartMenu, ClassicExplorerSettings -ErrorAction SilentlyContinue | Stop-Process -Force

$settings = "HKCU:\Software\OpenShell\StartMenu\Settings"
if (Test-Path $settings) {
    Set-ItemProperty -Path $settings -Name AutoStart -Value 0 -Type DWord
}

Remove-ItemProperty -Path "HKCU:\Software\Microsoft\Windows\CurrentVersion\Run" -Name SimpleStartMenu -ErrorAction SilentlyContinue

$uninstallKey = Get-ChildItem "HKLM:\Software\Microsoft\Windows\CurrentVersion\Uninstall\*" |
    Get-ItemProperty |
    Where-Object { $_.DisplayName -like "*Open-Shell*" } |
    Select-Object -First 1

if ($uninstallKey.UninstallString) {
    $cmd = $uninstallKey.UninstallString -replace '"', ''
    if ($cmd -match 'msiexec') {
        Start-Process msiexec.exe -ArgumentList "/x `"$($uninstallKey.PSChildName)`" /quiet /norestart" -Wait
    }
}

Write-Host "Open-Shell disabled."
