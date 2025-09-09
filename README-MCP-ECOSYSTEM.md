# MCP Server Ecosystem - Master Builder

A comprehensive Model Context Protocol (MCP) server ecosystem designed as a "master builder" system for managing multiple specialized MCP servers with extensive tool capabilities.

## 🏗️ Architecture Overview

This MCP ecosystem consists of multiple specialized servers, each providing unique capabilities:

### Core Components

1. **MCP Server Manager** (`mcp_server_manager.py`) - Master orchestration system
2. **Desktop Server** (`desktop_server.py`) - Local system operations
3. **Web Scraper Server** (`web_scraper_server.py`) - Web scraping and analysis
4. **Database Connector Server** (`database_connector_server.py`) - Multi-database support
5. **AI Assistant Server** (`ai_assistant_server.py`) - AI-powered content generation
6. **Configuration System** (`mcp-config-expanded.json`) - Centralized server configuration

## 🚀 Quick Start

### Prerequisites

```bash
# Install Python dependencies
pip install aiohttp fastapi uvicorn selenium beautifulsoup4 requests
pip install asyncpg aiomysql aiosqlite pymongo motor redis sqlalchemy
pip install openai anthropic google-generativeai pandas scikit-learn numpy
pip install psutil websockets pydantic

# Install system dependencies (for Selenium)
# Chrome/Chromium browser for web scraping
```

### Environment Variables

Set up API keys for AI services (optional):

```bash
export OPENAI_API_KEY="your-openai-key"
export ANTHROPIC_API_KEY="your-anthropic-key"
export GOOGLE_API_KEY="your-google-key"
```

### Starting the Ecosystem

1. **Start the Master Server Manager:**
```bash
cd servers
python mcp_server_manager.py
```

2. **Start Individual Servers:**
```bash
# Web Scraper Server
python web_scraper_server.py &

# Database Connector Server
python database_connector_server.py &

# AI Assistant Server
python ai_assistant_server.py &
```

## 📋 Server Capabilities

### 1. MCP Server Manager (Port 3000)
**Purpose:** Master orchestration and management system

**Tools:**
- `start_mcp_server` - Start specific MCP servers
- `stop_mcp_server` - Stop specific MCP servers
- `get_mcp_server_status` - Get server status information
- `list_mcp_tools` - List available tools across servers
- `execute_mcp_tool` - Execute tools on specific servers
- `get_system_health` - Get overall system health

**REST API Endpoints:**
- `GET /health` - System health check
- `GET /servers` - List all configured servers
- `POST /servers/{name}/start` - Start specific server
- `POST /servers/{name}/stop` - Stop specific server

### 2. Web Scraper Server (Port 3002)
**Purpose:** Advanced web scraping, content analysis, and search

**Tools:**
- `web_scrape` - Scrape websites with CSS selectors
- `web_search` - Search across multiple engines (Google, Bing, DuckDuckGo, Brave)
- `content_analysis` - Analyze web content (SEO, readability, structure, accessibility)

**Features:**
- Static content scraping with BeautifulSoup
- Dynamic content with Selenium WebDriver
- Multi-engine search with safe search options
- Comprehensive content analysis (SEO metrics, readability scores)

### 3. Database Connector Server (Port 3003)
**Purpose:** Universal database connectivity and operations

**Supported Databases:**
- PostgreSQL (asyncpg)
- MySQL (aiomysql)
- SQLite (aiosqlite)
- MongoDB (motor)
- Redis (redis)

**Tools:**
- `database_query` - Execute SQL queries
- `database_schema` - Explore database schemas
- `database_backup` - Create and manage backups

**Features:**
- Asynchronous database operations
- Schema exploration and metadata
- Backup and restore capabilities
- Connection pooling and management

### 4. AI Assistant Server (Port 3004)
**Purpose:** AI-powered content generation and analysis

**Supported AI Models:**
- OpenAI GPT-4
- Anthropic Claude
- Google Gemini

**Tools:**
- `content_generator` - Generate articles, emails, code, social content
- `code_analyzer` - Analyze code for bugs, performance, security
- `data_analyzer` - Analyze datasets with insights and predictions

**Features:**
- Multi-model content generation
- Code analysis with issue detection
- Data analysis with statistical insights
- Customizable output styles and lengths

## ⚙️ Configuration

### Server Configuration (`mcp-config-expanded.json`)

```json
{
  "mcpServers": {
    "filesystem": {
      "name": "Advanced File System Server",
      "type": "desktop",
      "transport": "stdio",
      "command": "python",
      "args": ["servers/desktop_server.py"],
      "tools": {
        "file_operations": {...},
        "file_search": {...},
        "file_analysis": {...}
      }
    }
  },
  "mcpVersion": "2024-11-05",
  "globalConfig": {
    "maxConcurrentConnections": 10,
    "defaultTimeout": 30,
    "enableLogging": true
  }
}
```

