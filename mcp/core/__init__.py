#!/usr/bin/env python3
"""
MCP Core Package
===============

Core MCP functionality and utilities.
Provides the foundation for building MCP servers and clients.
"""

from .protocol.handler import (
    MCPMessage,
    MCPError,
    MCPTool,
    MCPResource,
    MCPProtocolHandler
)

from .transport.stdio import (
    MCPSTDIOTransport,
    MCPWebSocketTransport,
    MCPHTTPTransport
)

from .server.base import (
    MCPServerBase,
    MCPToolRegistry
)

from .utils.validation import (
    MCPValidator,
    MCPValidationError,
    MCPIDGenerator,
    MCPNetworkUtils,
    MCPFileUtils,
    MCPJsonUtils,
    MCPLoggingUtils,
    MCPEnvironmentUtils,
    validate_mcp_message,
    validate_tool_params,
    generate_id,
    find_free_port
)

__all__ = [
    # Protocol
    "MCPMessage",
    "MCPError",
    "MCPTool",
    "MCPResource",
    "MCPProtocolHandler",

    # Transport
    "MCPSTDIOTransport",
    "MCPWebSocketTransport",
    "MCPHTTPTransport",

    # Server
    "MCPServerBase",
    "MCPToolRegistry",

    # Utils
    "MCPValidator",
    "MCPValidationError",
    "MCPIDGenerator",
    "MCPNetworkUtils",
    "MCPFileUtils",
    "MCPJsonUtils",
    "MCPLoggingUtils",
    "MCPEnvironmentUtils",
    "validate_mcp_message",
    "validate_tool_params",
    "generate_id",
    "find_free_port"
]

__version__ = "1.0.0"
