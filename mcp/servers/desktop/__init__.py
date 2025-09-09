#!/usr/bin/env python3
"""
Desktop MCP Server Package
Provides desktop-specific tools and resources for MCP.
"""

from .server import MCPDesktopServer
from .tools import DesktopToolsManager, FileOperationsTool, SystemInfoTool, ClipboardTool, NotificationTool, ApplicationTool
from .resources import DesktopResourcesManager
from .protocol import MCPProtocolHandler, MCPMessage

__all__ = [
    "MCPDesktopServer",
    "DesktopToolsManager",
    "FileOperationsTool",
    "SystemInfoTool",
    "ClipboardTool",
    "NotificationTool",
    "ApplicationTool",
    "DesktopResourcesManager",
    "MCPProtocolHandler",
    "MCPMessage"
]

__version__ = "1.0.0"
