#!/usr/bin/env python3
"""
Desktop MCP Server
Main server module that orchestrates desktop-specific MCP functionality.
"""

import asyncio
import json
import logging
import sys
from typing import Any, Dict

from .tools import DesktopToolsManager
from .resources import DesktopResourcesManager
from .protocol import MCPProtocolHandler, MCPMessage

logger = logging.getLogger(__name__)


class MCPDesktopServer:
    """MCP Desktop Server with integrated tools and resources."""

    def __init__(self):
        self.tools_manager = DesktopToolsManager()
        self.resources_manager = DesktopResourcesManager()
        self.protocol_handler = MCPProtocolHandler(self.tools_manager, self.resources_manager)

    async def serve_stdio(self):
        """Serve the MCP server over stdio."""
        logger.info("Starting Desktop MCP server in STDIO mode")
        logger.info("Available tools: file_operations, system_info, clipboard, notification, application")

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
                    message = MCPMessage.from_dict(message_data)

                    # Process message
                    response = await self.protocol_handler.process_message(message)

                    # Write to stdout
                    print(response.json(), flush=True)

                except json.JSONDecodeError as e:
                    logger.error(f"Invalid JSON received: {e}")
                except Exception as e:
                    logger.error(f"Error processing STDIO message: {e}")

        except KeyboardInterrupt:
            logger.info("Desktop server stopped")

    async def serve_websocket(self, host: str = "localhost", port: int = 8001):
        """Serve the MCP server over WebSocket."""
        from mcp.server.websocket import websocket_server

        async with websocket_server(host=host, port=port) as server:
            await server.run(
                self._handle_websocket_message,
                server.create_initialization_options()
            )

    async def _handle_websocket_message(self, message_data: Dict[str, Any]) -> Dict[str, Any]:
        """Handle WebSocket messages."""
        try:
            message = MCPMessage.from_dict(message_data)
            response = await self.protocol_handler.process_message(message)
            return response.to_dict()
        except Exception as e:
            logger.error(f"WebSocket message handling error: {e}")
            return {
                "jsonrpc": "2.0",
                "id": message_data.get("id"),
                "error": {
                    "code": -32000,
                    "message": str(e)
                }
            }


async def main():
    """Main entry point for the Desktop MCP Server."""
    # Configure logging
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[
            logging.StreamHandler(sys.stderr),  # Log to stderr for MCP compatibility
            logging.FileHandler('desktop_server.log')
        ]
    )

    # Check for required dependencies
    try:
        import pyperclip
        import plyer
    except ImportError as e:
        logger.error(f"Missing required dependencies: {e}")
        logger.error("Please install with: pip install pyperclip plyer")
        sys.exit(1)

    server = MCPDesktopServer()

    # Check if WebSocket mode is requested
    if len(sys.argv) > 1 and sys.argv[1] == "--websocket":
        host = sys.argv[2] if len(sys.argv) > 2 else "localhost"
        port = int(sys.argv[3]) if len(sys.argv) > 3 else 8001
        logger.info(f"Starting Desktop MCP Server on WebSocket {host}:{port}")
        await server.serve_websocket(host, port)
    else:
        logger.info("Starting Desktop MCP Server on stdio")
        await server.serve_stdio()


if __name__ == "__main__":
    asyncio.run(main())
