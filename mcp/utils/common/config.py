#!/usr/bin/env python3
"""
MCP Config Utils
================

Configuration management utilities for MCP servers.
"""

import json
from pathlib import Path
from typing import Dict, Optional, Any

from mcp.core.utils.validation import MCPValidationError


class MCPConfig:
    """Configuration management utility."""

    def __init__(self, config_file: Optional[str] = None):
        self.config = {}
        self.config_file = config_file
        if config_file and Path(config_file).exists():
            self.load_config()

    def load_config(self, config_file: Optional[str] = None) -> bool:
        """Load configuration from file."""
        try:
            file_path = config_file or self.config_file
            if not file_path:
                raise MCPValidationError("No config file specified")

            with open(file_path, 'r') as f:
                if file_path.endswith('.json'):
                    self.config = json.load(f)
                else:
                    # Simple key=value format
                    for line in f:
                        line = line.strip()
                        if line and not line.startswith('#'):
                            key, value = line.split('=', 1)
                            self.config[key.strip()] = value.strip()
            return True
        except Exception as e:
            raise MCPValidationError(f"Failed to load config: {str(e)}")

    def save_config(self, config_file: Optional[str] = None) -> bool:
        """Save configuration to file."""
        try:
            file_path = config_file or self.config_file
            if not file_path:
                raise MCPValidationError("No config file specified")

            Path(file_path).parent.mkdir(parents=True, exist_ok=True)

            with open(file_path, 'w') as f:
                if file_path.endswith('.json'):
                    json.dump(self.config, f, indent=2)
                else:
                    for key, value in self.config.items():
                        f.write(f"{key}={value}\n")
            return True
        except Exception as e:
            raise MCPValidationError(f"Failed to save config: {str(e)}")

    def get(self, key: str, default: Any = None) -> Any:
        """Get configuration value."""
        return self.config.get(key, default)

    def set(self, key: str, value: Any) -> None:
        """Set configuration value."""
        self.config[key] = value

    def update(self, updates: Dict[str, Any]) -> None:
        """Update multiple configuration values."""
        self.config.update(updates)
