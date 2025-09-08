# MCP Server Launcher for PowerShell
# ==================================

param(
    [string]$Command = "menu",
    [string]$ServerHost = "localhost",
    [int]$Port,
    [switch]$Stdio
)

Write-Host "🤖 MCP Server Launcher for PowerShell" -ForegroundColor Cyan
Write-Host "=" * 40 -ForegroundColor Cyan

# Check Python availability
try {
    $pythonVersion = python --version 2>&1
    Write-Host "✅ Python found: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Python is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install Python 3.8+ and try again" -ForegroundColor Yellow
    exit 1
}

# Change to servers directory
$serversDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $serversDir

# Check dependencies
Write-Host "📦 Checking dependencies..." -ForegroundColor Yellow
try {
    python -c "import fastapi, uvicorn, websockets, psutil, pyperclip, plyer" 2>&1 | Out-Null
    Write-Host "✅ All dependencies OK" -ForegroundColor Green
} catch {
    Write-Host "❌ Missing Python dependencies" -ForegroundColor Red
    Write-Host "Installing dependencies..." -ForegroundColor Yellow

    try {
        pip install -r requirements-mcp.txt
        Write-Host "✅ Dependencies installed successfully" -ForegroundColor Green
    } catch {
        Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
        exit 1
    }
}

function Start-RemoteServer {
    param([string]$ServerHost = "localhost", [int]$PortNumber, [switch]$UseStdio)

    if (-not $PortNumber) {
        # Find free port
        $PortNumber = 3001
        while ($true) {
            try {
                $tcpClient = New-Object System.Net.Sockets.TcpClient
                $tcpClient.Connect($ServerHost, $PortNumber)
                $tcpClient.Close()
                $PortNumber++
            } catch {
                break
            }
        }
    }

    $cmd = @("python", "launch.py", "remote", "--host", $HostName, "--port", $PortNumber.ToString())
    if ($UseStdio) {
        $cmd += "--stdio"
    }

    Write-Host "🚀 Starting Remote MCP Server..." -ForegroundColor Green
    & $cmd[0] $cmd[1..($cmd.Length-1)]
}

function Start-DesktopServer {
    Write-Host "🚀 Starting Desktop MCP Server..." -ForegroundColor Green
    & python launch.py desktop
}

function Start-AllServers {
    param([string]$HostName = "localhost", [int]$PortNumber, [switch]$UseStdio)

    Write-Host "🚀 Starting Both MCP Servers..." -ForegroundColor Green
    & python launch.py all --host $HostName $(if ($PortNumber) { "--port $PortNumber" }) $(if ($UseStdio) { "--stdio" })
}

function Show-Menu {
    Write-Host "Select server to start:" -ForegroundColor Yellow
    Write-Host "1. Remote MCP Server (HTTP/WebSocket)" -ForegroundColor White
    Write-Host "2. Desktop MCP Server (Local)" -ForegroundColor White
    Write-Host "3. Both servers" -ForegroundColor White
    Write-Host "4. Exit" -ForegroundColor White
    Write-Host ""

    $choice = Read-Host "Enter your choice (1-4)"

    switch ($choice) {
        "1" { Start-RemoteServer }
        "2" { Start-DesktopServer }
        "3" { Start-AllServers }
        "4" {
            Write-Host "Goodbye!" -ForegroundColor Cyan
            exit 0
        }
        default {
            Write-Host "❌ Invalid choice. Please try again." -ForegroundColor Red
            Write-Host ""
            Show-Menu
        }
    }
}

# Main execution
switch ($Command.ToLower()) {
    "remote" { Start-RemoteServer -HostName $HostName -PortNumber $Port -UseStdio:$Stdio }
    "desktop" { Start-DesktopServer }
    "all" { Start-AllServers -HostName $HostName -PortNumber $Port -UseStdio:$Stdio }
    "check" {
        Write-Host "✅ Dependency check completed" -ForegroundColor Green
        exit 0
    }
    "menu" { Show-Menu }
    default {
        Write-Host "❌ Invalid command. Use 'remote', 'desktop', 'all', 'check', or 'menu'" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "Press Enter to exit..." -ForegroundColor Gray
Read-Host | Out-Null
