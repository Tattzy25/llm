#!/usr/bin/env python3
"""
MCP Async Utils
===============

Async utility functions for MCP servers.
"""

import asyncio
from typing import List, Any, Callable

from mcp.core.utils.validation import MCPValidationError


class MCPAsyncUtils:
    """Async utility functions."""

    @staticmethod
    async def gather_with_timeout(*coroutines, timeout: float = 30.0) -> List[Any]:
        """Gather coroutines with timeout."""
        try:
            return await asyncio.gather(*coroutines, timeout=timeout)
        except asyncio.TimeoutError:
            raise MCPValidationError(f"Operation timed out after {timeout} seconds")

    @staticmethod
    async def run_in_executor(func: Callable, *args, **kwargs) -> Any:
        """Run blocking function in thread pool executor."""
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, func, *args, **kwargs)

    @staticmethod
    def create_task(coro) -> asyncio.Task:
        """Create an asyncio task."""
        return asyncio.create_task(coro)
