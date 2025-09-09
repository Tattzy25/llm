# MCP Servers

This directory contains MCP (Model Context Protocol) server implementations for the LLM application. MCP enables secure connections between AI applications and external tools/data sources.

## Overview

The MCP implementation includes:

- **Remote Server** (`remote_server.py`): HTTP/WebSocket-based server for remote connections
- **Desktop Server** (`desktop_server.py`): Local server providing desktop-specific tools
- **Requirements** (`requirements-mcp.txt`): Python dependencies for MCP servers

## Configuration System

The MCP servers now use a comprehensive JSON-based configuration system for better maintainability and flexibility.

### Configuration Files

- **`mcp-config.json`**: Main configuration file defining all MCP servers and their tools
- **`mcp_config_loader.py`**: Python module for loading and validating configurations

### Configuration Structure

```json
{
  "mcpServers": {
    "desktop": {
      "name": "Desktop Server",
      "description": "Local MCP server for desktop operations",
      "type": "desktop",
      "transport": "stdio",
      "tools": {
        "file_operations": {
          "name": "File Operations",
          "description": "Perform file operations (read, write, list, delete)",
          "schema": {
            "type": "object",
            "properties": {
              "operation": {
                "type": "string",
                "enum": ["read", "write", "list", "delete", "move", "copy"]
              },
              "path": {"type": "string", "description": "File or directory path"},
              "content": {"type": "string", "description": "Content for write operations"}
            },
            "required": ["operation", "path"]
          }
        }
      }
    }
  },
  "mcpVersion": "2024-11-05",
  "jsonRpcVersion": "2.0"
}
```

### Available Tools

#### Desktop Server Tools
- **file_operations**: File system operations (read, write, list, delete, move, copy)
- **system_info**: System information and monitoring
- **clipboard**: Clipboard read/write operations
- **notification**: Desktop notifications
- **application**: Application launch and control

#### Remote Server Tools
- **web_search**: Web search functionality
- **http_request**: HTTP request handling
- **database_query**: Database query execution

### Configuration Management

The system automatically validates configurations on startup and provides fallback to default settings if the configuration file is missing or invalid.

```python
from mcp_config_loader import get_config_loader

# Load configuration
loader = get_config_loader()

# Get server configuration
desktop_config = loader.get_server_config("desktop")

# Get tool configuration
file_ops_config = loader.get_tool_config("desktop", "file_operations")

# Validate configuration
is_valid = loader.validate_config()
```

### Adding New Tools

1. **Update `mcp-config.json`**:
```json
"new_tool": {
  "name": "New Tool",
  "description": "Description of the new tool",
  "schema": {
    "type": "object",
    "properties": {
      "parameter": {"type": "string", "description": "Parameter description"}
    },
    "required": ["parameter"]
  }
}
```

2. **Create tool class** in the appropriate server file:
```python
class NewTool(MCPTool):
    def __init__(self):
        config_loader = get_config_loader()
        tool_config = config_loader.get_tool_config("server_name", "new_tool")

        if tool_config:
            schema = tool_config.get("schema", {})
            description = tool_config.get("description", "Default")
        else:
            schema = {"type": "object", "properties": {}}
            description = "Default description"

        super().__init__("new_tool", description, schema)

    async def execute(self, **kwargs) -> Any:
        # Implementation here
        pass
```

3. **Register the tool** in the server's `_register_tools` method.

## Architecture

### Remote Server
- **Transport**: HTTP/WebSocket (port 3001 by default)
- **Tools**: File system operations, web search, database queries
- **Use Case**: Remote access from different machines/networks
- **Security**: Authentication and authorization support

### Desktop Server
- **Transport**: STDIO (local process communication)
- **Tools**: Desktop operations, system info, clipboard, notifications, application management
- **Use Case**: Local desktop integration and automation
- **Features**: File operations, system monitoring, desktop notifications

## Installation

### Prerequisites
- Python 3.10 or higher
- pip or uv package manager

### Setup
```bash
# Install dependencies
pip install -r servers/requirements-mcp.txt

# Or using uv (recommended)
uv pip install -r servers/requirements-mcp.txt
```

## Usage

### Quick Start with Launchers

For convenience, we've provided launcher scripts to easily start the MCP servers:

#### Windows (Batch Script)
```cmd
# Navigate to servers directory
cd servers

# Run the launcher
launch.bat
```
This will show a menu to select which server(s) to start.

#### Windows (PowerShell Script)
```powershell
# Navigate to servers directory
cd servers

# Run the launcher
.\launch.ps1

# Or specify server directly
.\launch.ps1 -Command remote
.\launch.ps1 -Command desktop
.\launch.ps1 -Command all
```

#### Cross-Platform (Python Script)
```bash
# Navigate to servers directory
cd servers

# Start remote server
python launch.py remote

# Start desktop server
python launch.py desktop

# Start both servers
python launch.py all

# Check dependencies
python launch.py check
```

#### Launcher Options
- `--host HOST`: Host for remote server (default: digitalhustlelab.com)
- `--port PORT`: Port for remote server (auto-assigned if not specified)
- `--stdio`: Run remote server in STDIO mode

### Manual Server Startup

