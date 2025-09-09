#!/usr/bin/env python3
"""
Desktop Server Tools
Implementation of desktop-specific tools for file operations, system info, etc.
"""

import json
import logging
import os
import platform
import subprocess
from typing import Any, Dict, List, Optional
from pathlib import Path

import psutil
import pyperclip
import plyer

logger = logging.getLogger(__name__)


class MCPTool:
    """Base class for MCP tools."""

    def __init__(self, name: str, description: str, parameters: Dict[str, Any]):
        self.name = name
        self.description = description
        self.parameters = parameters

    async def execute(self, **kwargs) -> Any:
        raise NotImplementedError("Tool execution not implemented")


class FileOperationsTool(MCPTool):
    """Tool for file system operations."""

    def __init__(self):
        schema = {
            "type": "object",
            "properties": {
                "operation": {
                    "type": "string",
                    "enum": ["read", "write", "list", "delete", "move", "copy"],
                    "description": "Operation to perform"
                },
                "path": {"type": "string", "description": "File or directory path"},
                "content": {"type": "string", "description": "Content for write operations"},
                "destination": {"type": "string", "description": "Destination path for move/copy"}
            },
            "required": ["operation", "path"]
        }
        super().__init__("file_operations", "Perform file operations (read, write, list, delete)", schema)

    async def execute(self, operation: str, path: str, **kwargs) -> Any:
        path_obj = Path(path).expanduser()

        if operation == "read":
            if path_obj.is_file():
                return {"content": path_obj.read_text(encoding='utf-8')}
            else:
                raise Exception(f"Path is not a file: {path}")

        elif operation == "write":
            content = kwargs.get("content", "")
            path_obj.parent.mkdir(parents=True, exist_ok=True)
            path_obj.write_text(content, encoding='utf-8')
            return {"success": True, "message": f"Written to {path}"}

        elif operation == "list":
            if path_obj.is_dir():
                items = []
                for item in path_obj.iterdir():
                    items.append({
                        "name": item.name,
                        "type": "directory" if item.is_dir() else "file",
                        "size": item.stat().st_size if item.is_file() else 0,
                        "modified": item.stat().st_mtime
                    })
                return {"items": items}
            else:
                raise Exception(f"Path is not a directory: {path}")

        elif operation == "delete":
            if path_obj.exists():
                if path_obj.is_file():
                    path_obj.unlink()
                else:
                    import shutil
                    shutil.rmtree(path_obj)
                return {"success": True, "message": f"Deleted {path}"}
            else:
                raise Exception(f"Path does not exist: {path}")

        elif operation == "move":
            destination = Path(kwargs.get("destination", "")).expanduser()
            path_obj.rename(destination)
            return {"success": True, "message": f"Moved to {destination}"}

        elif operation == "copy":
            destination = Path(kwargs.get("destination", "")).expanduser()
            if path_obj.is_file():
                import shutil
                shutil.copy2(path_obj, destination)
            else:
                import shutil
                shutil.copytree(path_obj, destination)
            return {"success": True, "message": f"Copied to {destination}"}

        else:
            raise Exception(f"Unknown operation: {operation}")


class SystemInfoTool(MCPTool):
    """Tool for system information retrieval."""

    def __init__(self):
        schema = {
            "type": "object",
            "properties": {
                "category": {
                    "type": "string",
                    "enum": ["basic", "cpu", "memory", "disk", "network"],
                    "description": "Category of system information"
                }
            },
            "required": ["category"]
        }
        super().__init__("system_info", "Get system information and statistics", schema)

    async def execute(self, category: str) -> Dict[str, Any]:
        if category == "basic":
            return {
                "platform": platform.platform(),
                "processor": platform.processor(),
                "architecture": platform.architecture(),
                "python_version": platform.python_version(),
                "hostname": platform.node()
            }

        elif category == "cpu":
            return {
                "physical_cores": psutil.cpu_count(logical=False),
                "logical_cores": psutil.cpu_count(logical=True),
                "cpu_percent": psutil.cpu_percent(interval=1),
                "cpu_freq": psutil.cpu_freq()._asdict() if psutil.cpu_freq() else None
            }

        elif category == "memory":
            mem = psutil.virtual_memory()
            return {
                "total": mem.total,
                "available": mem.available,
                "percent": mem.percent,
                "used": mem.used
            }

        elif category == "disk":
            disks = []
            for partition in psutil.disk_partitions():
                try:
                    usage = psutil.disk_usage(partition.mountpoint)
                    disks.append({
                        "device": partition.device,
                        "mountpoint": partition.mountpoint,
                        "fstype": partition.fstype,
                        "total": usage.total,
                        "used": usage.used,
                        "free": usage.free,
                        "percent": usage.percent
                    })
                except:
                    pass
            return {"disks": disks}

        elif category == "network":
            net = psutil.net_io_counters()
            return {
                "bytes_sent": net.bytes_sent,
                "bytes_recv": net.bytes_recv,
                "packets_sent": net.packets_sent,
                "packets_recv": net.packets_recv
            }

        else:
            raise Exception(f"Unknown category: {category}")


