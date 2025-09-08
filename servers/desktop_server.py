#!/usr/bin/env python3
"""
MCP Desktop Server
=================

A local MCP server that provides desktop-specific tools and resources.
This server runs on the local machine and provides access to local files,
system information, and desktop applications.

Features:
- Local file system access
- System information and monitoring
- Desktop application integration
- Clipboard operations
- Notification system
- STDIO transport for local communication

Usage:
    python desktop_server.py
"""

import asyncio
import json
import logging
import os
import sys
import platform
import psutil
import subprocess
from typing import Any, Dict, List, Optional
from pathlib import Path
import pyperclip  # For clipboard operations
import plyer  # For notifications

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stderr),  # Log to stderr for MCP compatibility
        logging.FileHandler('desktop_server.log')
    ]
)
logger = logging.getLogger(__name__)

# MCP Protocol Constants
MCP_VERSION = "2024-11-05"
JSONRPC_VERSION = "2.0"

class MCPMessage:
    def __init__(self, jsonrpc: str = JSONRPC_VERSION, id: Optional[str] = None,
                 method: Optional[str] = None, params: Optional[Dict[str, Any]] = None,
                 result: Optional[Any] = None, error: Optional[Dict[str, Any]] = None):
        self.jsonrpc = jsonrpc
        self.id = id
        self.method = method
        self.params = params
        self.result = result
        self.error = error

    def to_dict(self) -> Dict[str, Any]:
        data = {"jsonrpc": self.jsonrpc}
        if self.id is not None:
            data["id"] = self.id
        if self.method is not None:
            data["method"] = self.method
        if self.params is not None:
            data["params"] = self.params
        if self.result is not None:
            data["result"] = self.result
        if self.error is not None:
            data["error"] = self.error
        return data

    def json(self) -> str:
        return json.dumps(self.to_dict())

class MCPTool:
    def __init__(self, name: str, description: str, parameters: Dict[str, Any]):
        self.name = name
        self.description = description
        self.parameters = parameters

    async def execute(self, **kwargs) -> Any:
        raise NotImplementedError("Tool execution not implemented")

