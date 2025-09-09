#!/usr/bin/env python3
"""
MCP Server Manager Core
Handles starting, stopping, and managing MCP server processes.
"""

import asyncio
import logging
import os
from typing import Any, Dict, Optional

import psutil
import requests

from .config import MCPConfigManager

logger = logging.getLogger(__name__)


class MCPServerController:
    """Controls MCP server lifecycle and process management."""

    def __init__(self, config_manager: MCPConfigManager):
        self.config_manager = config_manager
        self.running_servers = {}
        self.server_processes = {}

    async def start_server(self, server_name: str) -> Dict[str, Any]:
        """Start a specific MCP server."""
        try:
            server_config = self.config_manager.get_server_config(server_name)
            if not server_config:
                return {'error': f'Server {server_name} not found in configuration'}

            if server_name in self.running_servers:
                return {'status': 'already_running', 'server': server_name}

            # Start server based on type
            if server_config['type'] == 'desktop':
                result = await self._start_desktop_server(server_config)
            elif server_config['type'] == 'remote':
                result = await self._start_remote_server(server_config)
            else:
                return {'error': f'Unsupported server type: {server_config["type"]}'}

            if result.get('success'):
                self.running_servers[server_name] = {
                    **server_config,
                    **result
                }
                logger.info(f"Started MCP server: {server_name}")

            return result

        except Exception as e:
            logger.error(f"Failed to start server {server_name}: {str(e)}")
            return {'error': str(e), 'server': server_name}

    async def _start_desktop_server(self, server_config: Dict[str, Any]) -> Dict[str, Any]:
        """Start a desktop MCP server process."""
        try:
            cmd = [server_config['command']] + server_config.get('args', [])
            env = os.environ.copy()
            env.update(server_config.get('env', {}))

            # Start process
            process = await asyncio.create_subprocess_exec(
                *cmd,
                env=env,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
                cwd=os.getcwd()
            )

            self.server_processes[server_config['name']] = process

            # Wait for server to start
            await asyncio.sleep(2)

            if process.returncode is None:  # Process is still running
                return {
                    'success': True,
                    'server': server_config['name'],
                    'type': 'desktop',
                    'pid': process.pid,
                    'status': 'running'
                }
            else:
                stdout, stderr = await process.communicate()
                return {
                    'success': False,
                    'error': f'Process exited with code {process.returncode}',
                    'stdout': stdout.decode(),
                    'stderr': stderr.decode()
                }

        except Exception as e:
            return {'success': False, 'error': str(e)}

    async def _start_remote_server(self, server_config: Dict[str, Any]) -> Dict[str, Any]:
        """Start/connect to a remote MCP server."""
        try:
            host = server_config.get('host', 'digitalhustlelab.com')
            port = server_config.get('port', 3000)

            # Test connection
            try:
                response = requests.get(f"http://{host}:{port}/health", timeout=5)
                if response.status_code == 200:
                    return {
                        'success': True,
                        'server': server_config['name'],
                        'type': 'remote',
                        'host': host,
                        'port': port,
                        'status': 'running'
                    }
                else:
                    return {
                        'success': False,
                        'error': f'Server responded with status {response.status_code}'
                    }
            except requests.exceptions.RequestException:
                return {
                    'success': False,
                    'error': 'Server not responding',
                    'host': host,
                    'port': port
                }

        except Exception as e:
            return {'success': False, 'error': str(e)}

    async def stop_server(self, server_name: str) -> Dict[str, Any]:
        """Stop a specific MCP server."""
        try:
            if server_name not in self.running_servers:
                return {'error': f'Server {server_name} is not running'}

            server_config = self.running_servers[server_name]

            if server_config['type'] == 'desktop' and server_config['name'] in self.server_processes:
                process = self.server_processes[server_config['name']]
                if process.returncode is None:
                    process.terminate()
                    try:
                        await asyncio.wait_for(process.wait(), timeout=10)
                    except asyncio.TimeoutError:
                        process.kill()
                        await process.wait()

                del self.server_processes[server_config['name']]

            elif server_config['type'] == 'remote':
                # For remote servers, try to call shutdown endpoint
                host = server_config.get('host', 'digitalhustlelab.com')
                port = server_config.get('port', 3000)
                try:
                    requests.post(f"http://{host}:{port}/shutdown", timeout=5)
                except:
                    pass  # Ignore shutdown request failures

            del self.running_servers[server_name]
            logger.info(f"Stopped MCP server: {server_name}")

            return {
                'success': True,
                'server': server_name,
                'status': 'stopped'
            }

        except Exception as e:
            logger.error(f"Failed to stop server {server_name}: {str(e)}")
            return {'error': str(e), 'server': server_name}

    def get_server_status(self, server_name: str = None) -> Dict[str, Any]:
        """Get status of MCP servers."""
        try:
            if server_name:
                server_config = self.config_manager.get_server_config(server_name)
                if not server_config:
                    return {'error': f'Server {server_name} not found'}

                is_running = server_name in self.running_servers

                status_info = {
                    'name': server_name,
                    'type': server_config['type'],
                    'running': is_running,
                    'config': server_config
                }

                if is_running:
                    status_info.update(self.running_servers[server_name])

                return status_info

            else:
                # Return status of all servers
                all_servers = self.config_manager.get_all_servers()
                all_status = {}

                for name, config in all_servers.items():
                    all_status[name] = {
                        'name': name,
                        'type': config['type'],
                        'running': name in self.running_servers,
                        'config': config
                    }
                    if name in self.running_servers:
                        all_status[name].update(self.running_servers[name])

                return {
                    'servers': all_status,
                    'total_servers': len(all_servers),
                    'running_servers': len(self.running_servers)
                }

        except Exception as e:
            logger.error(f"Failed to get server status: {str(e)}")
            return {'error': str(e)}

    def get_running_servers(self) -> Dict[str, Any]:
        """Get information about currently running servers."""
        return {
            'running_servers': list(self.running_servers.keys()),
            'server_count': len(self.running_servers),
            'server_details': self.running_servers
        }

    def get_process_info(self) -> Dict[str, Any]:
        """Get process information for running servers."""
        process_info = {}

        for name, process in self.server_processes.items():
            if process.returncode is None:
                try:
                    proc = psutil.Process(process.pid)
                    process_info[name] = {
                        'pid': process.pid,
                        'cpu_percent': proc.cpu_percent(),
                        'memory_percent': proc.memory_percent(),
                        'status': 'running'
                    }
                except psutil.NoSuchProcess:
                    process_info[name] = {'status': 'process_not_found'}
            else:
                process_info[name] = {
                    'returncode': process.returncode,
                    'status': 'stopped'
                }

        return process_info
