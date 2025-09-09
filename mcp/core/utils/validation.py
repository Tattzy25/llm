#!/usr/bin/env python3
"""
Core validation primitives used across MCP servers.
Small, dependency-light utilities and a common error type.
"""

from __future__ import annotations

from typing import Any, Iterable


class MCPValidationError(Exception):
	"""Deterministic, client-safe validation error."""

	def __init__(self, message: str, *, code: str | None = None) -> None:
		super().__init__(message)
		self.code = code or "validation_error"


def require_fields(data: dict[str, Any], required: Iterable[str]) -> None:
	"""Ensure required keys exist and are non-empty."""
	missing = [k for k in required if k not in data or data[k] in (None, "")]
	if missing:
		raise MCPValidationError(f"Missing required fields: {', '.join(missing)}", code="missing_fields")


def bound_length(value: str, *, max_len: int = 10_000) -> str:
	"""Trim a string to a max length to avoid log/response bloat."""
	if not isinstance(value, str):
		raise MCPValidationError("Expected string value", code="type_error")
	return value if len(value) <= max_len else value[:max_len]


def ensure_max_bytes(data: bytes, *, max_bytes: int = 2_000_000) -> None:
	"""Raise if payload too large for policy."""
	if len(data) > max_bytes:
		raise MCPValidationError("Payload too large", code="payload_too_large")
