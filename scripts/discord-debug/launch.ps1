# Launch Discord with the Chrome DevTools Protocol enabled and print the page
# targets. Run as the same Windows user that owns the Discord profile.
#
# Usage:
#   powershell -ExecutionPolicy Bypass -File scripts/discord-debug/launch.ps1
#
# Notes:
#   * This closes any running Discord processes. Discord restores the session
#     from %APPDATA%\discord on the next start.
#   * The debugger listens on loopback only (127.0.0.1:9222). Never expose it.
#   * Discord's updater can relaunch the app while we are closing it, so wait
#     until every Discord process is gone before starting the debug instance.
#   * The flag must be present on the process command line; Discord silently
#     drops it if another instance wins the single-instance race.

$ErrorActionPreference = "Stop"

$discordRoot = Join-Path $env:LOCALAPPDATA "Discord"
$versionDir = Get-ChildItem $discordRoot -Directory |
    Where-Object { $_.Name -match '^app-\d' } |
    Sort-Object Name -Descending |
    Select-Object -First 1

if (-not $versionDir) {
    throw "No Discord app directory found under $discordRoot"
}

$exe = Join-Path $versionDir.FullName "Discord.exe"

for ($attempt = 0; $attempt -lt 20; $attempt++) {
    Get-Process Discord -ErrorAction SilentlyContinue | Stop-Process -Force
    Start-Sleep -Milliseconds 500
    if (-not (Get-Process Discord -ErrorAction SilentlyContinue)) { break }
}
if (Get-Process Discord -ErrorAction SilentlyContinue) {
    throw "Discord processes did not exit."
}

Start-Process -FilePath $exe -ArgumentList "--remote-debugging-port=9222"
Start-Sleep -Seconds 3

$commandLine = (Get-CimInstance Win32_Process |
    Where-Object { $_.Name -eq "Discord.exe" } |
    Select-Object -First 1).CommandLine
if ($commandLine -notmatch "--remote-debugging-port=9222") {
    throw "Discord started without the debug flag. Close it fully and retry."
}

for ($attempt = 0; $attempt -lt 30; $attempt++) {
    Start-Sleep -Milliseconds 500
    try {
        $response = Invoke-WebRequest -Uri "http://127.0.0.1:9222/json/list" -UseBasicParsing -TimeoutSec 2
        $response.Content
        exit 0
    } catch {
        # Keep waiting until the page target exists.
    }
}

throw "Discord started with the flag but the CDP endpoint did not become ready."