class FileOperationsTool(MCPTool):
    def __init__(self):
        super().__init__(
            "file_operations",
            "Perform file operations (read, write, list, delete)",
            {
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
        )

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
    def __init__(self):
        super().__init__(
            "system_info",
            "Get system information and statistics",
            {
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
        )

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
    def __init__(self):
        super().__init__(
            "clipboard",
            "Interact with system clipboard",
            {
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
        )

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
    def __init__(self):
        super().__init__(
            "notification",
            "Send desktop notifications",
            {
                "type": "object",
                "properties": {
                    "title": {"type": "string", "description": "Notification title"},
                    "message": {"type": "string", "description": "Notification message"},
                    "timeout": {"type": "integer", "description": "Timeout in seconds", "default": 5}
                },
                "required": ["title", "message"]
            }
        )

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
    def __init__(self):
        super().__init__(
            "application",
            "Launch or interact with desktop applications",
            {
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
        )

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

class MCPDesktopServer:
    def __init__(self):
        self.tools: Dict[str, MCPTool] = {}
        self.resources: Dict[str, Dict[str, Any]] = {}
        self._register_tools()
        self._register_resources()

    def _register_tools(self):
        """Register available desktop tools"""
        self.tools["file_operations"] = FileOperationsTool()
        self.tools["system_info"] = SystemInfoTool()
        self.tools["clipboard"] = ClipboardTool()
        self.tools["notification"] = NotificationTool()
        self.tools["application"] = ApplicationTool()

    def _register_resources(self):
        """Register available resources"""
        # System information as resources
        self.resources["system://info"] = {
            "name": "System Information",
            "description": "Current system information",
            "mimeType": "application/json",
            "content": json.dumps({
                "platform": platform.platform(),
                "hostname": platform.node(),
                "python_version": platform.python_version()
            })
        }

        # Desktop directory as resource
        desktop_path = os.path.expanduser("~/Desktop")
        self.resources["file://desktop"] = {
            "name": "Desktop Directory",
            "description": "Contents of desktop directory",
            "mimeType": "application/json",
            "content": json.dumps({"path": desktop_path})
        }

    def get_capabilities(self) -> Dict[str, Any]:
        """Get server capabilities"""
        return {
            "tools": {
                "list": True,
                "call": True
            },
            "resources": {
                "list": True,
                "read": True
            },
            "prompts": {
                "list": True,
                "get": True
            }
        }

    async def handle_initialize(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Handle initialization request"""
        logger.info(f"Initializing desktop server with client: {params.get('clientInfo', {})}")

        return {
            "protocolVersion": MCP_VERSION,
            "capabilities": self.get_capabilities(),
            "serverInfo": {
                "name": "LLM Desktop MCP Server",
                "version": "1.0.0"
            }
        }

    async def handle_tools_list(self) -> List[Dict[str, Any]]:
        """Handle tools list request"""
        return [
            {
                "name": tool.name,
                "description": tool.description,
                "inputSchema": tool.parameters
            }
            for tool in self.tools.values()
        ]

    async def handle_tools_call(self, params: Dict[str, Any]) -> Any:
        """Handle tool call request"""
        tool_name = params.get("name")
        tool_args = params.get("arguments", {})

        logger.info(f"Executing tool: {tool_name} with args: {tool_args}")

        if tool_name not in self.tools:
            raise Exception(f"Tool '{tool_name}' not found")

        tool = self.tools[tool_name]
        return await tool.execute(**tool_args)

    async def handle_resources_list(self) -> List[Dict[str, Any]]:
        """Handle resources list request"""
        return [
            {
                "uri": uri,
                "name": resource["name"],
                "description": resource["description"],
                "mimeType": resource["mimeType"]
            }
            for uri, resource in self.resources.items()
        ]

    async def handle_resources_read(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Handle resource read request"""
        uri = params.get("uri")
        if uri not in self.resources:
            raise Exception(f"Resource '{uri}' not found")

        resource = self.resources[uri]
        return {
            "contents": [
                {
                    "uri": uri,
                    "mimeType": resource["mimeType"],
                    "text": resource["content"]
                }
            ]
        }

    async def process_message(self, message: MCPMessage) -> MCPMessage:
        """Process an incoming MCP message"""
        try:
            if message.method == "initialize":
                result = await self.handle_initialize(message.params or {})
            elif message.method == "tools/list":
                result = await self.handle_tools_list()
            elif message.method == "tools/call":
                result = await self.handle_tools_call(message.params or {})
            elif message.method == "resources/list":
                result = await self.handle_resources_list()
            elif message.method == "resources/read":
                result = await self.handle_resources_read(message.params or {})
            else:
                raise Exception(f"Unknown method: {message.method}")

            return MCPMessage(
                jsonrpc=JSONRPC_VERSION,
                id=message.id,
                result=result
            )

        except Exception as e:
            logger.error(f"Error processing message: {e}")
            return MCPMessage(
                jsonrpc=JSONRPC_VERSION,
                id=message.id,
                error={
                    "code": -32000,
                    "message": str(e)
                }
            )

# Global server instance
mcp_server = MCPDesktopServer()

async def handle_stdio():
    """Handle STDIO communication for MCP clients"""
    logger.info("Starting Desktop MCP server in STDIO mode")

    try:
        while True:
            # Read from stdin
            line = await asyncio.get_event_loop().run_in_executor(None, sys.stdin.readline)
            if not line:
                break

            line = line.strip()
            if not line:
                continue

            try:
                message_data = json.loads(line)
                message = MCPMessage(**message_data)

                # Process message
                response = await mcp_server.process_message(message)

                # Write to stdout
                print(response.json(), flush=True)

            except json.JSONDecodeError as e:
                logger.error(f"Invalid JSON received: {e}")
            except Exception as e:
                logger.error(f"Error processing STDIO message: {e}")

    except KeyboardInterrupt:
        logger.info("Desktop server stopped")

def main():
    """Main entry point"""
    logger.info("Starting LLM Desktop MCP Server")
    logger.info("Available tools: file_operations, system_info, clipboard, notification, application")

    # Check for required dependencies
    try:
        import pyperclip
        import plyer
    except ImportError as e:
        logger.error(f"Missing required dependencies: {e}")
        logger.error("Please install with: pip install pyperclip plyer")
        sys.exit(1)

    # Run STDIO server
    asyncio.run(handle_stdio())

if __name__ == "__main__":
    main()
