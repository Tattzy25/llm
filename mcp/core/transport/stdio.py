#!/usr/bin/env python3
"""
MCP STDIO Transport
==================

STDIO-based transport for MCP communication.
Handles message serialization and I/O operations.
"""

import asyncio
import json
import logging
import sys
from typing import Any, Dict, Optional

from ..protocol.handler import MCPMessage

logger = logging.getLogger(__name__)


class MCPSTDIOTransport:
    """STDIO transport for MCP communication."""

    def __init__(self, protocol_handler):
        self.protocol_handler = protocol_handler
        self.running = False

    async def start(self) -> None:
        """Start the STDIO transport."""
        self.running = True
        logger.info("Starting MCP STDIO transport")

        try:
            while self.running:
                # Read from stdin
                line = await self._read_line()
                if not line:
                    break

                line = line.strip()
                if not line:
                    continue

                try:
                    # Parse and process message
                    message_data = json.loads(line)
                    message = MCPMessage.from_dict(message_data)

                    # Process message
                    response = await self.protocol_handler.process_message(message)

                    # Write response to stdout
                    await self._write_message(response)

                except json.JSONDecodeError as e:
                    logger.error(f"Invalid JSON received: {e}")
                    await self._write_error("Invalid JSON format")
                except Exception as e:
                    logger.error(f"Error processing STDIO message: {e}")
                    await self._write_error(str(e))

        except KeyboardInterrupt:
            logger.info("STDIO transport stopped by user")
        except Exception as e:
            logger.error(f"STDIO transport error: {e}")
        finally:
            self.running = False

    async def stop(self) -> None:
        """Stop the STDIO transport."""
        self.running = False
        logger.info("Stopping MCP STDIO transport")

    async def _read_line(self) -> Optional[str]:
        """Read a line from stdin."""
        try:
            # Use asyncio to read from stdin without blocking
            loop = asyncio.get_event_loop()
            line = await loop.run_in_executor(None, sys.stdin.readline)
            return line
        except Exception as e:
            logger.error(f"Error reading from stdin: {e}")
            return None

    async def _write_message(self, message: MCPMessage) -> None:
        """Write a message to stdout."""
        try:
            json_str = message.to_json()
            print(json_str, flush=True)
        except Exception as e:
            logger.error(f"Error writing message: {e}")

    async def _write_error(self, error_message: str) -> None:
        """Write an error message."""
        try:
            error_response = MCPMessage(
                jsonrpc="2.0",
                error={
                    "code": -32700,
                    "message": error_message
                }
            )
            await self._write_message(error_response)
        except Exception as e:
            logger.error(f"Error writing error message: {e}")


class MCPWebSocketTransport:
    """WebSocket transport for MCP communication."""

    def __init__(self, protocol_handler, host: str = "localhost", port: int = 8000):
        self.protocol_handler = protocol_handler
        self.host = host
        self.port = port
        self.running = False
        self.server = None

    async def start(self) -> None:
        """Start the WebSocket transport."""
        self.running = True
        logger.info(f"Starting MCP WebSocket transport on {self.host}:{self.port}")

        try:
            # Import here to avoid dependency issues
            from mcp.server.websocket import websocket_server

            async with websocket_server(host=self.host, port=self.port) as server:
                self.server = server
                await server.run(
                    self._handle_websocket_message,
                    server.create_initialization_options()
                )
        except Exception as e:
            logger.error(f"WebSocket transport error: {e}")
        finally:
            self.running = False

    async def stop(self) -> None:
        """Stop the WebSocket transport."""
        self.running = False
        if self.server:
            await self.server.close()
        logger.info("Stopping MCP WebSocket transport")

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


class MCPHTTPTransport:
    """HTTP transport for MCP communication."""

    def __init__(self, protocol_handler, host: str = "localhost", port: int = 8000):
        self.protocol_handler = protocol_handler
        self.host = host
        self.port = port
        self.running = False
        self.app = None

    async def start(self) -> None:
        """Start the HTTP transport."""
        self.running = True
        logger.info(f"Starting MCP HTTP transport on {self.host}:{self.port}")

        try:
            # Import here to avoid dependency issues
            from fastapi import FastAPI
            from uvicorn import Config, Server

            self.app = FastAPI(title="MCP Server", version="1.0.0")
            self._setup_routes()

            config = Config(app=self.app, host=self.host, port=self.port)
            server = Server(config)

            await server.serve()

        except Exception as e:
            logger.error(f"HTTP transport error: {e}")
        finally:
            self.running = False

    async def stop(self) -> None:
        """Stop the HTTP transport."""
        self.running = False
        logger.info("Stopping MCP HTTP transport")

    def _setup_routes(self) -> None:
        """Setup HTTP routes."""
        if not self.app:
            return

        @self.app.post("/mcp")
        async def handle_mcp_request(request_data: Dict[str, Any]):
            """Handle MCP requests over HTTP."""
            try:
                message = MCPMessage.from_dict(request_data)
                response = await self.protocol_handler.process_message(message)
                return response.to_dict()
            except Exception as e:
                logger.error(f"HTTP request handling error: {e}")
                return {
                    "jsonrpc": "2.0",
                    "id": request_data.get("id"),
                    "error": {
                        "code": -32000,
                        "message": str(e)
                    }
                }

        @self.app.get("/health")
        async def health_check():
            """Health check endpoint."""
            return {
                "status": "healthy",
                "transport": "http",
                "tools_count": len(self.protocol_handler.tools),
                "resources_count": len(self.protocol_handler.resources)
            }
