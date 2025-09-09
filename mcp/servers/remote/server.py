#!/usr/bin/env python3
"""
Remote MCP Server
Main server implementation for the remote MCP server.
"""

import asyncio
import json
import logging
import os
import sys
from typing import Any, Dict, List, Optional

import uvicorn
from fastapi import FastAPI, WebSocket, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from .protocol import MCPProtocolHandler, MCPMessage
from .tools import FileSystemTool, WebSearchTool, DatabaseTool, SystemInfoTool

logger = logging.getLogger(__name__)


class MCPServer:
    """MCP Server implementation."""

    def __init__(self):
        self.protocol_handler = MCPProtocolHandler()
        self.tools = {}
        self._register_tools()

    def _register_tools(self):
        """Register available tools."""
        self.tools = {
            "filesystem": FileSystemTool(),
            "web_search": WebSearchTool(),
            "database": DatabaseTool(),
            "system_info": SystemInfoTool()
        }

    def get_capabilities(self) -> Dict[str, Any]:
        """Get server capabilities."""
        return {
            "protocolVersion": "2024-11-05",
            "capabilities": {
                "tools": {"listChanged": True},
                "resources": {"listChanged": True}
            },
            "serverInfo": {
                "name": "remote-mcp-server",
                "version": "1.0.0"
            }
        }

    async def handle_initialize(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Handle initialize request."""
        return self.get_capabilities()

    async def handle_tools_list(self) -> List[Dict[str, Any]]:
        """Handle tools/list request."""
        tools_list = []
        for tool_name, tool in self.tools.items():
            tools_list.append({
                "name": tool_name,
                "description": tool.description,
                "parameters": tool.parameters
            })
        return tools_list

    async def handle_tools_call(self, params: Dict[str, Any]) -> Any:
        """Handle tools/call request."""
        tool_name = params.get("name")
        tool_args = params.get("arguments", {})

        if tool_name not in self.tools:
            raise ValueError(f"Unknown tool: {tool_name}")

        tool = self.tools[tool_name]
        return await tool.execute(**tool_args)

    async def handle_resources_list(self) -> List[Dict[str, Any]]:
        """Handle resources/list request."""
        return []  # No resources implemented yet

    async def handle_resources_read(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Handle resources/read request."""
        return {"contents": []}  # No resources implemented yet

    async def process_message(self, message: MCPMessage) -> MCPMessage:
        """Process incoming MCP message."""
        return await self.protocol_handler.handle_message(message)


# Global server instance
mcp_server = MCPServer()

# FastAPI app for HTTP endpoints
app = FastAPI(title="LLM Remote MCP Server", version="1.0.0")
security = HTTPBearer()


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "server": "remote-mcp-server"}


@app.websocket("/mcp")
async def mcp_websocket(websocket: WebSocket):
    """MCP WebSocket endpoint."""
    await websocket.accept()
    logger.info("WebSocket connection established")

    try:
        while True:
            data = await websocket.receive_text()
            logger.debug(f"Received message: {data}")

            try:
                message_data = json.loads(data)
                message = MCPMessage.from_dict(message_data)

                # Process the message
                if message.method == "initialize":
                    response = await mcp_server.handle_initialize(message.params or {})
                    response_message = MCPMessage(
                        id=message.id,
                        result=response
                    )
                elif message.method == "tools/list":
                    tools = await mcp_server.handle_tools_list()
                    response_message = MCPMessage(
                        id=message.id,
                        result={"tools": tools}
                    )
                elif message.method == "tools/call":
                    result = await mcp_server.handle_tools_call(message.params or {})
                    response_message = MCPMessage(
                        id=message.id,
                        result={"content": result}
                    )
                elif message.method == "resources/list":
                    resources = await mcp_server.handle_resources_list()
                    response_message = MCPMessage(
                        id=message.id,
                        result={"resources": resources}
                    )
                elif message.method == "resources/read":
                    result = await mcp_server.handle_resources_read(message.params or {})
                    response_message = MCPMessage(
                        id=message.id,
                        result=result
                    )
                else:
                    response_message = MCPMessage(
                        id=message.id,
                        error={"code": -32601, "message": f"Method not found: {message.method}"}
                    )

                await websocket.send_text(response_message.to_json())

            except json.JSONDecodeError:
                error_message = MCPMessage(
                    error={"code": -32700, "message": "Parse error"}
                )
                await websocket.send_text(error_message.to_json())

            except Exception as e:
                logger.error(f"Error processing message: {e}")
                error_message = MCPMessage(
                    id=message.id if hasattr(message, 'id') else None,
                    error={"code": -32603, "message": str(e)}
                )
                await websocket.send_text(error_message.to_json())

    except Exception as e:
        logger.error(f"WebSocket error: {e}")
    finally:
        logger.info("WebSocket connection closed")


async def handle_stdio():
    """Handle STDIO communication for local MCP clients."""
    logger.info("Starting MCP server in STDIO mode")

    try:
        while True:
            # Read from stdin
            line = await asyncio.get_event_loop().run_in_executor(None, sys.stdin.readline)
            if not line:
                break

            line = line.strip()
            if not line:
                continue

            logger.debug(f"Received STDIO message: {line}")

            try:
                message_data = json.loads(line)
                message = MCPMessage.from_dict(message_data)

                # Process the message (similar to WebSocket handling)
                if message.method == "initialize":
                    response = await mcp_server.handle_initialize(message.params or {})
                    response_message = MCPMessage(
                        id=message.id,
                        result=response
                    )
                elif message.method == "tools/list":
                    tools = await mcp_server.handle_tools_list()
                    response_message = MCPMessage(
                        id=message.id,
                        result={"tools": tools}
                    )
                elif message.method == "tools/call":
                    result = await mcp_server.handle_tools_call(message.params or {})
                    response_message = MCPMessage(
                        id=message.id,
                        result={"content": result}
                    )
                else:
                    response_message = MCPMessage(
                        id=message.id,
                        error={"code": -32601, "message": f"Method not found: {message.method}"}
                    )

                # Write to stdout
                print(response_message.to_json(), flush=True)

            except json.JSONDecodeError:
                error_message = MCPMessage(
                    error={"code": -32700, "message": "Parse error"}
                )
                print(error_message.to_json(), flush=True)

            except Exception as e:
                logger.error(f"Error processing STDIO message: {e}")
                error_message = MCPMessage(
                    id=message.id if hasattr(message, 'id') else None,
                    error={"code": -32603, "message": str(e)}
                )
                print(error_message.to_json(), flush=True)

    except KeyboardInterrupt:
        logger.info("STDIO server interrupted")
    except Exception as e:
        logger.error(f"STDIO server error: {e}")


def main():
    """Main entry point."""
    import argparse

    parser = argparse.ArgumentParser(description="LLM Remote MCP Server")
    parser.add_argument("--host", default="api.digitalhustlelab.com", help="Host to bind to")
    parser.add_argument("--port", type=int, default=3001, help="Port to bind to")
    parser.add_argument("--stdio", action="store_true", help="Run in STDIO mode for local clients")
    parser.add_argument("--log-level", default="INFO", choices=["DEBUG", "INFO", "WARNING", "ERROR"])

    args = parser.parse_args()

    # Set log level
    logging.getLogger().setLevel(getattr(logging, args.log_level))

    if args.stdio:
        logger.info("Starting server in STDIO mode")
        asyncio.run(handle_stdio())
    else:
        logger.info(f"Starting server on {args.host}:{args.port}")
        uvicorn.run(app, host=args.host, port=args.port)


if __name__ == "__main__":
    main()