class ClipboardTool(MCPTool):
    """Tool for clipboard operations."""

    def __init__(self):
        schema = {
            "type": "object",
            "properties": {
                "operation": {
                    "type": "string",
                    "enum": ["get", "set"],
                    "description": "Operation to perform"
                },
                "content": {"type": "string", "description": "Content for set operations"}
            },
            "required": ["operation"]
        }
        super().__init__("clipboard", "Interact with system clipboard", schema)

    async def execute(self, operation: str, **kwargs) -> Any:
        if operation == "get":
            try:
                content = pyperclip.paste()
                return {"content": content}
            except Exception as e:
                raise Exception(f"Failed to read clipboard: {str(e)}")

        elif operation == "set":
            content = kwargs.get("content", "")
            try:
                pyperclip.copy(content)
                return {"success": True, "message": "Content copied to clipboard"}
            except Exception as e:
                raise Exception(f"Failed to set clipboard: {str(e)}")

        else:
            raise Exception(f"Unknown operation: {operation}")


class NotificationTool(MCPTool):
    """Tool for desktop notifications."""

    def __init__(self):
        schema = {
            "type": "object",
            "properties": {
                "title": {"type": "string", "description": "Notification title"},
                "message": {"type": "string", "description": "Notification message"},
                "timeout": {"type": "integer", "description": "Timeout in seconds", "default": 5}
            },
            "required": ["title", "message"]
        }
        super().__init__("notification", "Send desktop notifications", schema)

    async def execute(self, title: str, message: str, timeout: int = 5) -> Dict[str, Any]:
        try:
            plyer.notification.notify(
                title=title,
                message=message,
                timeout=timeout
            )
            return {"success": True, "message": "Notification sent"}
        except Exception as e:
            raise Exception(f"Failed to send notification: {str(e)}")


class ApplicationTool(MCPTool):
    """Tool for desktop application management."""

    def __init__(self):
        schema = {
            "type": "object",
            "properties": {
                "operation": {
                    "type": "string",
                    "enum": ["launch", "list_running", "terminate"],
                    "description": "Operation to perform"
                },
                "app_name": {"type": "string", "description": "Application name or path"},
                "pid": {"type": "integer", "description": "Process ID for terminate"}
            },
            "required": ["operation"]
        }
        super().__init__("application", "Launch or interact with desktop applications", schema)

    async def execute(self, operation: str, **kwargs) -> Any:
        if operation == "launch":
            app_name = kwargs.get("app_name", "")
            try:
                if platform.system() == "Windows":
                    subprocess.Popen([app_name], shell=True)
                else:
                    subprocess.Popen([app_name])
                return {"success": True, "message": f"Launched {app_name}"}
            except Exception as e:
                raise Exception(f"Failed to launch application: {str(e)}")

        elif operation == "list_running":
            processes = []
            for proc in psutil.process_iter(['pid', 'name', 'username']):
                try:
                    processes.append({
                        "pid": proc.info['pid'],
                        "name": proc.info['name'],
                        "username": proc.info['username']
                    })
                except:
                    pass
            return {"processes": processes}

        elif operation == "terminate":
            pid = kwargs.get("pid")
            if pid is None:
                raise Exception("PID required for terminate operation")

            try:
                proc = psutil.Process(pid)
                proc.terminate()
                return {"success": True, "message": f"Terminated process {pid}"}
            except Exception as e:
                raise Exception(f"Failed to terminate process: {str(e)}")

        else:
            raise Exception(f"Unknown operation: {operation}")


class DesktopToolsManager:
    """Manager for desktop tools."""

    def __init__(self):
        self.tools: Dict[str, MCPTool] = {}
        self._register_tools()

    def _register_tools(self):
        """Register available desktop tools."""
        tool_classes = {
            "file_operations": FileOperationsTool,
            "system_info": SystemInfoTool,
            "clipboard": ClipboardTool,
            "notification": NotificationTool,
            "application": ApplicationTool
        }

        for tool_name, tool_class in tool_classes.items():
            try:
                self.tools[tool_name] = tool_class()
                logger.info(f"✅ Registered tool: {tool_name}")
            except Exception as e:
                logger.error(f"❌ Failed to register tool {tool_name}: {e}")

    def get_tool(self, name: str) -> Optional[MCPTool]:
        """Get a tool by name."""
        return self.tools.get(name)

    def list_tools(self) -> Dict[str, MCPTool]:
        """List all registered tools."""
        return self.tools.copy()

    def get_tool_info(self) -> List[Dict[str, Any]]:
        """Get information about all tools."""
        return [
            {
                "name": tool.name,
                "description": tool.description,
                "inputSchema": tool.parameters
            }
            for tool in self.tools.values()
        ]
