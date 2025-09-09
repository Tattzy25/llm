#!/usr/bin/env python3
"""
MCP Hash Utils
==============

Hashing utilities for MCP servers.
"""

import hmac
import hashlib
from typing import Dict, List, Optional, Any, Union

from .crypto_utils import MCPCryptoUtils
from ...core.utils.validation import MCPValidationError


class MCPHashUtils:
    """Hashing utilities."""

    @staticmethod
    def hash_password(password: str, salt: Optional[bytes] = None) -> Dict[str, str]:
        """Hash password with salt using PBKDF2."""
        if salt is None:
            salt = MCPCryptoUtils.generate_key(16)

        key = MCPCryptoUtils.derive_key(password, salt, 32)

        return {
            "hash": key.hex(),
            "salt": salt.hex(),
            "algorithm": "PBKDF2-SHA256"
        }

    @staticmethod
    def verify_password(password: str, hash_hex: str, salt_hex: str) -> bool:
        """Verify password against hash."""
        try:
            salt = bytes.fromhex(salt_hex)
            key = MCPCryptoUtils.derive_key(password, salt, 32)
            return hmac.compare_digest(key.hex(), hash_hex)
        except Exception:
            return False

    @staticmethod
    def hash_file(file_path: str, algorithm: str = 'sha256') -> str:
        """Calculate file hash."""
        hash_func = getattr(hashlib, algorithm)()

        try:
            with open(file_path, 'rb') as f:
                for chunk in iter(lambda: f.read(4096), b""):
                    hash_func.update(chunk)
            return hash_func.hexdigest()
        except Exception as e:
            raise MCPValidationError(f"Failed to hash file: {str(e)}")

    @staticmethod
    def hash_data(data: Union[str, bytes], algorithm: str = 'sha256') -> str:
        """Calculate data hash."""
        if isinstance(data, str):
            data = data.encode('utf-8')

        hash_func = getattr(hashlib, algorithm)()
        hash_func.update(data)
        return hash_func.hexdigest()

    @staticmethod
    def generate_checksum(data: Union[str, bytes]) -> str:
        """Generate MD5 checksum for data integrity."""
        return MCPHashUtils.hash_data(data, 'md5')
