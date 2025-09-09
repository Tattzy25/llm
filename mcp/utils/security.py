#!/usr/bin/env python3
"""Security utilities: JWT validation, CORS/IP checks, and log sanitization."""

from __future__ import annotations

from typing import Iterable, Optional

from ..core.utils.validation import MCPValidationError
from .crypto.jwt_utils import MCPJWTUtils


REDACTED = "[REDACTED]"


def sanitize_log_value(value: Optional[str]) -> str:
	if not value:
		return ""
	if len(value) > 128:
		return value[:64] + "..." + value[-16:]
	return value


def check_cors_origin(origin: str, allowed_origins: Iterable[str]) -> bool:
	if not origin:
		return False
	return origin in allowed_origins


def is_ip_allowed(ip: str, allowlist: Iterable[str] | None = None, denylist: Iterable[str] | None = None) -> bool:
	if denylist and ip in denylist:
		return False
	if allowlist:
		return ip in allowlist
	return True


def require_jwt(token: str | None, secret: str) -> dict:
	if not token:
		raise MCPValidationError("Missing authorization token", code="unauthorized")
	payload = MCPJWTUtils.verify_token(token, secret)
	return payload
