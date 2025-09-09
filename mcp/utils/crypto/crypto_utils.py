#!/usr/bin/env python3
"""
MCP Crypto Utils
================

Cryptographic utilities for MCP servers.
"""

import secrets
from typing import Dict, List, Optional, Any, Union
from datetime import datetime, timedelta

try:
    from cryptography.fernet import Fernet
    from cryptography.hazmat.primitives import hashes
    from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
    from cryptography.hazmat.backends import default_backend
    CRYPTOGRAPHY_AVAILABLE = True
except ImportError:
    CRYPTOGRAPHY_AVAILABLE = False

from ..core import MCPValidationError


class MCPCryptoUtils:
    """Cryptography utilities."""

    @staticmethod
    def generate_key(length: int = 32) -> bytes:
        """Generate a random cryptographic key."""
        return secrets.token_bytes(length)

    @staticmethod
    def generate_key_hex(length: int = 32) -> str:
        """Generate a random cryptographic key as hex string."""
        return secrets.token_hex(length)

    @staticmethod
    def derive_key(password: str, salt: bytes, length: int = 32) -> bytes:
        """Derive a key from password using PBKDF2."""
        if not CRYPTOGRAPHY_AVAILABLE:
            raise MCPValidationError("Cryptography library not available")

        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=length,
            salt=salt,
            iterations=100000,
            backend=default_backend()
        )
        return kdf.derive(password.encode())

    @staticmethod
    def encrypt_data(data: bytes, key: bytes) -> bytes:
        """Encrypt data using Fernet (AES)."""
        if not CRYPTOGRAPHY_AVAILABLE:
            raise MCPValidationError("Cryptography library not available")

        f = Fernet(key)
        return f.encrypt(data)

    @staticmethod
    def decrypt_data(encrypted_data: bytes, key: bytes) -> bytes:
        """Decrypt data using Fernet (AES)."""
        if not CRYPTOGRAPHY_AVAILABLE:
            raise MCPValidationError("Cryptography library not available")

        try:
            f = Fernet(key)
            return f.decrypt(encrypted_data)
        except Exception as e:
            raise MCPValidationError(f"Decryption failed: {str(e)}")

    @staticmethod
    def encrypt_text(text: str, key: bytes) -> str:
        """Encrypt text and return as base64 string."""
        data = text.encode('utf-8')
        encrypted = MCPCryptoUtils.encrypt_data(data, key)
        return encrypted.decode('utf-8')

    @staticmethod
    def decrypt_text(encrypted_text: str, key: bytes) -> str:
        """Decrypt base64 encrypted text."""
        encrypted_data = encrypted_text.encode('utf-8')
        decrypted = MCPCryptoUtils.decrypt_data(encrypted_data, key)
        return decrypted.decode('utf-8')
