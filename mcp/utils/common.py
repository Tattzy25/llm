#!/usr/bin/env python3
"""
MCP Common Utils
================

Common utility functions and helpers for MCP servers.
Provides logging, configuration, timing, and other basic utilities.
"""

import os
import json
import time
import logging
import asyncio
import hashlib
import secrets
from typing import Dict, List, Optional, Any, Union, Callable
from datetime import datetime, timedelta
from pathlib import Path
from functools import wraps

from ..core import MCPValidationError


class MCPLogger:
    """Enhanced logging utility for MCP servers."""

    def __init__(self, name: str = "mcp", level: str = "INFO",
                 log_file: Optional[str] = None):
        self.logger = logging.getLogger(name)
        self.logger.setLevel(getattr(logging, level.upper()))

        # Remove existing handlers
        for handler in self.logger.handlers[:]:
            self.logger.removeHandler(handler)

        # Create formatter
        formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )

        # Console handler
        console_handler = logging.StreamHandler()
        console_handler.setFormatter(formatter)
        self.logger.addHandler(console_handler)

        # File handler if specified
        if log_file:
            file_handler = logging.FileHandler(log_file)
            file_handler.setFormatter(formatter)
            self.logger.addHandler(file_handler)

    def debug(self, message: str, **kwargs):
        """Log debug message."""
        self.logger.debug(message, extra=kwargs)

    def info(self, message: str, **kwargs):
        """Log info message."""
        self.logger.info(message, extra=kwargs)

    def warning(self, message: str, **kwargs):
        """Log warning message."""
        self.logger.warning(message, extra=kwargs)

    def error(self, message: str, **kwargs):
        """Log error message."""
        self.logger.error(message, extra=kwargs)

    def critical(self, message: str, **kwargs):
        """Log critical message."""
        self.logger.critical(message, extra=kwargs)


class MCPConfig:
    """Configuration management utility."""

    def __init__(self, config_file: Optional[str] = None):
        self.config = {}
        self.config_file = config_file
        if config_file and Path(config_file).exists():
            self.load_config()

    def load_config(self, config_file: Optional[str] = None) -> bool:
        """Load configuration from file."""
        try:
            file_path = config_file or self.config_file
            if not file_path:
                raise MCPValidationError("No config file specified")

            with open(file_path, 'r') as f:
                if file_path.endswith('.json'):
                    self.config = json.load(f)
                else:
                    # Simple key=value format
                    for line in f:
                        line = line.strip()
                        if line and not line.startswith('#'):
                            key, value = line.split('=', 1)
                            self.config[key.strip()] = value.strip()

            return True
        except Exception as e:
            raise MCPValidationError(f"Failed to load config: {str(e)}")

    def save_config(self, config_file: Optional[str] = None) -> bool:
        """Save configuration to file."""
        try:
            file_path = config_file or self.config_file
            if not file_path:
                raise MCPValidationError("No config file specified")

            Path(file_path).parent.mkdir(parents=True, exist_ok=True)

            with open(file_path, 'w') as f:
                if file_path.endswith('.json'):
                    json.dump(self.config, f, indent=2)
                else:
                    for key, value in self.config.items():
                        f.write(f"{key}={value}\n")

            return True
        except Exception as e:
            raise MCPValidationError(f"Failed to save config: {str(e)}")

    def get(self, key: str, default: Any = None) -> Any:
        """Get configuration value."""
        return self.config.get(key, default)

    def set(self, key: str, value: Any) -> None:
        """Set configuration value."""
        self.config[key] = value

    def update(self, updates: Dict[str, Any]) -> None:
        """Update multiple configuration values."""
        self.config.update(updates)


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


class MCPRateLimiter:
    """Rate limiting utility."""

    def __init__(self, max_calls: int, time_window: float):
        self.max_calls = max_calls
        self.time_window = time_window
        self.calls = []

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


class MCPFileUtils:
    """File utility functions."""

    @staticmethod
    def ensure_directory(path: str) -> bool:
        """Ensure directory exists, create if necessary."""
        try:
            Path(path).mkdir(parents=True, exist_ok=True)
            return True
        except Exception as e:
            raise MCPValidationError(f"Failed to create directory: {str(e)}")

    @staticmethod
    def get_file_size(path: str) -> int:
        """Get file size in bytes."""
        try:
            return Path(path).stat().st_size
        except Exception as e:
            raise MCPValidationError(f"Failed to get file size: {str(e)}")

    @staticmethod
    def read_file_chunked(path: str, chunk_size: int = 8192):
        """Read file in chunks."""
        try:
            with open(path, 'rb') as f:
                while chunk := f.read(chunk_size):
                    yield chunk
        except Exception as e:
            raise MCPValidationError(f"Failed to read file: {str(e)}")

    @staticmethod
    def calculate_file_hash(path: str, algorithm: str = 'sha256') -> str:
        """Calculate file hash."""
        try:
            hash_func = getattr(hashlib, algorithm)()
            with open(path, 'rb') as f:
                for chunk in iter(lambda: f.read(4096), b""):
                    hash_func.update(chunk)
            return hash_func.hexdigest()
        except Exception as e:
            raise MCPValidationError(f"Failed to calculate file hash: {str(e)}")


class MCPStringUtils:
    """String utility functions."""

    @staticmethod
    def truncate(text: str, max_length: int, suffix: str = "...") -> str:
        """Truncate string to maximum length."""
        if len(text) <= max_length:
            return text
        return text[:max_length - len(suffix)] + suffix

    @staticmethod
    def slugify(text: str) -> str:
        """Convert text to URL-friendly slug."""
        import re
        text = text.lower()
        text = re.sub(r'[^\w\s-]', '', text)
        text = re.sub(r'[\s_-]+', '-', text)
        return text.strip('-')

    @staticmethod
    def camel_to_snake(text: str) -> str:
        """Convert camelCase to snake_case."""
        import re
        s1 = re.sub('(.)([A-Z][a-z]+)', r'\1_\2', text)
        return re.sub('([a-z0-9])([A-Z])', r'\1_\2', s1).lower()

    @staticmethod
    def snake_to_camel(text: str) -> str:
        """Convert snake_case to camelCase."""
        components = text.split('_')
        return components[0] + ''.join(x.title() for x in components[1:])


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
    def generate_random_string(length: int = 8, charset: str = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789") -> str:
        """Generate random string."""
        return ''.join(secrets.choice(charset) for _ in range(length))
