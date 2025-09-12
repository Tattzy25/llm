#!/usr/bin/env python3
"""
Environment-based Configuration Loader for MCP Servers
Replaces hardcoded configurations with environment variable support
"""

import os
from typing import Dict, Any, List, Optional
from dataclasses import dataclass
from pathlib import Path


@dataclass
class ServerConfig:
    """Configuration for a single MCP server"""
    name: str
    description: str
    module: str
    class_name: str
    port: int
    host: str = "localhost"
    enabled: bool = True


class ConfigurationError(Exception):
    """Raised when configuration validation fails"""
    pass


class EnvironmentConfigLoader:
    """Loads MCP server configurations from environment variables"""
    
    def __init__(self, env_file_path: Optional[str] = None):
        """Initialize the config loader
        
        Args:
            env_file_path: Optional path to .env file to load
        """
        self.env_file_path = env_file_path or self._find_env_file()
        self._load_env_file()
    
    def _find_env_file(self) -> Optional[str]:
        """Find .env file in current directory or parent directories"""
        current_dir = Path(__file__).parent
        for parent in [current_dir] + list(current_dir.parents):
            env_file = parent / ".env"
            if env_file.exists():
                return str(env_file)
        return None
    
    def _load_env_file(self):
        """Load environment variables from .env file if it exists"""
        if not self.env_file_path or not os.path.exists(self.env_file_path):
            return
        
        try:
            with open(self.env_file_path, 'r') as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith('#') and '=' in line:
                        key, value = line.split('=', 1)
                        key = key.strip()
                        value = value.strip().strip('"\'')
                        if key not in os.environ:
                            os.environ[key] = value
        except Exception as e:
            print(f"Warning: Could not load .env file {self.env_file_path}: {e}")
    
    def get_server_configs(self) -> List[ServerConfig]:
        """Get all enabled server configurations from environment"""
        configs = []
        
        # Define server types to check
        server_types = ['DESKTOP', 'AI_ASSISTANT', 'DATABASE', 'WEATHER']
        
        for server_type in server_types:
            if self._get_bool_env(f"{server_type}_SERVER_ENABLED", True):
                config = self._get_server_config(server_type)
                if config:
                    configs.append(config)
        
        return configs
    
    def _get_server_config(self, server_type: str) -> Optional[ServerConfig]:
        """Get configuration for a specific server type"""
        try:
            name = self._get_env(f"{server_type}_SERVER_NAME")
            description = self._get_env(f"{server_type}_SERVER_DESCRIPTION")
            module = self._get_env(f"{server_type}_SERVER_MODULE")
            class_name = self._get_env(f"{server_type}_SERVER_CLASS")
            port = self._get_int_env(f"{server_type}_SERVER_PORT")
            
            if not all([name, description, module, class_name, port]):
                print(f"Warning: Incomplete configuration for {server_type} server")
                return None
            
            host = self._get_env("MCP_HOST", "localhost")
            
            return ServerConfig(
                name=name,
                description=description,
                module=module,
                class_name=class_name,
                port=port,
                host=host
            )
        except Exception as e:
            print(f"Error loading {server_type} server config: {e}")
            return None
    
    def _get_env(self, key: str, default: str = None) -> str:
        """Get environment variable with optional default"""
        value = os.getenv(key, default)
        if value is None:
            raise ConfigurationError(f"Required environment variable {key} not found")
        return value
    
    def _get_int_env(self, key: str, default: int = None) -> int:
        """Get integer environment variable"""
        value = os.getenv(key)
        if value is None:
            if default is not None:
                return default
            raise ConfigurationError(f"Required environment variable {key} not found")
        
        try:
            return int(value)
        except ValueError:
            raise ConfigurationError(f"Environment variable {key} must be an integer, got: {value}")
    
    def _get_bool_env(self, key: str, default: bool = False) -> bool:
        """Get boolean environment variable"""
        value = os.getenv(key, str(default)).lower()
        return value in ('true', '1', 'yes', 'on')
    
    def validate_configuration(self) -> List[str]:
        """Validate the current configuration and return any errors"""
        errors = []
        
        try:
            configs = self.get_server_configs()
            if not configs:
                errors.append("No server configurations found or all servers disabled")
            
            # Check for port conflicts
            ports = [config.port for config in configs]
            if len(ports) != len(set(ports)):
                errors.append("Port conflicts detected in server configurations")
            
            # Validate port ranges
            for config in configs:
                if not (1024 <= config.port <= 65535):
                    errors.append(f"Invalid port {config.port} for {config.name} server (must be 1024-65535)")
        
        except Exception as e:
            errors.append(f"Configuration validation error: {e}")
        
        return errors
    
    def get_base_config(self) -> Dict[str, Any]:
        """Get base configuration settings"""
        return {
            'host': self._get_env('MCP_HOST', 'localhost'),
            'base_port': self._get_int_env('MCP_BASE_PORT', 8000),
            'log_level': self._get_env('LOG_LEVEL', 'INFO'),
            'log_file': self._get_env('LOG_FILE', 'mcp_server_manager.log')
        }


# Global config loader instance
_config_loader = None

def get_config_loader() -> EnvironmentConfigLoader:
    """Get the global configuration loader instance"""
    global _config_loader
    if _config_loader is None:
        _config_loader = EnvironmentConfigLoader()
    return _config_loader


def load_server_configs() -> List[ServerConfig]:
    """Convenience function to load server configurations"""
    return get_config_loader().get_server_configs()


def validate_config() -> List[str]:
    """Convenience function to validate configuration"""
    return get_config_loader().validate_configuration()