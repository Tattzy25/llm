#!/usr/bin/env python3
"""
MCP Retry Utils
===============

Retry utilities with exponential backoff for MCP servers.
"""

import time
from typing import Callable, Any


class MCPRetry:
    """Retry utility with exponential backoff."""

    def __init__(self, max_attempts: int = 3, base_delay: float = 1.0,
                 max_delay: float = 60.0, backoff_factor: float = 2.0):
        self.max_attempts = max_attempts
        self.base_delay = base_delay
        self.max_delay = max_delay
        self.backoff_factor = backoff_factor

    def execute(self, func: Callable, *args, **kwargs) -> Any:
        """Execute function with retry logic."""
        last_exception = None
        for attempt in range(self.max_attempts):
            try:
                return func(*args, **kwargs)
            except Exception as e:
                last_exception = e
                if attempt < self.max_attempts - 1:
                    delay = min(self.base_delay * (self.backoff_factor ** attempt), self.max_delay)
                    time.sleep(delay)
        raise last_exception
