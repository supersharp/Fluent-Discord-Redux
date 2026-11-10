# Capture the Discord window as a PNG so the theme can be checked visually.
#
# Usage:
#   powershell -ExecutionPolicy Bypass -File scripts/discord-debug/capture.ps1
#
# The window is temporarily brought to the front and made topmost so the
# capture is not blocked by other windows. It is returned to normal after the
# capture. Output path is printed to stdout.
#
# Prefer this over PrintWindow: Electron/Chromium GPU surfaces can capture as
# white or torn rectangles through PrintWindow.

$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Drawing
Add-Type @"
using System;
using System.Runtime.InteropServices;
public class DiscordCapture {
    [DllImport("user32.dll")] public static extern bool SetWindowPos(IntPtr hWnd, IntPtr after, int x, int y, int cx, int cy, uint flags);
    [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr hWnd);
    [DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr hWnd, int command);
    [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr hWnd, out RECT rect);
    [StructLayout(LayoutKind.Sequential)] public struct RECT { public int Left, Top, Right, Bottom; }
}
"@

$process = Get-Process Discord | Where-Object { $_.MainWindowHandle -ne 0 } | Select-Object -First 1
if (-not $process) { throw "No Discord window found." }

$handle = $process.MainWindowHandle
[DiscordCapture]::ShowWindow($handle, 9) | Out-Null
[DiscordCapture]::SetWindowPos($handle, [IntPtr]::new(-1), 0, 0, 0, 0, 0x0001 -bor 0x0002 -bor 0x0040) | Out-Null
[DiscordCapture]::SetForegroundWindow($handle) | Out-Null
Start-Sleep -Milliseconds 900

$rect = New-Object DiscordCapture+RECT
[DiscordCapture]::GetWindowRect($handle, [ref]$rect) | Out-Null
$width = $rect.Right - $rect.Left
$height = $rect.Bottom - $rect.Top

$bitmap = New-Object System.Drawing.Bitmap $width, $height
$graphics = [System.Drawing.Graphics]::FromImage($bitmap)
$graphics.CopyFromScreen($rect.Left, $rect.Top, 0, 0, (New-Object System.Drawing.Size $width, $height))
$path = Join-Path $env:TEMP "discord-capture.png"
$bitmap.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
$graphics.Dispose()
$bitmap.Dispose()

# Return the window to non-topmost.
[DiscordCapture]::SetWindowPos($handle, [IntPtr]::new(-2), 0, 0, 0, 0, 0x0001 -bor 0x0002) | Out-Null
Write-Output $path