#### Remote Server
```bash
# Basic startup
python servers/remote_server.py

# Custom host/port
python servers/remote_server.py --host 0.0.0.0 --port 8080

# STDIO mode for local MCP clients
python servers/remote_server.py --stdio
```

#### Available Tools
- `filesystem_read`: Read file contents
- `web_search`: Search the web
- `database_query`: Execute database queries

#### Example API Usage
```python
import httpx

# Connect to remote server
response = httpx.post("http://digitalhustlelab.com:3001/mcp", json={
    "jsonrpc": "2.0",
    "id": "1",
    "method": "initialize",
    "params": {
        "clientInfo": {"name": "My Client", "version": "1.0.0"}
    }
})
```

### Desktop Server

#### Start the server
```bash
python servers/desktop_server.py
```

#### Available Tools
- `file_operations`: Read, write, list, delete, move, copy files
- `system_info`: Get CPU, memory, disk, network information
- `clipboard`: Get/set clipboard content
- `notification`: Send desktop notifications
- `application`: Launch applications, list processes, terminate processes

#### Desktop Integration Features
- **File Operations**: Full CRUD operations on local files
- **System Monitoring**: Real-time system statistics
- **Clipboard Access**: Read/write system clipboard
- **Notifications**: Native desktop notifications
- **Application Management**: Launch and manage desktop applications

## Testing

### Test Script
We've included a comprehensive test script to verify server functionality:

```bash
# Run all tests
python servers/test.py

# The test script will:
# 1. Check dependencies
# 2. Start remote server automatically
# 3. Test MCP protocol initialization
# 4. Test desktop server via STDIO
# 5. Report results
```

### Manual Testing

#### Test Remote Server Health
```bash
curl http://digitalhustlelab.com:3001/health
```

#### Test MCP Protocol
```bash
# Initialize connection
curl -X POST http://digitalhustlelab.com:3001/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": "1",
    "method": "initialize",
    "params": {
      "protocolVersion": "2024-11-05",
      "capabilities": {},
      "clientInfo": {"name": "Test Client", "version": "1.0.0"}
    }
  }'
```

#### Test Desktop Server
```bash
# Run desktop server and send test message
echo '{"jsonrpc": "2.0", "id": "1", "method": "initialize", "params": {"protocolVersion": "2024-11-05", "capabilities": {}, "clientInfo": {"name": "Test Client", "version": "1.0.0"}}}' | python servers/desktop_server.py
```

## Configuration

### Environment Variables
```bash
# Remote server
MCP_REMOTE_HOST=0.0.0.0
MCP_REMOTE_PORT=3001
MCP_LOG_LEVEL=INFO

# Desktop server
MCP_DESKTOP_LOG_LEVEL=INFO
```

### Server Configuration
Both servers support configuration through:
- Command line arguments
- Environment variables
- Configuration files (planned)

## MCP Protocol

### Message Format
```json
{
  "jsonrpc": "2.0",
  "id": "unique-id",
  "method": "tool_name",
  "params": {
    "arguments": {
      "param1": "value1",
      "param2": "value2"
    }
  }
}
```

### Core Methods
- `initialize`: Initialize connection
- `tools/list`: List available tools
- `tools/call`: Execute a tool
- `resources/list`: List available resources
- `resources/read`: Read a resource

## Security Considerations

### Remote Server
- Implement authentication for production use
- Use HTTPS in production
- Validate input parameters
- Rate limiting and access controls

### Desktop Server
- Local execution only (no network exposure)
- User consent for sensitive operations
- Secure file system access
- Process isolation

## Development

### Adding New Tools
1. Define tool class inheriting from `MCPTool`
2. Implement `execute()` method
3. Register tool in server constructor
4. Update parameter schema

### Testing
```bash
# Test remote server
curl -X POST http://digitalhustlelab.com:3001/health

# Test desktop server (requires MCP client)
python -c "import sys; print('Desktop server ready')"
```

## Integration with LLM App

### Frontend Components
- `MCPConnections`: Manage server connections
- `MCPServerManager`: Configure and start servers
- `MCPTools`: Execute and monitor tools

### Navigation
Access MCP features through the sidebar:
- **MCP > Connections**: Manage server connections
- **MCP > Servers**: Configure MCP servers
- **MCP > Tools**: Execute available tools

## Troubleshooting

### Common Issues

#### Import Errors
```bash
# Install missing dependencies
pip install fastapi uvicorn websockets psutil pyperclip plyer
```

#### Port Conflicts
```bash
# Find process using port
netstat -ano | findstr :3001

# Kill process (replace PID)
taskkill /PID <PID> /F
```

#### Permission Errors
- Run with appropriate permissions for file operations
- Check desktop notification permissions
- Verify database connection credentials

### Logs
- Remote server: `remote_server.log`
- Desktop server: `desktop_server.log`
- Both log to stderr for MCP compatibility

## Contributing

### Code Style
- Follow PEP 8 for Python code
- Use type hints
- Comprehensive error handling
- Logging for debugging

### Adding Features
1. Create feature branch
2. Implement tool/resource
3. Add tests
4. Update documentation
5. Submit pull request

## License

This MCP implementation is part of the LLM application and follows the same license terms.

## Support

For issues and questions:
1. Check the logs for error messages
2. Verify server configuration
3. Test with minimal example
4. Check network connectivity (for remote server)
5. Review MCP protocol compliance
