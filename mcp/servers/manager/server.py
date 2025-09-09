#!/usr/bin/env python3
"""
MCP Server Manager
Main server module that orchestrates all MCP server management functionality.
"""

import asyncio
import logging
from typing import Any, Dict, Optional

from mcp import Tool
from mcp.server import Server

from .config import MCPConfigManager
from .server_manager import MCPServerController
from .tool_executor import MCPToolExecutor
from .health_monitor import MCPHealthMonitor
from .api import MCPManagerAPI

logger = logging.getLogger(__name__)


class MCPServerManager:
    """Master MCP server manager for orchestrating multiple MCP servers."""

    def __init__(self, config_path: str = "servers/mcp-config-expanded.json"):
        self.config_manager = MCPConfigManager(config_path)
        self.server_controller = MCPServerController(self.config_manager)
        self.tool_executor = MCPToolExecutor(self.config_manager, self.server_controller)
        self.health_monitor = MCPHealthMonitor(self.config_manager, self.server_controller)

        # Create MCP server
        self.server = Server("mcp-server-manager")

        # Create REST API
        self.api = MCPManagerAPI(
            self.config_manager,
            self.server_controller,
            self.tool_executor,
            self.health_monitor
        )

        # Register MCP tools
        self._register_tools()

    def _register_tools(self):
        """Register all available MCP tools."""

        @self.server.tool()
        async def start_mcp_server(server_name: str) -> Dict[str, Any]:
            """
            Start a specific MCP server.

            Args:
                server_name: Name of the MCP server to start

            Returns:
                Server startup result
            """
            return await self.server_controller.start_server(server_name)

        @self.server.tool()
        async def stop_mcp_server(server_name: str) -> Dict[str, Any]:
            """
            Stop a specific MCP server.

            Args:
                server_name: Name of the MCP server to stop

            Returns:
                Server shutdown result
            """
            return await self.server_controller.stop_server(server_name)

        @self.server.tool()
        async def get_mcp_server_status(server_name: str = None) -> Dict[str, Any]:
            """
            Get status of MCP servers.

            Args:
                server_name: Specific server name (optional, returns all if not specified)

            Returns:
                Server status information
            """
            return self.server_controller.get_server_status(server_name)

        @self.server.tool()
        async def list_mcp_tools(server_name: str = None) -> Dict[str, Any]:
            """
            List available tools from MCP servers.

            Args:
                server_name: Specific server name (optional, returns all if not specified)

            Returns:
                Available tools information
            """
            return self.tool_executor.list_available_tools(server_name)

        @self.server.tool()
        async def execute_mcp_tool(server_name: str, tool_name: str,
                                  parameters: Dict[str, Any]) -> Dict[str, Any]:
            """
            Execute a tool on a specific MCP server.

            Args:
                server_name: Name of the MCP server
                tool_name: Name of the tool to execute
                parameters: Tool parameters

            Returns:
                Tool execution result
            """
            return await self.tool_executor.execute_tool(server_name, tool_name, parameters)

        @self.server.tool()
        async def get_system_health() -> Dict[str, Any]:
            """
            Get overall system health and MCP server statistics.

            Returns:
                System health information
            """
            return await self.health_monitor.get_system_health()

    async def serve_stdio(self):
        """Serve the MCP server over stdio."""
        from mcp.server.stdio import stdio_server

        async with stdio_server() as (read_stream, write_stream):
            await self.server.run(
                read_stream,
                write_stream,
                self.server.create_initialization_options()
            )

    async def serve_websocket(self, host: str = "localhost", port: int = 8000):
        """Serve the MCP server over WebSocket."""
        from mcp.server.websocket import websocket_server

        async with websocket_server(host=host, port=port) as server:
            await self.server.run(
                server.read_stream,
                server.write_stream,
                self.server.create_initialization_options()
            )

    def get_fastapi_app(self):
        """Get the FastAPI application for HTTP/WebSocket serving."""
        return self.api.get_app()

    async def start_health_monitoring(self, interval: int = 60):
        """Start background health monitoring."""
        asyncio.create_task(self.health_monitor.monitor_servers(interval))

    def validate_configuration(self) -> Dict[str, Any]:
        """Validate the current configuration."""
        return self.config_manager.validate_config()


async def main():
    """Main entry point for the MCP Server Manager."""
    import sys

    # Configure logging
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )

    # Create server manager
    manager = MCPServerManager()

    # Validate configuration
    validation = manager.validate_configuration()
    if not validation['valid']:
        logger.error(f"Configuration validation failed: {validation['issues']}")
        sys.exit(1)

    # Check if WebSocket mode is requested
    if len(sys.argv) > 1 and sys.argv[1] == "--websocket":
        host = sys.argv[2] if len(sys.argv) > 2 else "localhost"
        port = int(sys.argv[3]) if len(sys.argv) > 3 else 8000
        logger.info(f"Starting MCP Server Manager on WebSocket {host}:{port}")
        await manager.serve_websocket(host, port)
    elif len(sys.argv) > 1 and sys.argv[1] == "--http":
        # Start HTTP server with health monitoring
        await manager.start_health_monitoring()
        import uvicorn
        host = sys.argv[2] if len(sys.argv) > 2 else "api.digitalhustlelab.com"
        port = int(sys.argv[3]) if len(sys.argv) > 3 else 3000
        logger.info(f"Starting MCP Server Manager HTTP server on {host}:{port}")
        uvicorn.run(manager.get_fastapi_app(), host=host, port=port)
    else:
        logger.info("Starting MCP Server Manager on stdio")
        await manager.serve_stdio()


if __name__ == "__main__":
    asyncio.run(main())
