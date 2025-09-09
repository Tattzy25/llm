#!/usr/bin/env python3
"""
MCP Common Tools
================

Common utility tools for MCP servers.
Provides basic file, network, and system operations.
"""

import os
import json
import shutil
import socket
import requests
import platform
import subprocess
from typing import Dict, List, Optional, Any, Union
from pathlib import Path
from datetime import datetime

from ..core import MCPTool, MCPValidationError


class MCPCommonTools:
    """Common utility tools for MCP servers."""

    @staticmethod
    def get_file_info(file_path: str) -> Dict[str, Any]:
        """Get detailed information about a file."""
        try:
            path = Path(file_path)
            if not path.exists():
                raise MCPValidationError(f"File not found: {file_path}")

            stat = path.stat()
            return {
                "name": path.name,
                "path": str(path.absolute()),
                "size": stat.st_size,
                "modified": datetime.fromtimestamp(stat.st_mtime).isoformat(),
                "created": datetime.fromtimestamp(stat.st_ctime).isoformat(),
                "is_file": path.is_file(),
                "is_dir": path.is_dir(),
                "permissions": oct(stat.st_mode)[-3:]
            }
        except Exception as e:
            raise MCPValidationError(f"Failed to get file info: {str(e)}")

    @staticmethod
    def list_directory(dir_path: str, recursive: bool = False) -> List[Dict[str, Any]]:
        """List contents of a directory."""
        try:
            path = Path(dir_path)
            if not path.exists() or not path.is_dir():
                raise MCPValidationError(f"Directory not found: {dir_path}")

            items = []
            if recursive:
                for item in path.rglob("*"):
                    items.append({
                        "name": item.name,
                        "path": str(item),
                        "is_file": item.is_file(),
                        "is_dir": item.is_dir(),
                        "size": item.stat().st_size if item.is_file() else 0
                    })
            else:
                for item in path.iterdir():
                    items.append({
                        "name": item.name,
                        "path": str(item),
                        "is_file": item.is_file(),
                        "is_dir": item.is_dir(),
                        "size": item.stat().st_size if item.is_file() else 0
                    })

            return items
        except Exception as e:
            raise MCPValidationError(f"Failed to list directory: {str(e)}")

    @staticmethod
    def create_directory(dir_path: str, parents: bool = True) -> bool:
        """Create a new directory."""
        try:
            Path(dir_path).mkdir(parents=parents, exist_ok=True)
            return True
        except Exception as e:
            raise MCPValidationError(f"Failed to create directory: {str(e)}")

    @staticmethod
    def delete_path(path: str, recursive: bool = False) -> bool:
        """Delete a file or directory."""
        try:
            p = Path(path)
            if not p.exists():
                raise MCPValidationError(f"Path not found: {path}")

            if p.is_file():
                p.unlink()
            elif p.is_dir():
                if recursive:
                    shutil.rmtree(p)
                else:
                    p.rmdir()
            return True
        except Exception as e:
            raise MCPValidationError(f"Failed to delete path: {str(e)}")

    @staticmethod
    def copy_path(src: str, dst: str) -> bool:
        """Copy a file or directory."""
        try:
            src_path = Path(src)
            dst_path = Path(dst)

            if not src_path.exists():
                raise MCPValidationError(f"Source path not found: {src}")

            if src_path.is_file():
                shutil.copy2(src_path, dst_path)
            elif src_path.is_dir():
                shutil.copytree(src_path, dst_path)
            return True
        except Exception as e:
            raise MCPValidationError(f"Failed to copy path: {str(e)}")

    @staticmethod
    def move_path(src: str, dst: str) -> bool:
        """Move a file or directory."""
        try:
            src_path = Path(src)
            dst_path = Path(dst)

            if not src_path.exists():
                raise MCPValidationError(f"Source path not found: {src}")

            shutil.move(str(src_path), str(dst_path))
            return True
        except Exception as e:
            raise MCPValidationError(f"Failed to move path: {str(e)}")


