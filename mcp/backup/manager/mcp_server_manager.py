#!/usr/bin/env python3
"""
MCP Server Management System
Master builder for orchestrating multiple MCP servers and managing connections.
"""

import asyncio
import json
import logging
import os
import subprocess
import sys
from typing import Any, Dict, List, Optional, Union
from pathlib import Path

import psutil
import requests
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from mcp.server import FastMCP

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class MCPServerManager:
    """Master MCP server manager for orchestrating multiple MCP servers."""

    def __init__(self, config_path: str = "servers/mcp-config-expanded.json"):
        self.config_path = config_path
        self.config = self._load_config()
        self.running_servers = {}
        self.server_processes = {}
        self.server_connections = {}

    def _load_config(self) -> Dict[str, Any]:
        """Load MCP server configuration."""
        try:
            with open(self.config_path, 'r') as f:
                return json.load(f)
        except FileNotFoundError:
            logger.warning(f"Config file {self.config_path} not found, using default config")
            return self._get_default_config()
        except json.JSONDecodeError as e:
            logger.error(f"Invalid JSON in config file: {e}")
            return self._get_default_config()

    def _get_default_config(self) -> Dict[str, Any]:
        """Get default MCP server configuration."""
        return {
            "mcpServers": {
                "desktop": {
                    "name": "Desktop Server",
                    "type": "desktop",
                    "transport": "stdio",
                    "command": "python",
                    "args": ["servers/desktop_server.py"],
                    "tools": ["file_operations", "system_info"]
                }
            },
            "mcpVersion": "2024-11-05",
            "globalConfig": {
                "maxConcurrentConnections": 10,
                "defaultTimeout": 30,
                "enableLogging": True
            }
        }

    async def start_server(self, server_name: str) -> Dict[str, Any]:
        """Start a specific MCP server."""
        try:
            if server_name not in self.config['mcpServers']:
                return {'error': f'Server {server_name} not found in configuration'}

            server_config = self.config['mcpServers'][server_name]

            if server_name in self.running_servers:
                return {'status': 'already_running', 'server': server_name}

            # Start server based on type
            if server_config['type'] == 'desktop':
                result = await self._start_desktop_server(server_config)
            elif server_config['type'] == 'remote':
                result = await self._start_remote_server(server_config)
            else:
                return {'error': f'Unsupported server type: {server_config["type"]}'}

            if result['success']:
                self.running_servers[server_name] = server_config
                logger.info(f"Started MCP server: {server_name}")

            return result

        except Exception as e:
            logger.error(f"Failed to start server {server_name}: {str(e)}")
            return {'error': str(e), 'server': server_name}

    async def _start_desktop_server(self, server_config: Dict[str, Any]) -> Dict[str, Any]:
        """Start a desktop MCP server."""
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

            # Wait a bit for server to start
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
        """Start a remote MCP server."""
        try:
            # For remote servers, we'll assume they're started externally
            # In a real implementation, you might use Docker, systemd, etc.

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
                # For remote servers, we might need to call a shutdown endpoint
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

    async def get_server_status(self, server_name: str = None) -> Dict[str, Any]:
        """Get status of MCP servers."""
        try:
            if server_name:
                if server_name not in self.config['mcpServers']:
                    return {'error': f'Server {server_name} not found'}

                server_config = self.config['mcpServers'][server_name]
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
                all_status = {}
                for name, config in self.config['mcpServers'].items():
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
                    'total_servers': len(self.config['mcpServers']),
                    'running_servers': len(self.running_servers)
                }

        except Exception as e:
            logger.error(f"Failed to get server status: {str(e)}")
            return {'error': str(e)}

    async def list_available_tools(self, server_name: str = None) -> Dict[str, Any]:
        """List available tools from MCP servers."""
        try:
            if server_name:
                if server_name not in self.config['mcpServers']:
                    return {'error': f'Server {server_name} not found'}

                server_config = self.config['mcpServers'][server_name]
                tools = server_config.get('tools', {})

                return {
                    'server': server_name,
                    'tools': tools,
                    'tool_count': len(tools)
                }

            else:
                # List tools from all servers
                all_tools = {}
                for name, config in self.config['mcpServers'].items():
                    all_tools[name] = {
                        'tools': config.get('tools', {}),
                        'tool_count': len(config.get('tools', {}))
                    }

                return {
                    'servers': all_tools,
                    'total_tools': sum(len(config.get('tools', {})) for config in self.config['mcpServers'].values())
                }

        except Exception as e:
            logger.error(f"Failed to list tools: {str(e)}")
            return {'error': str(e)}

    async def execute_tool(self, server_name: str, tool_name: str,
                          parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Execute a tool on a specific MCP server."""
        try:
            if server_name not in self.running_servers:
                return {'error': f'Server {server_name} is not running'}

            server_config = self.running_servers[server_name]

            # Real MCP tool execution - forward to actual server
            import aiohttp

            server_url = server_config.get('endpoint', f"http://localhost:{server_config.get('port', 3000)}")

            async with aiohttp.ClientSession() as session:
                payload = {
                    'tool_name': tool_name,
                    'parameters': parameters,
                    'server_type': server_config['type']
                }

                async with session.post(f"{server_url}/tools/execute", json=payload) as response:
                    if response.status == 200:
                        result = await response.json()
                        return result
                    else:
                        error_text = await response.text()
                        return {'error': f'Server error: {response.status} - {error_text}'}

            return {
                'server': server_name,
                'tool': tool_name,
                'result': result,
                'timestamp': asyncio.get_event_loop().time()
            }

        except Exception as e:
            logger.error(f"Failed to execute tool {tool_name} on {server_name}: {str(e)}")
            return {'error': str(e), 'server': server_name, 'tool': tool_name}

    async def _execute_desktop_tool(self, server_config: Dict[str, Any],
                                   tool_name: str, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Execute tool on desktop server."""
        # This is a simplified implementation
        # In reality, you'd communicate with the actual MCP server

        if tool_name == 'file_operations':
            operation = parameters.get('operation', 'list')
            path = parameters.get('path', '.')

            if operation == 'list':
                try:
                    items = os.listdir(path)
                    return {
                        'operation': 'list',
                        'path': path,
                        'items': items,
                        'count': len(items)
                    }
                except Exception as e:
                    return {'error': str(e)}

            elif operation == 'read':
                try:
                    with open(path, 'r') as f:
                        content = f.read()
                    return {
                        'operation': 'read',
                        'path': path,
                        'content': content,
                        'size': len(content)
                    }
                except Exception as e:
                    return {'error': str(e)}

        elif tool_name == 'system_info':
            return {
                'platform': sys.platform,
                'cpu_count': psutil.cpu_count(),
                'memory': psutil.virtual_memory()._asdict(),
                'disk_usage': psutil.disk_usage('/')._asdict()
            }

        return {'error': f'Unknown tool: {tool_name}'}

    async def _execute_remote_tool(self, server_config: Dict[str, Any],
                                  tool_name: str, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Execute tool on remote server."""
        # This is a simplified implementation
        host = server_config.get('host', 'digitalhustlelab.com')
        port = server_config.get('port', 3000)

        try:
            # Make HTTP request to remote server
            response = requests.post(
                f"http://{host}:{port}/execute_tool",
                json={
                    'tool': tool_name,
                    'parameters': parameters
                },
                timeout=30
            )

            if response.status_code == 200:
                return response.json()
            else:
                return {'error': f'HTTP {response.status_code}: {response.text}'}

        except requests.exceptions.RequestException as e:
            return {'error': f'Request failed: {str(e)}'}

    async def get_system_health(self) -> Dict[str, Any]:
        """Get overall system health and statistics."""
        try:
            health_info = {
                'timestamp': asyncio.get_event_loop().time(),
                'total_servers': len(self.config['mcpServers']),
                'running_servers': len(self.running_servers),
                'system_resources': {
                    'cpu_percent': psutil.cpu_percent(interval=1),
                    'memory_percent': psutil.virtual_memory().percent,
                    'disk_percent': psutil.disk_usage('/').percent
                },
                'server_processes': {}
            }

            # Get process info for running servers
            for name, process in self.server_processes.items():
                if process.returncode is None:
                    try:
                        proc = psutil.Process(process.pid)
                        health_info['server_processes'][name] = {
                            'pid': process.pid,
                            'cpu_percent': proc.cpu_percent(),
                            'memory_percent': proc.memory_percent(),
                            'status': 'running'
                        }
                    except psutil.NoSuchProcess:
                        health_info['server_processes'][name] = {'status': 'process_not_found'}
                else:
                    health_info['server_processes'][name] = {
                        'returncode': process.returncode,
                        'status': 'stopped'
                    }

            return health_info

        except Exception as e:
            logger.error(f"Failed to get system health: {str(e)}")
            return {'error': str(e)}

# MCP Server Implementation
app = FastMCP("mcp-server-manager")
fastapi_app = FastAPI(title="MCP Server Management System")

# Add CORS middleware
fastapi_app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

manager = MCPServerManager()

@app.tool()
async def start_mcp_server(server_name: str) -> Dict[str, Any]:
    """
    Start a specific MCP server.

    Args:
        server_name: Name of the MCP server to start

    Returns:
        Server startup result
    """
    return await manager.start_server(server_name)

@app.tool()
async def stop_mcp_server(server_name: str) -> Dict[str, Any]:
    """
    Stop a specific MCP server.

    Args:
        server_name: Name of the MCP server to stop

    Returns:
        Server shutdown result
    """
    return await manager.stop_server(server_name)

@app.tool()
async def get_mcp_server_status(server_name: str = None) -> Dict[str, Any]:
    """
    Get status of MCP servers.

    Args:
        server_name: Specific server name (optional, returns all if not specified)

    Returns:
        Server status information
    """
    return await manager.get_server_status(server_name)

@app.tool()
async def list_mcp_tools(server_name: str = None) -> Dict[str, Any]:
    """
    List available tools from MCP servers.

    Args:
        server_name: Specific server name (optional, returns all if not specified)

    Returns:
        Available tools information
    """
    return await manager.list_available_tools(server_name)

@app.tool()
async def execute_mcp_tool(server_name: str, tool_name: str,
                          parameters: Dict[str, Any]) -> Dict[str, Any]:
    """
    Execute a tool on a specific MCP server.

    Args:
        server_name: Name of the MCP server
        tool_name: Name of the tool to execute
        parameters: Tool parameters

    Returns:
        Tool execution result
    """
    return await manager.execute_tool(server_name, tool_name, parameters)

@app.tool()
async def get_system_health() -> Dict[str, Any]:
    """
    Get overall system health and MCP server statistics.

    Returns:
        System health information
    """
    return await manager.get_system_health()

# REST API endpoints for additional functionality
@fastapi_app.get("/health")
async def health_check():
    """Health check endpoint."""
    return await manager.get_system_health()

@fastapi_app.get("/servers")
async def list_servers():
    """List all configured MCP servers."""
    return manager.config['mcpServers']

@fastapi_app.post("/servers/{server_name}/start")
async def start_server_endpoint(server_name: str):
    """Start a specific MCP server via REST API."""
    result = await manager.start_server(server_name)
    if 'error' in result:
        raise HTTPException(status_code=400, detail=result['error'])
    return result

@fastapi_app.post("/servers/{server_name}/stop")
async def stop_server_endpoint(server_name: str):
    """Stop a specific MCP server via REST API."""
    result = await manager.stop_server(server_name)
    if 'error' in result:
        raise HTTPException(status_code=400, detail=result['error'])
    return result

# Mount FastMCP app to FastAPI for WebSocket support
fastapi_app.mount("/mcp", app)

@fastapi_app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        # Handle MCP protocol over WebSocket
        await app.run_websocket(websocket)
    except WebSocketDisconnect:
        pass

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(fastapi_app, host="api.digitalhustlelab.com", port=3000)
