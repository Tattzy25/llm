#!/usr/bin/env python3
"""
MCP Tool Executor
Handles execution of tools across different MCP servers.
"""

import asyncio
import json
import logging
import os
import sys
from typing import Any, Dict, Optional

import psutil
import requests

logger = logging.getLogger(__name__)


class MCPToolExecutor:
    """Executes tools on MCP servers."""

    def __init__(self, config_manager, server_controller):
        self.config_manager = config_manager
        self.server_controller = server_controller

    async def execute_tool(self, server_name: str, tool_name: str,
                          parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Execute a tool on a specific MCP server."""
        try:
            if server_name not in self.server_controller.running_servers:
                return {'error': f'Server {server_name} is not running'}

            server_config = self.server_controller.running_servers[server_name]

            # Route to appropriate executor based on server type
            if server_config['type'] == 'desktop':
                result = await self._execute_desktop_tool(server_config, tool_name, parameters)
            elif server_config['type'] == 'remote':
                result = await self._execute_remote_tool(server_config, tool_name, parameters)
            else:
                return {'error': f'Unsupported server type: {server_config["type"]}'}

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
        # This implementation provides basic tool execution
        # In a real implementation, you'd communicate with the actual MCP server process

        if tool_name == 'file_operations':
            return await self._execute_file_operations(parameters)
        elif tool_name == 'system_info':
            return self._execute_system_info()
        elif tool_name == 'content_generation':
            return await self._execute_content_generation(parameters)
        elif tool_name == 'code_analysis':
            return await self._execute_code_analysis(parameters)
        elif tool_name == 'data_analysis':
            return self._execute_data_analysis(parameters)
        elif tool_name == 'web_scraping':
            return await self._execute_web_scraping(parameters)
        else:
            return {'error': f'Unknown tool: {tool_name}'}

    async def _execute_file_operations(self, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Execute file system operations."""
        operation = parameters.get('operation', 'list')
        path = parameters.get('path', '.')

        try:
            if operation == 'list':
                items = os.listdir(path)
                return {
                    'operation': 'list',
                    'path': path,
                    'items': items,
                    'count': len(items)
                }

            elif operation == 'read':
                with open(path, 'r') as f:
                    content = f.read()
                return {
                    'operation': 'read',
                    'path': path,
                    'content': content,
                    'size': len(content)
                }

            elif operation == 'write':
                content = parameters.get('content', '')
                with open(path, 'w') as f:
                    f.write(content)
                return {
                    'operation': 'write',
                    'path': path,
                    'size': len(content)
                }

            elif operation == 'delete':
                if os.path.exists(path):
                    os.remove(path)
                    return {'operation': 'delete', 'path': path, 'success': True}
                else:
                    return {'error': 'File not found', 'path': path}

            else:
                return {'error': f'Unknown file operation: {operation}'}

        except Exception as e:
            return {'error': str(e), 'operation': operation, 'path': path}

    def _execute_system_info(self) -> Dict[str, Any]:
        """Get system information."""
        try:
            return {
                'platform': sys.platform,
                'cpu_count': psutil.cpu_count(),
                'cpu_percent': psutil.cpu_percent(interval=1),
                'memory': psutil.virtual_memory()._asdict(),
                'disk_usage': psutil.disk_usage('/')._asdict(),
                'hostname': os.uname().nodename if hasattr(os, 'uname') else 'unknown'
            }
        except Exception as e:
            return {'error': str(e)}

    async def _execute_content_generation(self, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Execute content generation (placeholder for AI assistant integration)."""
        content_type = parameters.get('type', 'text')
        prompt = parameters.get('prompt', '')

        # This is a placeholder - in reality, you'd call the AI assistant server
        return {
            'type': content_type,
            'prompt': prompt,
            'generated_content': f'Generated {content_type} content for: {prompt}',
            'status': 'placeholder_implementation'
        }

    async def _execute_code_analysis(self, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Execute code analysis (placeholder for AI assistant integration)."""
        code = parameters.get('code', '')
        language = parameters.get('language', 'python')

        # This is a placeholder - in reality, you'd call the AI assistant server
        return {
            'language': language,
            'code_length': len(code),
            'analysis': 'placeholder_code_analysis',
            'issues': [],
            'status': 'placeholder_implementation'
        }

    def _execute_data_analysis(self, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Execute data analysis (placeholder for AI assistant integration)."""
        data = parameters.get('data', '')

        # This is a placeholder - in reality, you'd call the AI assistant server
        return {
            'data_type': type(data).__name__,
            'data_length': len(str(data)),
            'analysis': 'placeholder_data_analysis',
            'insights': [],
            'status': 'placeholder_implementation'
        }

    async def _execute_web_scraping(self, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Execute web scraping (placeholder for web scraper integration)."""
        url = parameters.get('url', '')

        # This is a placeholder - in reality, you'd call the web scraper server
        return {
            'url': url,
            'scraped_content': f'Placeholder scraped content from: {url}',
            'status': 'placeholder_implementation'
        }

    async def _execute_remote_tool(self, server_config: Dict[str, Any],
                                  tool_name: str, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Execute tool on remote server."""
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

    def list_available_tools(self, server_name: str = None) -> Dict[str, Any]:
        """List available tools from MCP servers."""
        try:
            if server_name:
                server_config = self.config_manager.get_server_config(server_name)
                if not server_config:
                    return {'error': f'Server {server_name} not found'}

                tools = server_config.get('tools', {})
                return {
                    'server': server_name,
                    'tools': tools,
                    'tool_count': len(tools)
                }

            else:
                # List tools from all servers
                all_servers = self.config_manager.get_all_servers()
                all_tools = {}

                for name, config in all_servers.items():
                    all_tools[name] = {
                        'tools': config.get('tools', {}),
                        'tool_count': len(config.get('tools', {}))
                    }

                return {
                    'servers': all_tools,
                    'total_tools': sum(len(config.get('tools', {})) for config in all_servers.values())
                }

        except Exception as e:
            logger.error(f"Failed to list tools: {str(e)}")
            return {'error': str(e)}
