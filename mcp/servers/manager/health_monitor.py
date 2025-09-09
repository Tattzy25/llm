#!/usr/bin/env python3
"""
MCP Health Monitor
Monitors system health and MCP server performance.
"""

import asyncio
import logging
from typing import Any, Dict

import psutil

logger = logging.getLogger(__name__)


class MCPHealthMonitor:
    """Monitors MCP system health and performance."""

    def __init__(self, config_manager, server_controller):
        self.config_manager = config_manager
        self.server_controller = server_controller

    async def get_system_health(self) -> Dict[str, Any]:
        """Get overall system health and statistics."""
        try:
            health_info = {
                'timestamp': asyncio.get_event_loop().time(),
                'total_servers': len(self.config_manager.get_all_servers()),
                'running_servers': len(self.server_controller.running_servers),
                'system_resources': await self._get_system_resources(),
                'server_processes': self.server_controller.get_process_info(),
                'health_status': self._calculate_health_status()
            }

            return health_info

        except Exception as e:
            logger.error(f"Failed to get system health: {str(e)}")
            return {'error': str(e)}

    async def _get_system_resources(self) -> Dict[str, Any]:
        """Get system resource usage."""
        try:
            # Get CPU usage (with a short interval for accuracy)
            cpu_percent = psutil.cpu_percent(interval=0.1)

            # Get memory information
            memory = psutil.virtual_memory()

            # Get disk usage
            disk = psutil.disk_usage('/')

            # Get network information
            network = psutil.net_io_counters()

            return {
                'cpu_percent': cpu_percent,
                'cpu_count': psutil.cpu_count(),
                'cpu_count_logical': psutil.cpu_count(logical=True),
                'memory_total': memory.total,
                'memory_available': memory.available,
                'memory_percent': memory.percent,
                'memory_used': memory.used,
                'disk_total': disk.total,
                'disk_free': disk.free,
                'disk_percent': disk.percent,
                'network_bytes_sent': network.bytes_sent,
                'network_bytes_recv': network.bytes_recv,
                'network_packets_sent': network.packets_sent,
                'network_packets_recv': network.packets_recv
            }

        except Exception as e:
            logger.error(f"Failed to get system resources: {e}")
            return {'error': str(e)}

    def _calculate_health_status(self) -> str:
        """Calculate overall health status."""
        try:
            system_resources = asyncio.run(self._get_system_resources())
            running_servers = len(self.server_controller.running_servers)
            total_servers = len(self.config_manager.get_all_servers())

            # Check resource thresholds
            cpu_ok = system_resources.get('cpu_percent', 100) < 90
            memory_ok = system_resources.get('memory_percent', 100) < 90
            disk_ok = system_resources.get('disk_percent', 100) < 95

            # Check server availability
            server_ratio = running_servers / total_servers if total_servers > 0 else 0
            servers_ok = server_ratio >= 0.8  # At least 80% of servers running

            if cpu_ok and memory_ok and disk_ok and servers_ok:
                return 'healthy'
            elif cpu_ok and memory_ok and servers_ok:
                return 'warning'  # Disk space issue
            elif servers_ok:
                return 'degraded'  # Resource issues
            else:
                return 'critical'  # Major issues

        except Exception as e:
            logger.error(f"Failed to calculate health status: {e}")
            return 'unknown'

    async def get_server_health(self, server_name: str = None) -> Dict[str, Any]:
        """Get health information for specific servers."""
        try:
            if server_name:
                return await self._get_single_server_health(server_name)
            else:
                return await self._get_all_servers_health()

        except Exception as e:
            logger.error(f"Failed to get server health: {str(e)}")
            return {'error': str(e)}

    async def _get_single_server_health(self, server_name: str) -> Dict[str, Any]:
        """Get health for a specific server."""
        server_config = self.config_manager.get_server_config(server_name)
        if not server_config:
            return {'error': f'Server {server_name} not found'}

        is_running = server_name in self.server_controller.running_servers

        health_info = {
            'server': server_name,
            'running': is_running,
            'type': server_config['type'],
            'status': 'healthy' if is_running else 'stopped'
        }

        if is_running:
            server_info = self.server_controller.running_servers[server_name]
            health_info.update({
                'pid': server_info.get('pid'),
                'uptime': asyncio.get_event_loop().time() - server_info.get('start_time', 0),
                'process_info': self.server_controller.get_process_info().get(server_config['name'], {})
            })

        return health_info

    async def _get_all_servers_health(self) -> Dict[str, Any]:
        """Get health for all servers."""
        all_servers = self.config_manager.get_all_servers()
        server_health = {}

        for server_name in all_servers.keys():
            server_health[server_name] = await self._get_single_server_health(server_name)

        healthy_count = sum(1 for s in server_health.values() if s.get('status') == 'healthy')
        total_count = len(server_health)

        return {
            'servers': server_health,
            'summary': {
                'total_servers': total_count,
                'healthy_servers': healthy_count,
                'unhealthy_servers': total_count - healthy_count,
                'health_percentage': (healthy_count / total_count * 100) if total_count > 0 else 0
            }
        }

    async def monitor_servers(self, interval: int = 60) -> None:
        """Continuously monitor server health."""
        logger.info(f"Starting server health monitoring (interval: {interval}s)")

        while True:
            try:
                health = await self.get_system_health()
                status = health.get('health_status', 'unknown')

                if status == 'critical':
                    logger.critical(f"Critical health status detected: {health}")
                elif status == 'degraded':
                    logger.warning(f"Degraded health status: {health}")
                elif status == 'warning':
                    logger.info(f"Health warning: {health}")

                await asyncio.sleep(interval)

            except Exception as e:
                logger.error(f"Health monitoring error: {e}")
                await asyncio.sleep(interval)

    def get_health_metrics(self) -> Dict[str, Any]:
        """Get health metrics for monitoring systems."""
        try:
            # This would typically integrate with monitoring systems like Prometheus
            return {
                'metrics': {
                    'mcp_servers_total': len(self.config_manager.get_all_servers()),
                    'mcp_servers_running': len(self.server_controller.running_servers),
                    'mcp_servers_stopped': len(self.config_manager.get_all_servers()) - len(self.server_controller.running_servers)
                },
                'labels': {
                    'service': 'mcp-server-manager',
                    'version': '1.0.0'
                }
            }
        except Exception as e:
            logger.error(f"Failed to get health metrics: {e}")
            return {'error': str(e)}
