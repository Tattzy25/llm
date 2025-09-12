#!/usr/bin/env pwsh
# Python Environment Setup Script
# This script sets up the Python virtual environment for MCP servers

Write-Host "🐍 Setting up Python environment for MCP servers..." -ForegroundColor Green

# Check if Python is available
try {
    $pythonVersion = python --version 2>&1
    Write-Host "✅ Python found: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Python is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install Python 3.8+ and try again" -ForegroundColor Yellow
    exit 1
}

# Create virtual environment in project root (not in llm/venv)
Write-Host "📦 Creating virtual environment..." -ForegroundColor Blue
python -m venv .venv

# Activate virtual environment
Write-Host "🔧 Activating virtual environment..." -ForegroundColor Blue
if ($IsWindows -or $env:OS -eq "Windows_NT") {
    & ".venv\Scripts\Activate.ps1"
} else {
    & ".venv/bin/activate"
}

# Install MCP requirements
Write-Host "📥 Installing MCP server dependencies..." -ForegroundColor Blue
pip install --upgrade pip
pip install -r mcp/requirements-mcp.txt

Write-Host "✅ Python environment setup complete!" -ForegroundColor Green
Write-Host "To activate the environment manually, run:" -ForegroundColor Yellow
if ($IsWindows -or $env:OS -eq "Windows_NT") {
    Write-Host "  .venv\Scripts\Activate.ps1" -ForegroundColor Cyan
} else {
    Write-Host "  source .venv/bin/activate" -ForegroundColor Cyan
}