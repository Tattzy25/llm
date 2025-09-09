#!/usr/bin/env python3
"""
Desktop Server MCP Protocol
Handles MCP protocol communication for the desktop server.
"""

import json
import logging
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)

# MCP Protocol Constants
MCP_VERSION = "2024-11-05"
JSONRPC_VERSION = "2.0"


class MCPMessage:
    """MCP message container."""

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
        """Convert message to dictionary."""
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
        """Convert message to JSON string."""
        return json.dumps(self.to_dict())

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'MCPMessage':
        """Create message from dictionary."""
        return cls(
            jsonrpc=data.get("jsonrpc", JSONRPC_VERSION),
            id=data.get("id"),
            method=data.get("method"),
            params=data.get("params"),
            result=data.get("result"),
            error=data.get("error")
        )


class MCPProtocolHandler:
    """Handles MCP protocol messages and responses."""

    def __init__(self, tools_manager, resources_manager):
        self.tools_manager = tools_manager
        self.resources_manager = resources_manager

    def get_capabilities(self) -> Dict[str, Any]:
        """Get server capabilities."""
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
        """Handle initialization request."""
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
        """Handle tools list request."""
        return self.tools_manager.get_tool_info()

    async def handle_tools_call(self, params: Dict[str, Any]) -> Any:
        """Handle tool call request."""
        tool_name = params.get("name")
        tool_args = params.get("arguments", {})

        logger.info(f"Executing tool: {tool_name} with args: {tool_args}")

        tool = self.tools_manager.get_tool(tool_name)
        if not tool:
            raise Exception(f"Tool '{tool_name}' not found")

        return await tool.execute(**tool_args)

    async def handle_resources_list(self) -> List[Dict[str, Any]]:
        """Handle resources list request."""
        return self.resources_manager.list_resources()

    async def handle_resources_read(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Handle resource read request."""
        uri = params.get("uri")
        resource = self.resources_manager.read_resource(uri)
        if not resource:
            raise Exception(f"Resource '{uri}' not found")

        return resource

    async def process_message(self, message: MCPMessage) -> MCPMessage:
        """Process an incoming MCP message."""
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
