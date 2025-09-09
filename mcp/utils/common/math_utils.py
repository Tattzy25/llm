#!/usr/bin/env python3
"""
MCP Math Utils
==============

Mathematical utility functions for MCP servers.
"""

import secrets


class MCPMathUtils:
    """Mathematical utility functions."""

    @staticmethod
    def calculate_percentage(part: float, total: float, decimals: int = 2) -> float:
        """Calculate percentage."""
        if total == 0:
            return 0.0
        return round((part / total) * 100, decimals)

    @staticmethod
    def clamp(value: float, min_val: float, max_val: float) -> float:
        """Clamp value between min and max."""
        return max(min_val, min(value, max_val))

    @staticmethod
    def round_to_nearest(value: float, nearest: float) -> float:
        """Round value to nearest multiple."""
        return round(value / nearest) * nearest

    @staticmethod
    def generate_random_string(length: int = 8,
                              charset: str = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789") -> str:
        """Generate random string."""
        return ''.join(secrets.choice(charset) for _ in range(length))
