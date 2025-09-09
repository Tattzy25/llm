#!/usr/bin/env python3
"""
MCP Date Utils
==============

Date and time utility functions for MCP servers.
"""

from datetime import datetime, timedelta
from typing import List

from mcp.core.utils.validation import MCPValidationError


class MCPDateUtils:
    """Date and time utility functions."""

    @staticmethod
    def parse_datetime(date_str: str, format_str: str = "%Y-%m-%d %H:%M:%S") -> datetime:
        """Parse datetime string."""
        try:
            return datetime.strptime(date_str, format_str)
        except Exception as e:
            raise MCPValidationError(f"Failed to parse datetime: {str(e)}")

    @staticmethod
    def format_datetime(dt: datetime, format_str: str = "%Y-%m-%d %H:%M:%S") -> str:
        """Format datetime to string."""
        try:
            return dt.strftime(format_str)
        except Exception as e:
            raise MCPValidationError(f"Failed to format datetime: {str(e)}")

    @staticmethod
    def add_business_days(start_date: datetime, days: int) -> datetime:
        """Add business days to date (excluding weekends)."""
        result = start_date
        while days > 0:
            result += timedelta(days=1)
            if result.weekday() < 5:  # Monday to Friday
                days -= 1
        return result

    @staticmethod
    def get_date_range(start_date: datetime, end_date: datetime) -> List[datetime]:
        """Get list of dates in range."""
        dates = []
        current = start_date
        while current <= end_date:
            dates.append(current)
            current += timedelta(days=1)
        return dates
