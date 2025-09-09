#!/usr/bin/env python3
"""
MCP Rate Limiter Utils
======================

Rate limiting utilities for MCP servers.
"""

import time
from typing import List


class MCPRateLimiter:
    """Rate limiting utility."""

    def __init__(self, max_calls: int, time_window: float):
        self.max_calls = max_calls
        self.time_window = time_window
        self.calls: List[float] = []

    def is_allowed(self) -> bool:
        """Check if call is allowed under rate limit."""
        now = time.time()
        # Remove old calls outside the time window
        self.calls = [call for call in self.calls if now - call < self.time_window]
        if len(self.calls) < self.max_calls:
            self.calls.append(now)
            return True
        return False

    def get_remaining_calls(self) -> int:
        """Get remaining calls in current window."""
        now = time.time()
        self.calls = [call for call in self.calls if now - call < self.time_window]
        return max(0, self.max_calls - len(self.calls))

    def get_reset_time(self) -> float:
        """Get time until rate limit resets."""
        if not self.calls:
            return 0
        now = time.time()
        oldest_call = min(self.calls)
        return max(0, self.time_window - (now - oldest_call))
