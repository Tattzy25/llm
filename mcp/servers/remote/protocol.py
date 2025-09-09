#!/usr/bin/env python3
"""
MCP Protocol Handler
Handles MCP protocol messages and communication.
"""

import json
import logging
import uuid
from typing import Any, Dict, Optional

logger = logging.getLogger(__name__)

# MCP Protocol Constants
MCP_VERSION = "2024-11-05"
JSONRPC_VERSION = "2.0"


class MCPMessage:
    """MCP protocol message handler."""

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


class MCPProtocolHandler:
    """Handles MCP protocol communication."""

    def __init__(self):
        self.pending_requests = {}

    def create_request(self, method: str, params: Optional[Dict[str, Any]] = None) -> MCPMessage:
        """Create a new MCP request message."""
        request_id = str(uuid.uuid4())
        message = MCPMessage(
            id=request_id,
            method=method,
            params=params or {}
        )
        self.pending_requests[request_id] = message
        return message

    def create_response(self, request_id: str, result: Any = None, error: Dict[str, Any] = None) -> MCPMessage:
        """Create a response message."""
        return MCPMessage(
            id=request_id,
            result=result,
            error=error
        )

    def create_notification(self, method: str, params: Optional[Dict[str, Any]] = None) -> MCPMessage:
        """Create a notification message (no ID)."""
        return MCPMessage(
            method=method,
            params=params or {}
        )

    def handle_message(self, message: MCPMessage) -> Optional[MCPMessage]:
        """Handle incoming MCP message."""
        if message.method:
            return self._handle_request(message)
        elif message.id and (message.result or message.error):
            return self._handle_response(message)
        else:
            logger.warning(f"Unknown message type: {message.to_dict()}")
            return None

    def _handle_request(self, message: MCPMessage) -> MCPMessage:
        """Handle incoming request."""
        method = message.method
        params = message.params or {}

        try:
            if method == "initialize":
                return self._handle_initialize(params)
            elif method == "tools/list":
                return self._handle_tools_list()
            elif method == "tools/call":
                return self._handle_tools_call(params)
            elif method == "resources/list":
                return self._handle_resources_list()
            elif method == "resources/read":
                return self._handle_resources_read(params)
            else:
                return self.create_response(
                    message.id,
                    error={"code": -32601, "message": f"Method not found: {method}"}
                )
        except Exception as e:
            logger.error(f"Error handling request {method}: {e}")
            return self.create_response(
                message.id,
                error={"code": -32603, "message": str(e)}
            )

    def _handle_response(self, message: MCPMessage) -> None:
        """Handle incoming response."""
        request_id = message.id
        if request_id in self.pending_requests:
            # Handle the response (could emit events, callbacks, etc.)
            del self.pending_requests[request_id]
        return None

    def _handle_initialize(self, params: Dict[str, Any]) -> MCPMessage:
        """Handle initialize request."""
        return MCPMessage(
            id=params.get("id"),
            result={
                "protocolVersion": MCP_VERSION,
                "capabilities": {
                    "tools": {"listChanged": True},
                    "resources": {"listChanged": True}
                },
                "serverInfo": {
                    "name": "remote-mcp-server",
                    "version": "1.0.0"
                }
            }
        )

    def _handle_tools_list(self) -> MCPMessage:
        """Handle tools/list request."""
        # This should be implemented by subclasses
        return MCPMessage(
            result={"tools": []}
        )

    def _handle_tools_call(self, params: Dict[str, Any]) -> MCPMessage:
        """Handle tools/call request."""
        # This should be implemented by subclasses
        return MCPMessage(
            result={"content": []}
        )

    def _handle_resources_list(self) -> MCPMessage:
        """Handle resources/list request."""
        return MCPMessage(
            result={"resources": []}
        )

    def _handle_resources_read(self, params: Dict[str, Any]) -> MCPMessage:
        """Handle resources/read request."""
        return MCPMessage(
            result={"contents": []}
        )
