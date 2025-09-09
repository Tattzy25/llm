#!/usr/bin/env python3
"""Network helpers with safe defaults (timeouts, size limits)."""

from __future__ import annotations

import httpx
from typing import Any, Dict, Optional

from ..core.utils.validation import MCPValidationError, ensure_max_bytes


DEFAULT_TIMEOUT = httpx.Timeout(10.0, connect=5.0)
MAX_BYTES = 2_000_000  # 2MB


async def get_json(url: str, *, headers: Optional[Dict[str, str]] = None, timeout: httpx.Timeout = DEFAULT_TIMEOUT) -> Any:
	async with httpx.AsyncClient(timeout=timeout, follow_redirects=True) as client:
		resp = await client.get(url, headers=headers)
		content = resp.content
		ensure_max_bytes(content, max_bytes=MAX_BYTES)
		try:
			resp.raise_for_status()
		except httpx.HTTPError as e:
			raise MCPValidationError(f"HTTP GET failed: {e}", code="http_error")
		return resp.json()


async def post_json(url: str, data: Any, *, headers: Optional[Dict[str, str]] = None, timeout: httpx.Timeout = DEFAULT_TIMEOUT) -> Any:
	h = {"Content-Type": "application/json"}
	if headers:
		h.update(headers)
	async with httpx.AsyncClient(timeout=timeout, follow_redirects=True) as client:
		resp = await client.post(url, json=data, headers=h)
		content = resp.content
		ensure_max_bytes(content, max_bytes=MAX_BYTES)
		try:
			resp.raise_for_status()
		except httpx.HTTPError as e:
			raise MCPValidationError(f"HTTP POST failed: {e}", code="http_error")
		return resp.json()

