#!/usr/bin/env python3
"""
MCP Timer Utils
===============

Timing utilities for MCP servers.
"""

import time
from typing import Callable
from functools import wraps

from mcp.core.utils.validation import MCPValidationError


class MCPTimer:
    """Timing utility for performance measurement."""

    def __init__(self):
        self.start_time = None
        self.end_time = None

    def start(self) -> None:
        """Start the timer."""
        self.start_time = time.time()

    def stop(self) -> float:
        """Stop the timer and return elapsed time."""
        if self.start_time is None:
            raise MCPValidationError("Timer not started")
        self.end_time = time.time()
        return self.elapsed()

    def elapsed(self) -> float:
        """Get elapsed time without stopping."""
        if self.start_time is None:
            raise MCPValidationError("Timer not started")
        end_time = self.end_time or time.time()
        return end_time - self.start_time

    def reset(self) -> None:
        """Reset the timer."""
        self.start_time = None
        self.end_time = None

    @staticmethod
    def measure_time(func: Callable) -> Callable:
        """Decorator to measure function execution time."""
        @wraps(func)
        def wrapper(*args, **kwargs):
            timer = MCPTimer()
            timer.start()
            try:
                result = func(*args, **kwargs)
                elapsed = timer.stop()
                print(f"{func.__name__} executed in {elapsed:.4f} seconds")
                return result
            except Exception as e:
                elapsed = timer.elapsed()
                print(f"{func.__name__} failed after {elapsed:.4f} seconds: {str(e)}")
                raise
        return wrapper
