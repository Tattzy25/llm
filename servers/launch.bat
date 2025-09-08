@echo off
REM MCP Server Launcher for Windows
REM ================================

echo 🤖 MCP Server Launcher for Windows
echo ===================================

REM Check if Python is available
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python is not installed or not in PATH
    echo Please install Python 3.8+ and try again
    pause
    exit /b 1
)

REM Change to the servers directory
cd /d "%~dp0"

REM Check dependencies
echo Checking dependencies...
python -c "import fastapi, uvicorn, websockets, psutil, pyperclip, plyer" >nul 2>&1
if errorlevel 1 (
    echo ❌ Missing Python dependencies
    echo Installing dependencies...
    pip install -r requirements-mcp.txt
    if errorlevel 1 (
        echo ❌ Failed to install dependencies
        pause
        exit /b 1
    )
)

echo ✅ Dependencies OK
echo.

REM Menu for server selection
:menu
echo Select server to start:
echo 1. Remote MCP Server (HTTP/WebSocket)
echo 2. Desktop MCP Server (Local)
echo 3. Both servers
echo 4. Exit
echo.

set /p choice="Enter your choice (1-4): "

if "%choice%"=="1" (
    echo 🚀 Starting Remote MCP Server...
    python launch.py remote
    goto end
)

if "%choice%"=="2" (
    echo 🚀 Starting Desktop MCP Server...
    python launch.py desktop
    goto end
)

if "%choice%"=="3" (
    echo 🚀 Starting Both MCP Servers...
    python launch.py all
    goto end
)

if "%choice%"=="4" (
    echo Goodbye!
    goto end
)

echo ❌ Invalid choice. Please try again.
echo.
goto menu

:end
echo.
echo Press any key to exit...
pause >nul
