#!/usr/bin/env python3
"""Sliding-window rate limiter (in-memory)."""

from __future__ import annotations

import time
from collections import deque
from typing import Deque, Dict

from ...core.utils.validation import MCPValidationError


class SlidingRateLimiter:
	def __init__(self, max_events: int, window_seconds: int) -> None:
		self.max_events = max_events
		self.window = window_seconds
		self._buckets: Dict[str, Deque[float]] = {}

	def allow(self, key: str) -> bool:
		now = time.time()
		q = self._buckets.setdefault(key, deque())
		# evict old
		cutoff = now - self.window
		while q and q[0] < cutoff:
			q.popleft()
		if len(q) >= self.max_events:
			return False
		q.append(now)
		return True

	def check(self, key: str) -> None:
		if not self.allow(key):
			raise MCPValidationError("Rate limit exceeded", code="rate_limit")