### Tool Schema Format

Each tool defines its parameters using JSON Schema:

```json
{
  "name": "Tool Name",
  "description": "Tool description",
  "schema": {
    "type": "object",
    "properties": {
      "parameter_name": {
        "type": "string",
        "description": "Parameter description"
      }
    },
    "required": ["parameter_name"]
  }
}
```

## 🔧 Usage Examples

### Starting Servers via MCP

```python
# Start the web scraper server
result = await start_mcp_server("web_scraper")
print(result)  # {'success': True, 'server': 'web_scraper', 'status': 'running'}

# Get server status
status = await get_mcp_server_status()
print(status)  # {'servers': {...}, 'total_servers': 4, 'running_servers': 2}
```

### Web Scraping Example

```python
# Scrape a website
result = await execute_mcp_tool("web_scraper", "web_scrape", {
    "url": "https://example.com",
    "selectors": {
        "title": "h1",
        "content": ".main-content"
    }
})
print(result['result']['content'])
```

### Database Operations

```python
# Execute SQL query
result = await execute_mcp_tool("database_connector", "database_query", {
    "connection_string": "postgresql://user:pass@api.digitalhustlelab.com:5432/mydb",
    "query": "SELECT * FROM users WHERE active = true",
    "parameters": []
})
print(result['result']['data'])
```

### AI Content Generation

```python
# Generate content
result = await execute_mcp_tool("ai_assistant", "content_generator", {
    "content_type": "article",
    "topic": "Machine Learning Trends 2024",
    "length": "medium",
    "style": "professional",
    "keywords": ["AI", "ML", "automation"]
})
print(result['result']['content'])
```

## 🔒 Security Considerations

1. **API Keys:** Store AI service API keys securely as environment variables
2. **Database Credentials:** Use secure connection strings with proper authentication
3. **Network Security:** Configure firewalls and access controls for remote servers
4. **Input Validation:** All tools include parameter validation and sanitization
5. **Rate Limiting:** Built-in rate limiting to prevent abuse
6. **Logging:** Comprehensive logging for audit and debugging

## 📊 Monitoring and Health Checks

### System Health Endpoint

```bash
curl http://api.digitalhustlelab.com:3000/health
```

Response:
```json
{
  "timestamp": 1642857600.0,
  "total_servers": 4,
  "running_servers": 3,
  "system_resources": {
    "cpu_percent": 45.2,
    "memory_percent": 67.8,
    "disk_percent": 23.1
  },
  "server_processes": {
    "web_scraper": {
      "pid": 12345,
      "cpu_percent": 5.2,
      "memory_percent": 12.3,
      "status": "running"
    }
  }
}
```

## 🐛 Troubleshooting

### Common Issues

1. **Server Won't Start:**
   - Check port availability
   - Verify dependencies are installed
   - Check configuration file syntax

2. **Tool Execution Fails:**
   - Ensure server is running
   - Verify tool parameters match schema
   - Check network connectivity for remote servers

3. **Database Connection Issues:**
   - Verify connection string format
   - Check database server status
   - Ensure proper authentication

### Debug Mode

Enable debug logging:

```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

## 🚀 Advanced Features

### Custom Tool Development

Create custom tools by extending the server classes:

```python
class CustomTool:
    async def execute(self, parameters: Dict[str, Any]) -> Dict[str, Any]:
        # Custom tool logic
        return {"result": "custom_output"}
```

### Server Auto-Scaling

The manager can automatically start/stop servers based on load:

```python
# Auto-scale based on request volume
if request_count > threshold:
    await manager.start_server("additional_worker")
```

### Integration with External Systems

Connect to external APIs, webhooks, and services:

```python
# Webhook integration
@app.post("/webhook/{server_name}")
async def handle_webhook(server_name: str, payload: Dict[str, Any]):
    await manager.execute_tool(server_name, "process_webhook", payload)
```

## 📈 Performance Optimization

1. **Connection Pooling:** Database connections are pooled for efficiency
2. **Async Operations:** All I/O operations are asynchronous
3. **Caching:** Frequently accessed data is cached
4. **Load Balancing:** Requests can be distributed across multiple server instances
5. **Resource Monitoring:** Automatic resource usage monitoring and alerts

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Add comprehensive tests
4. Update documentation
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue on GitHub
- Check the troubleshooting section
- Review the configuration examples
- Examine server logs for debugging information

---

**Built with ❤️ as a comprehensive MCP ecosystem for modern AI applications**
