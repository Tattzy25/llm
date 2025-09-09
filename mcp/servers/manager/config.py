#!/usr/bin/env python3
"""
MCP Server Manager Configuration
Handles loading and managing MCP server configurations.
"""

import json
import logging
import os
from typing import Any, Dict, Optional

logger = logging.getLogger(__name__)


class MCPConfigManager:
    """Manages MCP server configuration loading and validation."""

    def __init__(self, config_path: str = "servers/mcp-config-expanded.json"):
        self.config_path = config_path
        self.config = self._load_config()

    def _load_config(self) -> Dict[str, Any]:
        """Load MCP server configuration from file."""
        try:
            if os.path.exists(self.config_path):
                with open(self.config_path, 'r') as f:
                    return json.load(f)
            else:
                logger.warning(f"Config file {self.config_path} not found, using default config")
                return self._get_default_config()
        except json.JSONDecodeError as e:
            logger.error(f"Invalid JSON in config file: {e}")
            return self._get_default_config()
        except Exception as e:
            logger.error(f"Error loading config: {e}")
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
                },
                "ai_assistant": {
                    "name": "AI Assistant Server",
                    "type": "desktop",
                    "transport": "stdio",
                    "command": "python",
                    "args": ["mcp/servers/ai_assistant/server.py"],
                    "tools": ["content_generation", "code_analysis", "data_analysis"]
                },
                "web_scraper": {
                    "name": "Web Scraper Server",
                    "type": "desktop",
                    "transport": "stdio",
                    "command": "python",
                    "args": ["mcp/servers/web_scraper/server.py"],
                    "tools": ["web_scraping", "content_analysis"]
                },
                "remote": {
                    "name": "Remote Server",
                    "type": "remote",
                    "host": "digitalhustlelab.com",
                    "port": 3000,
                    "tools": ["file_system", "web_search", "database"]
                }
            },
            "mcpVersion": "2024-11-05",
            "globalConfig": {
                "maxConcurrentConnections": 10,
                "defaultTimeout": 30,
                "enableLogging": True,
                "healthCheckInterval": 60
            }
        }

    def get_server_config(self, server_name: str) -> Optional[Dict[str, Any]]:
        """Get configuration for a specific server."""
        return self.config.get('mcpServers', {}).get(server_name)

    def get_all_servers(self) -> Dict[str, Any]:
        """Get all server configurations."""
        return self.config.get('mcpServers', {})

    def get_global_config(self) -> Dict[str, Any]:
        """Get global configuration."""
        return self.config.get('globalConfig', {})

    def update_server_config(self, server_name: str, config: Dict[str, Any]) -> bool:
        """Update configuration for a specific server."""
        try:
            if 'mcpServers' not in self.config:
                self.config['mcpServers'] = {}

            self.config['mcpServers'][server_name] = config
            self._save_config()
            return True
        except Exception as e:
            logger.error(f"Failed to update server config: {e}")
            return False

    def _save_config(self) -> bool:
        """Save configuration to file."""
        try:
            os.makedirs(os.path.dirname(self.config_path), exist_ok=True)
            with open(self.config_path, 'w') as f:
                json.dump(self.config, f, indent=2)
            return True
        except Exception as e:
            logger.error(f"Failed to save config: {e}")
            return False

    def validate_config(self) -> Dict[str, Any]:
        """Validate the current configuration."""
        issues = []

        servers = self.config.get('mcpServers', {})
        if not servers:
            issues.append("No servers configured")

        for server_name, server_config in servers.items():
            if 'type' not in server_config:
                issues.append(f"Server {server_name}: missing 'type' field")

            if server_config.get('type') == 'desktop':
                if 'command' not in server_config:
                    issues.append(f"Server {server_name}: desktop servers require 'command' field")
            elif server_config.get('type') == 'remote':
                if 'host' not in server_config:
                    issues.append(f"Server {server_name}: remote servers require 'host' field")

        return {
            "valid": len(issues) == 0,
            "issues": issues,
            "server_count": len(servers)
        }
