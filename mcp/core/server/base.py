#!/usr/bin/env python3
"""
MCP Base Server
==============

Base server implementation for MCP servers.
Provides common functionality and transport management.
"""

import asyncio
import logging
from typing import Any, Dict, Optional

from ..protocol.handler import MCPProtocolHandler
from ..transport.stdio import MCPSTDIOTransport, MCPWebSocketTransport, MCPHTTPTransport

logger = logging.getLogger(__name__)


class MCPServerBase:
    """Base class for MCP servers."""

    def __init__(self, name: str = "MCP Server"):
        self.name = name
        self.protocol_handler = MCPProtocolHandler()
        self.transports = {}
        self.running = False

    def register_tool(self, tool) -> None:
        """Register a tool with the server."""
        self.protocol_handler.register_tool(tool)

    def register_resource(self, resource) -> None:
        """Register a resource with the server."""
        self.protocol_handler.register_resource(resource)

    def add_stdio_transport(self) -> None:
        """Add STDIO transport."""
        self.transports["stdio"] = MCPSTDIOTransport(self.protocol_handler)

    def add_websocket_transport(self, host: str = "localhost", port: int = 8000) -> None:
        """Add WebSocket transport."""
        self.transports["websocket"] = MCPWebSocketTransport(
            self.protocol_handler, host, port
        )

    def add_http_transport(self, host: str = "localhost", port: int = 8000) -> None:
        """Add HTTP transport."""
        self.transports["http"] = MCPHTTPTransport(
            self.protocol_handler, host, port
        )

    async def start_stdio(self) -> None:
        """Start server with STDIO transport."""
        if "stdio" not in self.transports:
            self.add_stdio_transport()

        logger.info(f"Starting {self.name} with STDIO transport")
        self.running = True
        await self.transports["stdio"].start()

    async def start_websocket(self, host: str = "localhost", port: int = 8000) -> None:
        """Start server with WebSocket transport."""
        if "websocket" not in self.transports:
            self.add_websocket_transport(host, port)

        logger.info(f"Starting {self.name} with WebSocket transport on {host}:{port}")
        self.running = True
        await self.transports["websocket"].start()

    async def start_http(self, host: str = "localhost", port: int = 8000) -> None:
        """Start server with HTTP transport."""
        if "http" not in self.transports:
            self.add_http_transport(host, port)

        logger.info(f"Starting {self.name} with HTTP transport on {host}:{port}")
        self.running = True
        await self.transports["http"].start()

    async def start_all(self, host: str = "localhost",
                       websocket_port: int = 8000,
                       http_port: int = 8001) -> None:
        """Start server with all transports."""
        self.add_websocket_transport(host, websocket_port)
        self.add_http_transport(host, http_port)

        logger.info(f"Starting {self.name} with all transports")
        self.running = True

        # Start transports concurrently
        tasks = []
        if "websocket" in self.transports:
            tasks.append(self.transports["websocket"].start())
        if "http" in self.transports:
            tasks.append(self.transports["http"].start())

        await asyncio.gather(*tasks)

    async def stop(self) -> None:
        """Stop the server and all transports."""
        if not self.running:
            return

        logger.info(f"Stopping {self.name}")
        self.running = False

        # Stop all transports
        stop_tasks = []
        for transport in self.transports.values():
            if hasattr(transport, 'stop'):
                stop_tasks.append(transport.stop())

        if stop_tasks:
            await asyncio.gather(*stop_tasks)

    def get_status(self) -> Dict[str, Any]:
        """Get server status."""
        return {
            "name": self.name,
            "running": self.running,
            "tools_count": len(self.protocol_handler.tools),
            "resources_count": len(self.protocol_handler.resources),
            "transports": list(self.transports.keys()),
            "capabilities": self.protocol_handler.get_capabilities()
        }

    async def health_check(self) -> Dict[str, Any]:
        """Perform health check."""
        status = self.get_status()
        status.update({
            "health": "healthy" if self.running else "stopped",
            "timestamp": asyncio.get_event_loop().time()
        })
        return status


class MCPToolRegistry:
    """Registry for managing MCP tools across servers."""

    def __init__(self):
        self.tools: Dict[str, Dict[str, Any]] = {}
        self.servers: Dict[str, MCPServerBase] = {}

    def register_server(self, server_name: str, server: MCPServerBase) -> None:
        """Register a server."""
        self.servers[server_name] = server
        logger.info(f"Registered server: {server_name}")

    def get_server(self, server_name: str) -> Optional[MCPServerBase]:
        """Get a server by name."""
        return self.servers.get(server_name)

    def list_servers(self) -> Dict[str, Any]:
        """List all registered servers."""
        return {
            name: server.get_status()
            for name, server in self.servers.items()
        }

    def get_all_tools(self) -> Dict[str, Any]:
        """Get all tools from all servers."""
        all_tools = {}
        for server_name, server in self.servers.items():
            server_tools = {}
            for tool_name, tool in server.protocol_handler.tools.items():
                server_tools[tool_name] = tool.get_tool_info()
            all_tools[server_name] = server_tools

        return all_tools

    async def execute_tool(self, server_name: str, tool_name: str,
                          parameters: Dict[str, Any]) -> Any:
        """Execute a tool on a specific server."""
        server = self.get_server(server_name)
        if not server:
            raise Exception(f"Server '{server_name}' not found")

        return await server.protocol_handler.handle_tools_call({
            "name": tool_name,
            "arguments": parameters
        })