class MCPFileTools:
    """File-specific tools for MCP servers."""

    @staticmethod
    def read_file(file_path: str, encoding: str = "utf-8") -> str:
        """Read the contents of a file."""
        try:
            with open(file_path, "r", encoding=encoding) as f:
                return f.read()
        except Exception as e:
            raise MCPValidationError(f"Failed to read file: {str(e)}")

    @staticmethod
    def write_file(file_path: str, content: str, encoding: str = "utf-8") -> bool:
        """Write content to a file."""
        try:
            with open(file_path, "w", encoding=encoding) as f:
                f.write(content)
            return True
        except Exception as e:
            raise MCPValidationError(f"Failed to write file: {str(e)}")

    @staticmethod
    def append_file(file_path: str, content: str, encoding: str = "utf-8") -> bool:
        """Append content to a file."""
        try:
            with open(file_path, "a", encoding=encoding) as f:
                f.write(content)
            return True
        except Exception as e:
            raise MCPValidationError(f"Failed to append to file: {str(e)}")

    @staticmethod
    def search_in_file(file_path: str, pattern: str, case_sensitive: bool = False) -> List[Dict[str, Any]]:
        """Search for a pattern in a file."""
        try:
            import re
            flags = 0 if case_sensitive else re.IGNORECASE
            results = []

            with open(file_path, "r", encoding="utf-8") as f:
                content = f.read()
                lines = content.splitlines()

            for i, line in enumerate(lines, 1):
                if re.search(pattern, line, flags):
                    results.append({
                        "line_number": i,
                        "line_content": line,
                        "file_path": file_path
                    })

            return results
        except Exception as e:
            raise MCPValidationError(f"Failed to search file: {str(e)}")


class MCPNetworkTools:
    """Network-related tools for MCP servers."""

    @staticmethod
    def get_network_info() -> Dict[str, Any]:
        """Get network interface information."""
        try:
            hostname = socket.gethostname()
            ip_address = socket.gethostbyname(hostname)

            return {
                "hostname": hostname,
                "ip_address": ip_address,
                "platform": platform.system(),
                "network_interfaces": socket.getaddrinfo(hostname, None)
            }
        except Exception as e:
            raise MCPValidationError(f"Failed to get network info: {str(e)}")

    @staticmethod
    def test_connectivity(host: str, port: int = 80, timeout: int = 5) -> Dict[str, Any]:
        """Test connectivity to a host and port."""
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(timeout)
            result = sock.connect_ex((host, port))
            sock.close()

            return {
                "host": host,
                "port": port,
                "connected": result == 0,
                "error_code": result if result != 0 else None
            }
        except Exception as e:
            raise MCPValidationError(f"Failed to test connectivity: {str(e)}")

    @staticmethod
    def http_request(url: str, method: str = "GET", headers: Optional[Dict[str, str]] = None,
                    data: Optional[Dict[str, Any]] = None, timeout: int = 10) -> Dict[str, Any]:
        """Make an HTTP request."""
        try:
            if method.upper() == "GET":
                response = requests.get(url, headers=headers, timeout=timeout)
            elif method.upper() == "POST":
                response = requests.post(url, headers=headers, json=data, timeout=timeout)
            else:
                raise MCPValidationError(f"Unsupported HTTP method: {method}")

            return {
                "status_code": response.status_code,
                "headers": dict(response.headers),
                "content": response.text,
                "url": response.url,
                "elapsed": response.elapsed.total_seconds()
            }
        except Exception as e:
            raise MCPValidationError(f"HTTP request failed: {str(e)}")


class MCPSystemTools:
    """System-related tools for MCP servers."""

    @staticmethod
    def get_system_info() -> Dict[str, Any]:
        """Get system information."""
        try:
            return {
                "platform": platform.system(),
                "platform_version": platform.version(),
                "architecture": platform.machine(),
                "processor": platform.processor(),
                "python_version": platform.python_version(),
                "cpu_count": os.cpu_count(),
                "memory_info": {
                    "total": os.sysconf('SC_PAGE_SIZE') * os.sysconf('SC_PHYS_PAGES') if hasattr(os, 'sysconf') else None,
                    "available": None  # Would need psutil for this
                }
            }
        except Exception as e:
            raise MCPValidationError(f"Failed to get system info: {str(e)}")

    @staticmethod
    def run_command(command: str, cwd: Optional[str] = None, timeout: int = 30) -> Dict[str, Any]:
        """Run a system command."""
        try:
            result = subprocess.run(
                command,
                shell=True,
                cwd=cwd,
                capture_output=True,
                text=True,
                timeout=timeout
            )

            return {
                "command": command,
                "return_code": result.returncode,
                "stdout": result.stdout,
                "stderr": result.stderr,
                "success": result.returncode == 0
            }
        except subprocess.TimeoutExpired:
            raise MCPValidationError(f"Command timed out after {timeout} seconds")
        except Exception as e:
            raise MCPValidationError(f"Failed to run command: {str(e)}")

    @staticmethod
    def get_environment_variables() -> Dict[str, str]:
        """Get environment variables."""
        try:
            return dict(os.environ)
        except Exception as e:
            raise MCPValidationError(f"Failed to get environment variables: {str(e)}")

    @staticmethod
    def set_environment_variable(key: str, value: str) -> bool:
        """Set an environment variable."""
        try:
            os.environ[key] = value
            return True
        except Exception as e:
            raise MCPValidationError(f"Failed to set environment variable: {str(e)}")
