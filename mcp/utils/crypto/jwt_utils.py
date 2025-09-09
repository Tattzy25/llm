#!/usr/bin/env python3
"""
MCP JWT Utils
=============

JWT utilities for MCP servers.
"""

import jwt
import time
from datetime import datetime, timedelta
from typing import Dict, Optional, Any, Union

from .crypto_utils import MCPCryptoUtils
from mcp.core.utils.validation import MCPValidationError


class MCPJWTUtils:
    """JWT utilities for authentication."""

    ALGORITHM = "HS256"

    @staticmethod
    def generate_token(payload: Dict[str, Any], secret: str, expires_in: int = 3600) -> str:
        """Generate JWT token."""
        now = datetime.utcnow()
        payload_copy = payload.copy()

        payload_copy.update({
            "iat": int(now.timestamp()),
            "exp": int((now + timedelta(seconds=expires_in)).timestamp())
        })

        try:
            token = jwt.encode(payload_copy, secret, algorithm=MCPJWTUtils.ALGORITHM)
            return token
        except Exception as e:
            raise MCPValidationError(f"Failed to generate JWT token: {str(e)}")

    @staticmethod
    def verify_token(token: str, secret: str) -> Dict[str, Any]:
        """Verify and decode JWT token."""
        try:
            payload = jwt.decode(token, secret, algorithms=[MCPJWTUtils.ALGORITHM])

            # Check expiration
            if payload.get("exp", 0) < time.time():
                raise MCPValidationError("Token has expired")

            return payload
        except jwt.ExpiredSignatureError:
            raise MCPValidationError("Token has expired")
        except jwt.InvalidTokenError:
            raise MCPValidationError("Invalid token")
        except Exception as e:
            raise MCPValidationError(f"Failed to verify token: {str(e)}")

    @staticmethod
    def refresh_token(token: str, secret: str, expires_in: int = 3600) -> str:
        """Refresh JWT token."""
        payload = MCPJWTUtils.verify_token(token, secret)

        # Remove old timestamps
        payload.pop("iat", None)
        payload.pop("exp", None)

        return MCPJWTUtils.generate_token(payload, secret, expires_in)

    @staticmethod
    def get_token_expiry(token: str) -> Optional[datetime]:
        """Get token expiry datetime."""
        try:
            # Decode without verification to get payload
            header = jwt.get_unverified_header(token)
            payload = jwt.decode(token, options={"verify_signature": False})

            exp = payload.get("exp")
            if exp:
                return datetime.fromtimestamp(exp)
        except Exception:
            pass

        return None

    @staticmethod
    def is_token_expired(token: str) -> bool:
        """Check if token is expired."""
        expiry = MCPJWTUtils.get_token_expiry(token)
        if expiry:
            return datetime.utcnow() > expiry
        return True
