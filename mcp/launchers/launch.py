#!/usr/bin/env python3
"""
MCP Server Launcher
==================

Convenient script to launch MCP servers with proper configuration.
Supports both remote and desktop servers with environment detection.
"""

import argparse
import os
import sys
import subprocess
import platform
from pathlib import Path

def check_dependencies():
    """Check if required dependencies are installed"""
    required_packages = [
        'fastapi', 'uvicorn', 'websockets', 'psutil', 'pyperclip', 'plyer'
    ]

    missing = []
    for package in required_packages:
        try:
            __import__(package.replace('-', '_'))
        except ImportError:
            missing.append(package)

    if missing:
        print(f"❌ Missing dependencies: {', '.join(missing)}")
        print("Install with: pip install -r servers/requirements-mcp.txt")
        return False

    print("✅ All dependencies installed")
    return True

def find_free_port(start_port=3001, max_attempts=10):
    """Find a free port starting from start_port"""
    import socket

    for port in range(start_port, start_port + max_attempts):
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                s.bind(('', port))
                return port
        except OSError:
            continue

    raise RuntimeError(f"No free ports found in range {start_port}-{start_port + max_attempts}")

def start_remote_server(host='localhost', port=None, stdio=False):
    """Start the remote MCP server"""
    if port is None:
        port = find_free_port()

    # Use authoritative servers directory at repo root
    root = Path(__file__).resolve().parents[2]
    server_path = root / 'servers' / 'server.py'

    if not server_path.exists():
        print(f"❌ Remote server not found: {server_path}")
        return False

    cmd = [sys.executable, str(server_path)]

    if stdio:
        cmd.append('--stdio')
        print(f"🚀 Starting remote server in STDIO mode...")
    else:
        cmd.extend(['--host', host, '--port', str(port)])
        print(f"🚀 Starting remote server on {host}:{port}...")

    try:
        if stdio:
            # For STDIO mode, run and wait
            result = subprocess.run(cmd, cwd=Path(__file__).parent)
            return result.returncode == 0
        else:
            # For server mode, run in background
            process = subprocess.Popen(cmd, cwd=Path(__file__).parent)
            print(f"✅ Remote server started (PID: {process.pid})")
            print(f"🌐 Server URL: http://{host}:{port}")
            print(f"🔧 Health check: http://{host}:{port}/health")
            return True

    except Exception as e:
        print(f"❌ Failed to start remote server: {e}")
        return False

def start_desktop_server():
    """Start the desktop MCP server"""
    # Use authoritative servers directory at repo root
    root = Path(__file__).resolve().parents[2]
    server_path = root / 'servers' / 'desktop_server.py'

    if not server_path.exists():
        print(f"❌ Desktop server not found: {server_path}")
        return False

    print("🚀 Starting desktop server...")

    try:
        # Desktop server runs in STDIO mode
        result = subprocess.run([sys.executable, str(server_path)],
                              cwd=Path(__file__).parent)
        return result.returncode == 0

    except Exception as e:
        print(f"❌ Failed to start desktop server: {e}")
        return False

def main():
    parser = argparse.ArgumentParser(
        description="MCP Server Launcher",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Start remote server with auto port
  python launch.py remote

  # Start remote server on specific port
  python launch.py remote --port 8080

  # Start remote server in STDIO mode
  python launch.py remote --stdio

  # Start desktop server
  python launch.py desktop

  # Start both servers
  python launch.py all

  # Check dependencies
  python launch.py check
        """
    )

    parser.add_argument(
        'command',
        choices=['remote', 'desktop', 'all', 'check'],
        help='Server to start or command to run'
    )

    parser.add_argument(
        '--host',
        default='localhost',
        help='Host for remote server (default: localhost)'
    )

    parser.add_argument(
        '--port',
        type=int,
        help='Port for remote server (auto-assigned if not specified)'
    )

    parser.add_argument(
        '--stdio',
        action='store_true',
        help='Run remote server in STDIO mode'
    )

    args = parser.parse_args()

    print("🤖 MCP Server Launcher")
    print("=" * 30)

    # Check dependencies first
    if not check_dependencies():
        sys.exit(1)

    success = True

    if args.command == 'check':
        print("✅ Dependency check completed")
        return

    elif args.command == 'remote':
        success = start_remote_server(args.host, args.port, args.stdio)

    elif args.command == 'desktop':
        success = start_desktop_server()

    elif args.command == 'all':
        print("Starting both servers...")
        remote_success = start_remote_server(args.host, args.port, args.stdio)

        if not args.stdio:  # Don't start desktop if remote is in STDIO mode
            print()  # Add spacing
            desktop_success = start_desktop_server()
            success = remote_success and desktop_success
        else:
            success = remote_success

    if success:
        print("\n✅ MCP servers started successfully!")
        if not args.stdio:
            print("\n📋 Next steps:")
            print("1. Open your MCP client application")
            print("2. Connect to the server endpoints shown above")
            print("3. Start using MCP tools!")
    else:
        print("\n❌ Failed to start one or more servers")
        sys.exit(1)

if __name__ == "__main__":
    main()
