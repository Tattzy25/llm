#!/usr/bin/env python3
"""Bounded retry helpers with jittered backoff."""

from __future__ import annotations

import random
import time
from typing import Callable, TypeVar, Iterable

T = TypeVar("T")


def retry(
	fn: Callable[[], T],
	*,
	retries: int = 3,
	base_delay: float = 0.2,
	max_delay: float = 2.0,
	retry_on: Iterable[type[Exception]] = (Exception,),
) -> T:
	"""Run fn with limited retries and exponential backoff with jitter."""
	attempt = 0
	while True:
		try:
			return fn()
		except tuple(retry_on) as e:
			attempt += 1
			if attempt > retries:
				raise
			delay = min(max_delay, base_delay * (2 ** (attempt - 1)))
			delay *= 0.8 + random.random() * 0.4  # jitter
			time.sleep(delay)
