#!/usr/bin/env python3
"""
MCP Core Protocol
================

Core MCP protocol implementation and message handling.
Provides the foundation for MCP communication.
"""

import json
import logging
from typing import Any, Dict, Optional, Union
from abc import ABC, abstractmethod

logger = logging.getLogger(__name__)

# MCP Protocol Constants
MCP_VERSION = "2024-11-05"
JSONRPC_VERSION = "2.0"


class MCPMessage:
    """MCP message container with JSON-RPC 2.0 compliance."""

    def __init__(self,
                 jsonrpc: str = JSONRPC_VERSION,
                 id: Optional[Union[str, int]] = None,
                 method: Optional[str] = None,
                 params: Optional[Dict[str, Any]] = None,
                 result: Optional[Any] = None,
                 error: Optional[Dict[str, Any]] = None):
        self.jsonrpc = jsonrpc
        self.id = id
        self.method = method
        self.params = params or {}
        self.result = result
        self.error = error

    def to_dict(self) -> Dict[str, Any]:
        """Convert message to dictionary."""
        data = {"jsonrpc": self.jsonrpc}
        if self.id is not None:
            data["id"] = self.id
        if self.method is not None:
            data["method"] = self.method
        if self.params:
            data["params"] = self.params
        if self.result is not None:
            data["result"] = self.result
        if self.error is not None:
            data["error"] = self.error
        return data

    def to_json(self) -> str:
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

    @classmethod
    def from_json(cls, json_str: str) -> 'MCPMessage':
        """Create message from JSON string."""
        return cls.from_dict(json.loads(json_str))

    def is_request(self) -> bool:
        """Check if message is a request."""
        return self.method is not None and self.id is not None

    def is_response(self) -> bool:
        """Check if message is a response."""
        return (self.result is not None or self.error is not None) and self.id is not None

    def is_notification(self) -> bool:
        """Check if message is a notification."""
        return self.method is not None and self.id is None


class MCPError:
    """MCP error codes and messages."""

    # Standard JSON-RPC 2.0 errors
    PARSE_ERROR = -32700
    INVALID_REQUEST = -32600
    METHOD_NOT_FOUND = -32601
    INVALID_PARAMS = -32602
    INTERNAL_ERROR = -32603

    # MCP-specific errors
    SERVER_ERROR = -32000
    INVALID_TOOL = -32001
    INVALID_RESOURCE = -32002
    TOOL_EXECUTION_ERROR = -32003

    @staticmethod
    def create_error(code: int, message: str, data: Optional[Any] = None) -> Dict[str, Any]:
        """Create an error object."""
        error = {"code": code, "message": message}
        if data is not None:
            error["data"] = data
        return error


class MCPTool(ABC):
    """Abstract base class for MCP tools."""

    def __init__(self, name: str, description: str, input_schema: Dict[str, Any]):
        self.name = name
        self.description = description
        self.input_schema = input_schema

    @abstractmethod
    async def execute(self, **kwargs) -> Any:
        """Execute the tool with given parameters."""
        pass

    def get_tool_info(self) -> Dict[str, Any]:
        """Get tool information for registration."""
        return {
            "name": self.name,
            "description": self.description,
            "inputSchema": self.input_schema
        }


class MCPResource:
    """MCP resource representation."""

    def __init__(self, uri: str, name: str, description: str,
                 mime_type: str, content: str = ""):
        self.uri = uri
        self.name = name
        self.description = description
        self.mime_type = mime_type
        self.content = content

    def to_dict(self) -> Dict[str, Any]:
        """Convert resource to dictionary."""
        return {
            "uri": self.uri,
            "name": self.name,
            "description": self.description,
            "mimeType": self.mime_type
        }

    def get_content(self) -> Dict[str, Any]:
        """Get resource content."""
        return {
            "contents": [{
                "uri": self.uri,
                "mimeType": self.mime_type,
                "text": self.content
            }]
        }


class MCPProtocolHandler:
    """Base class for MCP protocol handlers."""

    def __init__(self):
        self.tools: Dict[str, MCPTool] = {}
        self.resources: Dict[str, MCPResource] = {}

    def register_tool(self, tool: MCPTool) -> None:
        """Register a tool."""
        self.tools[tool.name] = tool
        logger.info(f"Registered tool: {tool.name}")

    def register_resource(self, resource: MCPResource) -> None:
        """Register a resource."""
        self.resources[resource.uri] = resource
        logger.info(f"Registered resource: {resource.uri}")

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
        logger.info(f"Initializing with client: {params.get('clientInfo', {})}")

        return {
            "protocolVersion": MCP_VERSION,
            "capabilities": self.get_capabilities(),
            "serverInfo": {
                "name": "MCP Server",
                "version": "1.0.0"
            }
        }

    async def handle_tools_list(self) -> Dict[str, Any]:
        """Handle tools list request."""
        return {
            "tools": [tool.get_tool_info() for tool in self.tools.values()]
        }

    async def handle_tools_call(self, params: Dict[str, Any]) -> Any:
        """Handle tool call request."""
        tool_name = params.get("name")
        tool_args = params.get("arguments", {})

        logger.info(f"Executing tool: {tool_name}")

        if tool_name not in self.tools:
            raise Exception(f"Tool '{tool_name}' not found")

        tool = self.tools[tool_name]
        return await tool.execute(**tool_args)

    async def handle_resources_list(self) -> Dict[str, Any]:
        """Handle resources list request."""
        return {
            "resources": [resource.to_dict() for resource in self.resources.values()]
        }

    async def handle_resources_read(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Handle resource read request."""
        uri = params.get("uri")

        if uri not in self.resources:
            raise Exception(f"Resource '{uri}' not found")

        return self.resources[uri].get_content()

    async def process_message(self, message: MCPMessage) -> MCPMessage:
        """Process an incoming MCP message."""
        try:
            if message.method == "initialize":
                result = await self.handle_initialize(message.params)
            elif message.method == "tools/list":
                result = await self.handle_tools_list()
            elif message.method == "tools/call":
                result = await self.handle_tools_call(message.params)
            elif message.method == "resources/list":
                result = await self.handle_resources_list()
            elif message.method == "resources/read":
                result = await self.handle_resources_read(message.params)
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
                error=MCPError.create_error(MCPError.INTERNAL_ERROR, str(e))
            )
