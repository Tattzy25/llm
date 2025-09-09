#!/usr/bin/env python3
"""
MCP Core Utilities
=================

Utility functions for MCP operations, validation, and helpers.
"""

import asyncio
import hashlib
import json
import logging
import os
import re
import socket
import uuid
from pathlib import Path
from typing import Any, Dict, List, Optional, Union

logger = logging.getLogger(__name__)


class MCPValidationError(Exception):
    """Custom exception for MCP validation errors."""
    pass


class MCPValidator:
    """Validator for MCP messages and parameters."""

    @staticmethod
    def validate_message(message: Dict[str, Any]) -> bool:
        """Validate MCP message structure."""
        if not isinstance(message, dict):
            raise MCPValidationError("Message must be a dictionary")

        if "jsonrpc" not in message:
            raise MCPValidationError("Message must contain 'jsonrpc' field")

        if message["jsonrpc"] != "2.0":
            raise MCPValidationError("Only JSON-RPC 2.0 is supported")

        # Check for valid message types
        has_method = "method" in message
        has_result = "result" in message
        has_error = "error" in message
        has_id = "id" in message

        if has_method and not has_id:
            # Notification - valid
            pass
        elif has_method and has_id:
            # Request - valid
            pass
        elif (has_result or has_error) and has_id:
            # Response - valid
            pass
        else:
            raise MCPValidationError("Invalid message structure")

        return True

    @staticmethod
    def validate_tool_parameters(tool_schema: Dict[str, Any],
                               parameters: Dict[str, Any]) -> bool:
        """Validate tool parameters against schema."""
        if not isinstance(parameters, dict):
            raise MCPValidationError("Parameters must be a dictionary")

        schema_props = tool_schema.get("properties", {})
        required_fields = tool_schema.get("required", [])

        # Check required fields
        for field in required_fields:
            if field not in parameters:
                raise MCPValidationError(f"Required parameter '{field}' is missing")

        # Validate parameter types and values
        for param_name, param_value in parameters.items():
            if param_name in schema_props:
                param_schema = schema_props[param_name]
                MCPValidator._validate_parameter(param_name, param_value, param_schema)

        return True

    @staticmethod
    def _validate_parameter(name: str, value: Any, schema: Dict[str, Any]) -> None:
        """Validate a single parameter."""
        param_type = schema.get("type")

        if param_type == "string":
            if not isinstance(value, str):
                raise MCPValidationError(f"Parameter '{name}' must be a string")
            if "enum" in schema and value not in schema["enum"]:
                raise MCPValidationError(f"Parameter '{name}' must be one of: {schema['enum']}")
        elif param_type == "integer":
            if not isinstance(value, int):
                raise MCPValidationError(f"Parameter '{name}' must be an integer")
        elif param_type == "number":
            if not isinstance(value, (int, float)):
                raise MCPValidationError(f"Parameter '{name}' must be a number")
        elif param_type == "boolean":
            if not isinstance(value, bool):
                raise MCPValidationError(f"Parameter '{name}' must be a boolean")
        elif param_type == "array":
            if not isinstance(value, list):
                raise MCPValidationError(f"Parameter '{name}' must be an array")
        elif param_type == "object":
            if not isinstance(value, dict):
                raise MCPValidationError(f"Parameter '{name}' must be an object")


class MCPIDGenerator:
    """Generator for unique MCP message IDs."""

    @staticmethod
    def generate_request_id() -> str:
        """Generate a unique request ID."""
        return str(uuid.uuid4())

    @staticmethod
    def generate_tool_call_id() -> str:
        """Generate a unique tool call ID."""
        return f"tool_{uuid.uuid4().hex[:8]}"


class MCPNetworkUtils:
    """Network utilities for MCP servers."""

    @staticmethod
    def find_free_port(start_port: int = 3001, max_attempts: int = 10) -> int:
        """Find a free port starting from start_port."""
        for port in range(start_port, start_port + max_attempts):
            try:
                with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                    s.bind(('', port))
                    return port
            except OSError:
                continue

        raise RuntimeError(f"No free ports found in range {start_port}-{start_port + max_attempts}")

    @staticmethod
    def is_port_open(host: str, port: int, timeout: float = 1.0) -> bool:
        """Check if a port is open on a host."""
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                s.settimeout(timeout)
                result = s.connect_ex((host, port))
                return result == 0
        except Exception:
            return False

    @staticmethod
    async def wait_for_port(host: str, port: int,
                           timeout: float = 10.0,
                           check_interval: float = 0.1) -> bool:
        """Wait for a port to become available."""
        start_time = asyncio.get_event_loop().time()

        while asyncio.get_event_loop().time() - start_time < timeout:
            if MCPNetworkUtils.is_port_open(host, port):
                return True
            await asyncio.sleep(check_interval)

        return False


