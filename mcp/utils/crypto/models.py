#!/usr/bin/env python3
"""
MCP Access Control Models
=========================

Data models for access control.
"""

from typing import Dict, List, Optional, Any
from dataclasses import dataclass


@dataclass
class MCPPermission:
    """Permission definition."""
    resource: str
    action: str
    conditions: Optional[Dict[str, Any]] = None


@dataclass
class MCPRole:
    """Role definition."""
    name: str
    permissions: List[MCPPermission]
    description: Optional[str] = None
