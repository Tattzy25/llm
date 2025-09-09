#!/usr/bin/env python3
"""
MCP Network Utils
=================

Network utilities for MCP servers.
Provides HTTP clients, WebSocket clients, and network management tools.
"""

import socket
import asyncio
import aiohttp
import requests
import json
from typing import Dict, List, Optional, Any, Union
from urllib.parse import urlparse, urljoin
from concurrent.futures import ThreadPoolExecutor

from ..core import MCPValidationError


class MCPNetworkClient:
    """Basic network client utility."""

    def __init__(self, timeout: float = 30.0, max_retries: int = 3):
        self.timeout = timeout
        self.max_retries = max_retries
        self.session = None

    def __enter__(self):
        self.session = requests.Session()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            self.session.close()

    def get(self, url: str, headers: Optional[Dict[str, str]] = None,
            params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Make GET request."""
        return self._request("GET", url, headers=headers, params=params)

    def post(self, url: str, data: Optional[Dict[str, Any]] = None,
             headers: Optional[Dict[str, str]] = None,
             json_data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Make POST request."""
        return self._request("POST", url, headers=headers, data=data, json=json_data)

    def put(self, url: str, data: Optional[Dict[str, Any]] = None,
            headers: Optional[Dict[str, str]] = None,
            json_data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Make PUT request."""
        return self._request("PUT", url, headers=headers, data=data, json=json_data)

    def delete(self, url: str, headers: Optional[Dict[str, str]] = None) -> Dict[str, Any]:
        """Make DELETE request."""
        return self._request("DELETE", url, headers=headers)

    def _request(self, method: str, url: str, headers: Optional[Dict[str, str]] = None,
                 data: Optional[Dict[str, Any]] = None,
                 json: Optional[Dict[str, Any]] = None,
                 params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Make HTTP request with retry logic."""
        if not self.session:
            raise MCPValidationError("Network client not properly initialized")

        for attempt in range(self.max_retries):
            try:
                response = self.session.request(
                    method=method,
                    url=url,
                    headers=headers,
                    data=data,
                    json=json,
                    params=params,
                    timeout=self.timeout
                )

                return {
                    "status_code": response.status_code,
                    "headers": dict(response.headers),
                    "content": response.text,
                    "json": response.json() if response.headers.get("content-type", "").startswith("application/json") else None,
                    "url": response.url,
                    "elapsed": response.elapsed.total_seconds(),
                    "success": response.status_code < 400
                }
            except Exception as e:
                if attempt == self.max_retries - 1:
                    raise MCPValidationError(f"Request failed after {self.max_retries} attempts: {str(e)}")
                continue


class MCPWebSocketClient:
    """WebSocket client utility."""

    def __init__(self, url: str, headers: Optional[Dict[str, str]] = None):
        self.url = url
        self.headers = headers or {}
        self.websocket = None

    async def connect(self) -> None:
        """Connect to WebSocket."""
        try:
            self.websocket = await aiohttp.ClientSession().ws_connect(
                self.url,
                headers=self.headers
            )
        except Exception as e:
            raise MCPValidationError(f"Failed to connect to WebSocket: {str(e)}")

    async def send(self, message: Union[str, Dict[str, Any]]) -> None:
        """Send message to WebSocket."""
        if not self.websocket:
            raise MCPValidationError("WebSocket not connected")

        if isinstance(message, dict):
            message = json.dumps(message)

        await self.websocket.send_str(message)

    async def receive(self) -> Optional[Union[str, Dict[str, Any]]]:
        """Receive message from WebSocket."""
        if not self.websocket:
            raise MCPValidationError("WebSocket not connected")

        try:
            msg = await self.websocket.receive()

            if msg.type == aiohttp.WSMsgType.TEXT:
                try:
                    return json.loads(msg.data)
                except json.JSONDecodeError:
                    return msg.data
            elif msg.type == aiohttp.WSMsgType.ERROR:
                raise MCPValidationError(f"WebSocket error: {self.websocket.exception()}")
            elif msg.type == aiohttp.WSMsgType.CLOSED:
                return None

        except Exception as e:
            raise MCPValidationError(f"Failed to receive WebSocket message: {str(e)}")

    async def close(self) -> None:
        """Close WebSocket connection."""
        if self.websocket:
            await self.websocket.close()
            self.websocket = None


class MCPHTTPClient:
    """Advanced HTTP client with connection pooling."""

    def __init__(self, pool_size: int = 10, timeout: float = 30.0):
        self.pool_size = pool_size
        self.timeout = timeout
        self.session = None

    async def __aenter__(self):
        connector = aiohttp.TCPConnector(limit=self.pool_size, limit_per_host=self.pool_size//2)
        self.session = aiohttp.ClientSession(connector=connector)
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()

    async def get(self, url: str, headers: Optional[Dict[str, str]] = None,
                  params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Make async GET request."""
        return await self._request("GET", url, headers=headers, params=params)

    async def post(self, url: str, data: Optional[Dict[str, Any]] = None,
                   headers: Optional[Dict[str, str]] = None,
                   json_data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Make async POST request."""
        return await self._request("POST", url, headers=headers, data=data, json=json_data)

    async def _request(self, method: str, url: str, headers: Optional[Dict[str, str]] = None,
                      data: Optional[Dict[str, Any]] = None,
                      json: Optional[Dict[str, Any]] = None,
                      params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Make async HTTP request."""
        if not self.session:
            raise MCPValidationError("HTTP client not properly initialized")

        try:
            async with self.session.request(
                method=method,
                url=url,
                headers=headers,
                data=data,
                json=json,
                params=params,
                timeout=self.timeout
            ) as response:

                content = await response.text()
                json_content = None
                if response.headers.get("content-type", "").startswith("application/json"):
                    try:
                        json_content = json.loads(content)
                    except json.JSONDecodeError:
                        pass

                return {
                    "status_code": response.status,
                    "headers": dict(response.headers),
                    "content": content,
                    "json": json_content,
                    "url": str(response.url),
                    "elapsed": None,  # aiohttp doesn't provide elapsed time easily
                    "success": response.status < 400
                }
        except Exception as e:
            raise MCPValidationError(f"HTTP request failed: {str(e)}")


class MCPProxyManager:
    """Proxy management utility."""

    def __init__(self):
        self.proxies = {}

    def add_proxy(self, name: str, proxy_url: str, proxy_type: str = "http") -> None:
        """Add a proxy configuration."""
        self.proxies[name] = {
            "url": proxy_url,
            "type": proxy_type
        }

    def get_proxy(self, name: str) -> Optional[Dict[str, str]]:
        """Get proxy configuration for requests library."""
        if name not in self.proxies:
            return None

        proxy = self.proxies[name]
        return {proxy["type"]: proxy["url"]}

    def get_random_proxy(self) -> Optional[Dict[str, str]]:
        """Get a random proxy configuration."""
        if not self.proxies:
            return None

        import random
        name = random.choice(list(self.proxies.keys()))
        return self.get_proxy(name)

    def test_proxy(self, name: str, test_url: str = "http://httpbin.org/ip") -> Dict[str, Any]:
        """Test proxy connectivity."""
        proxy = self.get_proxy(name)
        if not proxy:
            raise MCPValidationError(f"Proxy '{name}' not found")

        try:
            response = requests.get(test_url, proxies=proxy, timeout=10)
            return {
                "success": True,
                "status_code": response.status_code,
                "response_time": response.elapsed.total_seconds(),
                "ip_address": response.json().get("origin") if response.status_code == 200 else None
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }


class MCPConnectionPool:
    """Connection pool management."""

    def __init__(self, max_connections: int = 10):
        self.max_connections = max_connections
        self.executor = ThreadPoolExecutor(max_workers=max_connections)
        self.active_connections = 0

    def submit_task(self, func, *args, **kwargs):
        """Submit task to connection pool."""
        if self.active_connections >= self.max_connections:
            raise MCPValidationError("Connection pool exhausted")

        self.active_connections += 1
        future = self.executor.submit(func, *args, **kwargs)

        # Decrement counter when task completes
        def decrement_counter(fut):
            self.active_connections -= 1

        future.add_done_callback(decrement_counter)
        return future

    def shutdown(self) -> None:
        """Shutdown connection pool."""
        self.executor.shutdown(wait=True)


class MCPDNSResolver:
    """DNS resolution utility."""

    @staticmethod
    def resolve_hostname(hostname: str) -> List[str]:
        """Resolve hostname to IP addresses."""
        try:
            return socket.gethostbyname_ex(hostname)[2]
        except socket.gaierror as e:
            raise MCPValidationError(f"DNS resolution failed: {str(e)}")

    @staticmethod
    def reverse_lookup(ip_address: str) -> str:
        """Perform reverse DNS lookup."""
        try:
            return socket.gethostbyaddr(ip_address)[0]
        except socket.herror as e:
            raise MCPValidationError(f"Reverse DNS lookup failed: {str(e)}")

    @staticmethod
    def get_domain_info(domain: str) -> Dict[str, Any]:
        """Get domain information."""
        try:
            parsed = urlparse(f"http://{domain}")
            hostname = parsed.hostname or domain

            info = {
                "domain": domain,
                "hostname": hostname,
                "ip_addresses": socket.gethostbyname_ex(hostname)[2]
            }

            # Get additional info if available
            try:
                hostname_info = socket.gethostbyname_ex(hostname)
                info["aliases"] = hostname_info[1]
                info["canonical_name"] = hostname_info[0]
            except:
                pass

            return info
        except Exception as e:
            raise MCPValidationError(f"Failed to get domain info: {str(e)}")


class MCPPortScanner:
    """Port scanning utility."""

    @staticmethod
    def scan_ports(host: str, ports: List[int], timeout: float = 1.0) -> Dict[int, bool]:
        """Scan ports on a host."""
        results = {}

        for port in ports:
            try:
                sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                sock.settimeout(timeout)
                result = sock.connect_ex((host, port))
                sock.close()

                results[port] = result == 0
            except:
                results[port] = False

        return results

    @staticmethod
    def find_open_ports(host: str, start_port: int = 1, end_port: int = 1024) -> List[int]:
        """Find open ports in a range."""
        open_ports = []
        ports = list(range(start_port, end_port + 1))

        for port in ports:
            try:
                sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                sock.settimeout(0.5)
                result = sock.connect_ex((host, port))
                sock.close()

                if result == 0:
                    open_ports.append(port)
            except:
                continue

        return open_ports


class MCPBandwidthMonitor:
    """Bandwidth monitoring utility."""

    def __init__(self):
        self.bytes_sent = 0
        self.bytes_received = 0
        self.start_time = None

    def start_monitoring(self) -> None:
        """Start bandwidth monitoring."""
        self.start_time = asyncio.get_event_loop().time()
        self.bytes_sent = 0
        self.bytes_received = 0

    def record_bytes_sent(self, bytes_count: int) -> None:
        """Record bytes sent."""
        self.bytes_sent += bytes_count

    def record_bytes_received(self, bytes_count: int) -> None:
        """Record bytes received."""
        self.bytes_received += bytes_count

    def get_bandwidth_stats(self) -> Dict[str, Any]:
        """Get bandwidth statistics."""
        if self.start_time is None:
            raise MCPValidationError("Monitoring not started")

        current_time = asyncio.get_event_loop().time()
        elapsed = current_time - self.start_time

        if elapsed == 0:
            return {
                "bytes_sent": self.bytes_sent,
                "bytes_received": self.bytes_received,
                "total_bytes": self.bytes_sent + self.bytes_received,
                "send_rate": 0,
                "receive_rate": 0,
                "total_rate": 0,
                "elapsed_seconds": elapsed
            }

        send_rate = self.bytes_sent / elapsed
        receive_rate = self.bytes_received / elapsed
        total_rate = (self.bytes_sent + self.bytes_received) / elapsed

        return {
            "bytes_sent": self.bytes_sent,
            "bytes_received": self.bytes_received,
            "total_bytes": self.bytes_sent + self.bytes_received,
            "send_rate": send_rate,
            "receive_rate": receive_rate,
            "total_rate": total_rate,
            "elapsed_seconds": elapsed
        }
