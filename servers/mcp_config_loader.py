#!/usr/bin/env python3
"""
MCP Configuration Loader
========================

Loads MCP server and tool configurations from JSON files.
Provides a centralized way to manage MCP server configurations.
"""

import json
import os
from typing import Dict, Any, Optional
from pathlib import Path

class MCPConfigLoader:
    """Loads and manages MCP server configurations"""

    def __init__(self, config_path: Optional[str] = None):
        if config_path is None:
            # Default to the directory containing this script
            config_path = Path(__file__).parent / "mcp-config.json"

        self.config_path = Path(config_path)
        self.config = self._load_config()

    def _load_config(self) -> Dict[str, Any]:
        """Load configuration from JSON file"""
        try:
            with open(self.config_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except FileNotFoundError:
            print(f"⚠️  Configuration file not found: {self.config_path}")
            return self._get_default_config()
        except json.JSONDecodeError as e:
            print(f"❌ Invalid JSON in configuration file: {e}")
            return self._get_default_config()

    def _get_default_config(self) -> Dict[str, Any]:
        """Return default configuration"""
        return {
            "mcpServers": {},
            "mcpVersion": "2024-11-05",
            "jsonRpcVersion": "2.0"
        }

    def get_server_config(self, server_name: str) -> Optional[Dict[str, Any]]:
        """Get configuration for a specific server"""
        return self.config.get("mcpServers", {}).get(server_name)

    def get_tool_config(self, server_name: str, tool_name: str) -> Optional[Dict[str, Any]]:
        """Get configuration for a specific tool"""
        server_config = self.get_server_config(server_name)
        if server_config:
            return server_config.get("tools", {}).get(tool_name)
        return None

    def get_all_servers(self) -> Dict[str, Any]:
        """Get all server configurations"""
        return self.config.get("mcpServers", {})

    def get_mcp_version(self) -> str:
        """Get MCP protocol version"""
        return self.config.get("mcpVersion", "2024-11-05")

    def get_jsonrpc_version(self) -> str:
        """Get JSON-RPC version"""
        return self.config.get("jsonRpcVersion", "2.0")

    def validate_config(self) -> bool:
        """Validate the configuration structure"""
        try:
            # Check required top-level keys
            required_keys = ["mcpServers", "mcpVersion", "jsonRpcVersion"]
            for key in required_keys:
                if key not in self.config:
                    print(f"❌ Missing required key: {key}")
                    return False

            # Validate server configurations
            servers = self.config.get("mcpServers", {})
            for server_name, server_config in servers.items():
                if not isinstance(server_config, dict):
                    print(f"❌ Invalid server configuration for {server_name}")
                    return False

                required_server_keys = ["name", "type", "tools"]
                for key in required_server_keys:
                    if key not in server_config:
                        print(f"❌ Missing required key '{key}' in server {server_name}")
                        return False

                # Validate tool configurations
                tools = server_config.get("tools", {})
                for tool_name, tool_config in tools.items():
                    if not isinstance(tool_config, dict):
                        print(f"❌ Invalid tool configuration for {tool_name} in server {server_name}")
                        return False

                    required_tool_keys = ["name", "description", "schema"]
                    for key in required_tool_keys:
                        if key not in tool_config:
                            print(f"❌ Missing required key '{key}' in tool {tool_name}")
                            return False

            print("✅ Configuration validation passed")
            return True

        except Exception as e:
            print(f"❌ Configuration validation failed: {e}")
            return False

# Global configuration loader instance
_config_loader = None

def get_config_loader() -> MCPConfigLoader:
    """Get the global configuration loader instance"""
    global _config_loader
    if _config_loader is None:
        _config_loader = MCPConfigLoader()
    return _config_loader

def load_server_config(server_name: str) -> Optional[Dict[str, Any]]:
    """Convenience function to load server configuration"""
    return get_config_loader().get_server_config(server_name)

def load_tool_config(server_name: str, tool_name: str) -> Optional[Dict[str, Any]]:
    """Convenience function to load tool configuration"""
    return get_config_loader().get_tool_config(server_name, tool_name)

if __name__ == "__main__":
    # Test the configuration loader
    loader = MCPConfigLoader()
    print(f"MCP Version: {loader.get_mcp_version()}")
    print(f"JSON-RPC Version: {loader.get_jsonrpc_version()}")
    print(f"Available servers: {list(loader.get_all_servers().keys())}")

    # Validate configuration
    loader.validate_config()