class MCPFileUtils:
    """File system utilities for MCP operations."""

    @staticmethod
    def ensure_directory(path: Union[str, Path]) -> Path:
        """Ensure a directory exists, creating it if necessary."""
        path = Path(path)
        path.mkdir(parents=True, exist_ok=True)
        return path

    @staticmethod
    def get_file_info(path: Union[str, Path]) -> Dict[str, Any]:
        """Get information about a file."""
        path = Path(path)
        if not path.exists():
            raise FileNotFoundError(f"File not found: {path}")

        stat = path.stat()
        return {
            "name": path.name,
            "path": str(path.absolute()),
            "size": stat.st_size,
            "modified": stat.st_mtime,
            "created": stat.st_ctime,
            "is_file": path.is_file(),
            "is_dir": path.is_dir(),
            "extension": path.suffix if path.is_file() else None
        }

    @staticmethod
    def calculate_checksum(path: Union[str, Path], algorithm: str = "sha256") -> str:
        """Calculate file checksum."""
        path = Path(path)
        if not path.exists():
            raise FileNotFoundError(f"File not found: {path}")

        hash_func = hashlib.new(algorithm)
        with open(path, 'rb') as f:
            for chunk in iter(lambda: f.read(4096), b""):
                hash_func.update(chunk)

        return hash_func.hexdigest()

    @staticmethod
    def find_files_by_pattern(directory: Union[str, Path],
                            pattern: str,
                            recursive: bool = True) -> List[Path]:
        """Find files matching a pattern."""
        directory = Path(directory)
        if not directory.exists():
            return []

        if recursive:
            return list(directory.rglob(pattern))
        else:
            return list(directory.glob(pattern))


class MCPJsonUtils:
    """JSON utilities for MCP operations."""

    @staticmethod
    def safe_load_json(json_str: str, default: Any = None) -> Any:
        """Safely load JSON string with fallback."""
        try:
            return json.loads(json_str)
        except (json.JSONDecodeError, TypeError):
            return default

    @staticmethod
    def safe_dump_json(data: Any, default: str = "{}") -> str:
        """Safely dump data to JSON string with fallback."""
        try:
            return json.dumps(data, indent=2)
        except (TypeError, ValueError):
            return default

    @staticmethod
    def pretty_print_json(data: Any) -> str:
        """Pretty print JSON data."""
        return json.dumps(data, indent=2, sort_keys=True)


class MCPLoggingUtils:
    """Logging utilities for MCP servers."""

    @staticmethod
    def setup_logging(level: str = "INFO",
                     format_string: Optional[str] = None,
                     log_file: Optional[str] = None) -> None:
        """Setup logging configuration."""
        if format_string is None:
            format_string = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"

        logging_config = {
            "level": getattr(logging, level.upper(), logging.INFO),
            "format": format_string
        }

        if log_file:
            logging_config["handlers"] = [
                logging.StreamHandler(),
                logging.FileHandler(log_file)
            ]
        else:
            logging_config["handlers"] = [logging.StreamHandler()]

        logging.basicConfig(**logging_config)

    @staticmethod
    def get_logger(name: str) -> logging.Logger:
        """Get a configured logger."""
        return logging.getLogger(name)


class MCPEnvironmentUtils:
    """Environment utilities for MCP servers."""

    @staticmethod
    def get_env_var(name: str, default: Optional[str] = None) -> Optional[str]:
        """Get environment variable with optional default."""
        return os.getenv(name, default)

    @staticmethod
    def get_env_bool(name: str, default: bool = False) -> bool:
        """Get boolean environment variable."""
        value = os.getenv(name, str(default)).lower()
        return value in ('true', '1', 'yes', 'on')

    @staticmethod
    def get_env_int(name: str, default: int = 0) -> int:
        """Get integer environment variable."""
        try:
            return int(os.getenv(name, str(default)))
        except ValueError:
            return default

    @staticmethod
    def is_development() -> bool:
        """Check if running in development mode."""
        return MCPEnvironmentUtils.get_env_bool("MCP_DEV", False)

    @staticmethod
    def is_production() -> bool:
        """Check if running in production mode."""
        return not MCPEnvironmentUtils.is_development()


# Convenience functions
def validate_mcp_message(message: Dict[str, Any]) -> bool:
    """Convenience function for message validation."""
    return MCPValidator.validate_message(message)


def validate_tool_params(schema: Dict[str, Any], params: Dict[str, Any]) -> bool:
    """Convenience function for parameter validation."""
    return MCPValidator.validate_tool_parameters(schema, params)


def generate_id() -> str:
    """Convenience function for ID generation."""
    return MCPIDGenerator.generate_request_id()


def find_free_port(start_port: int = 3001) -> int:
    """Convenience function for finding free ports."""
    return MCPNetworkUtils.find_free_port(start_port)
