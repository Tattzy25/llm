#!/usr/bin/env python3
"""
MCP Tools Package
================

Common MCP tools and utilities shared across servers.
Provides reusable tool implementations for MCP servers.
"""

from .common import (
    MCPCommonTools,
    MCPFileTools,
    MCPNetworkTools,
    MCPSystemTools
)

from .web import (
    MCPWebTools,
    MCPScrapingTools,
    MCPAPITools
)

from .ai import (
    MCPAITools,
    MCPContentTools,
    MCPAnalysisTools
)

from .database import (
    MCPDatabaseTools,
    MCPQueryTools,
    MCPMigrationTools
)

__all__ = [
    # Common
    "MCPCommonTools",
    "MCPFileTools",
    "MCPNetworkTools",
    "MCPSystemTools",

    # Web
    "MCPWebTools",
    "MCPScrapingTools",
    "MCPAPITools",

    # AI
    "MCPAITools",
    "MCPContentTools",
    "MCPAnalysisTools",

    # Database
    "MCPDatabaseTools",
    "MCPQueryTools",
    "MCPMigrationTools"
]

__version__ = "1.0.0"
