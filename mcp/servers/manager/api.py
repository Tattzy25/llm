#!/usr/bin/env python3
"""
MCP Manager API
REST API and WebSocket endpoints for MCP server management.
"""

import logging
from typing import Any, Dict

from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from .config import MCPConfigManager
from .server_manager import MCPServerController
from .tool_executor import MCPToolExecutor
from .health_monitor import MCPHealthMonitor

logger = logging.getLogger(__name__)


class MCPManagerAPI:
    """REST API and WebSocket server for MCP management."""

    def __init__(self, config_manager: MCPConfigManager,
                 server_controller: MCPServerController,
                 tool_executor: MCPToolExecutor,
                 health_monitor: MCPHealthMonitor):
        self.config_manager = config_manager
        self.server_controller = server_controller
        self.tool_executor = tool_executor
        self.health_monitor = health_monitor

        # Create FastAPI app
        self.app = FastAPI(
            title="MCP Server Management System",
            description="REST API for managing MCP servers",
            version="1.0.0"
        )

        # Add CORS middleware
        self.app.add_middleware(
            CORSMiddleware,
            allow_origins=["*"],
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )

        self._setup_routes()

    def _setup_routes(self):
        """Setup API routes."""

        @self.app.get("/health")
        async def health_check():
            """Health check endpoint."""
            return await self.health_monitor.get_system_health()

        @self.app.get("/servers")
        async def list_servers():
            """List all configured MCP servers."""
            return self.config_manager.get_all_servers()

        @self.app.get("/servers/{server_name}")
        async def get_server(server_name: str):
            """Get details for a specific server."""
            server_config = self.config_manager.get_server_config(server_name)
            if not server_config:
                raise HTTPException(status_code=404, detail=f"Server {server_name} not found")
            return server_config

        @self.app.post("/servers/{server_name}/start")
        async def start_server_endpoint(server_name: str):
            """Start a specific MCP server."""
            result = await self.server_controller.start_server(server_name)
            if 'error' in result:
                raise HTTPException(status_code=400, detail=result['error'])
            return result

        @self.app.post("/servers/{server_name}/stop")
        async def stop_server_endpoint(server_name: str):
            """Stop a specific MCP server."""
            result = await self.server_controller.stop_server(server_name)
            if 'error' in result:
                raise HTTPException(status_code=400, detail=result['error'])
            return result

        @self.app.get("/servers/{server_name}/status")
        async def get_server_status(server_name: str):
            """Get status of a specific server."""
            return self.server_controller.get_server_status(server_name)

        @self.app.get("/status")
        async def get_all_status():
            """Get status of all servers."""
            return self.server_controller.get_server_status()

        @self.app.post("/servers/{server_name}/tools/{tool_name}/execute")
        async def execute_tool_endpoint(server_name: str, tool_name: str, parameters: Dict[str, Any] = None):
            """Execute a tool on a server."""
            if parameters is None:
                parameters = {}

            result = await self.tool_executor.execute_tool(server_name, tool_name, parameters)
            if 'error' in result:
                raise HTTPException(status_code=400, detail=result['error'])
            return result

        @self.app.get("/tools")
        async def list_all_tools():
            """List all available tools."""
            return self.tool_executor.list_available_tools()

        @self.app.get("/servers/{server_name}/tools")
        async def list_server_tools(server_name: str):
            """List tools for a specific server."""
            return self.tool_executor.list_available_tools(server_name)

        @self.app.get("/health/servers")
        async def get_servers_health():
            """Get health status of all servers."""
            return await self.health_monitor.get_server_health()

        @self.app.get("/health/servers/{server_name}")
        async def get_server_health(server_name: str):
            """Get health status of a specific server."""
            return await self.health_monitor.get_server_health(server_name)

        @self.app.get("/metrics")
        async def get_metrics():
            """Get health metrics for monitoring."""
            return self.health_monitor.get_health_metrics()

        @self.app.websocket("/ws")
        async def websocket_endpoint(websocket: WebSocket):
            """WebSocket endpoint for real-time communication."""
            await websocket.accept()
            try:
                while True:
                    # Receive message from client
                    data = await websocket.receive_json()

                    # Process the message
                    response = await self._handle_websocket_message(data)

                    # Send response back
                    await websocket.send_json(response)

            except WebSocketDisconnect:
                logger.info("WebSocket client disconnected")
            except Exception as e:
                logger.error(f"WebSocket error: {e}")
                try:
                    await websocket.send_json({"error": str(e)})
                except:
                    pass

    async def _handle_websocket_message(self, message: Dict[str, Any]) -> Dict[str, Any]:
        """Handle WebSocket messages."""
        try:
            action = message.get('action')

            if action == 'start_server':
                server_name = message.get('server_name')
                if not server_name:
                    return {"error": "server_name required"}
                return await self.server_controller.start_server(server_name)

            elif action == 'stop_server':
                server_name = message.get('server_name')
                if not server_name:
                    return {"error": "server_name required"}
                return await self.server_controller.stop_server(server_name)

            elif action == 'get_status':
                server_name = message.get('server_name')
                return self.server_controller.get_server_status(server_name)

            elif action == 'execute_tool':
                server_name = message.get('server_name')
                tool_name = message.get('tool_name')
                parameters = message.get('parameters', {})

                if not server_name or not tool_name:
                    return {"error": "server_name and tool_name required"}

                return await self.tool_executor.execute_tool(server_name, tool_name, parameters)

            elif action == 'get_health':
                return await self.health_monitor.get_system_health()

            else:
                return {"error": f"Unknown action: {action}"}

        except Exception as e:
            logger.error(f"WebSocket message handling error: {e}")
            return {"error": str(e)}

    def get_app(self) -> FastAPI:
        """Get the FastAPI application instance."""
        return self.app
