#!/usr/bin/env python3
"""
MCP File Utils
==============

File utility functions for MCP servers.
"""

import hashlib
from pathlib import Path
from typing import Iterator, Union

from mcp.core.utils.validation import MCPValidationError


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
    def read_file_chunked(path: str, chunk_size: int = 8192) -> Iterator[bytes]:
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
