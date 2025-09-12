#!/usr/bin/env python3
"""
MCP Server Manager - Production Ready
====================================

Environment-based MCP server management system.
Manages multiple MCP servers with proper configuration loading.
"""

import asyncio
import json
import logging
import os
import sys
import signal
import subprocess
from typing import Any, Dict, List, Optional
from pathlib import Path
from datetime import datetime

# FastAPI for management interface
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

# Configuration loader
from config_loader import get_config_loader, validate_config, ServerConfig

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stderr),
        logging.FileHandler('mcp_server_manager.log')
    ]
)
logger = logging.getLogger(__name__)

class MCPServerManager:
    """Production-grade MCP Server Manager"""

    def __init__(self):
        """Initialize the MCP Server Manager with environment-based configuration"""
        # Load configuration from environment variables
        self.config_loader = get_config_loader()
        
        # Validate configuration before proceeding
        config_errors = validate_config()
        if config_errors:
            logger.error("Configuration validation failed:")
            for error in config_errors:
                logger.error(f"  - {error}")
            raise ValueError("Invalid configuration. Please check your environment variables.")
        
        # Load server configurations
        self.server_configs = self.config_loader.get_server_configs()
        self.base_config = self.config_loader.get_base_config()
        
        # Initialize server tracking
        self.servers = {}
        self.server_processes = {}
        self.running = False

        # Initialize FastAPI app
        self.app = FastAPI(title="MCP Server Manager", version="2.0.0")
        self._setup_routes()
        self._setup_middleware()
        
        logger.info(f"Initialized MCP Server Manager with {len(self.server_configs)} server configurations")

    def get_server_info(self, server_name: str) -> Optional[ServerConfig]:
        """Get configuration for a specific server"""
        for config in self.server_configs:
            if config.name == server_name:
                return config
        return None
    
    def list_available_servers(self) -> List[str]:
        """Get list of available server names"""
        return [config.name for config in self.server_configs]
    
    def _setup_middleware(self):
        """Setup FastAPI middleware"""
        self.app.add_middleware(
            CORSMiddleware,
            allow_origins=["*"],
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )

    def _setup_routes(self):
        """Setup FastAPI routes"""

        @self.app.get("/")
        async def root():
            return {
                "service": "MCP Server Manager",
                "version": "2.0.0",
                "status": "running" if self.running else "stopped",
                "servers": self.list_available_servers(),
                "config_source": "environment_variables"
            }
        
        @self.app.get("/servers")
        async def list_servers():
            """List all configured servers"""
            servers = []
            for config in self.server_configs:
                server_info = {
                    "name": config.name,
                    "description": config.description,
                    "module": config.module,
                    "port": config.port,
                    "enabled": config.enabled,
                    "status": self.servers.get(config.name, {}).get("status", "stopped")
                }
                servers.append(server_info)
            return {"servers": servers}
        
        @self.app.post("/servers/{server_name}/start")
        async def start_server_endpoint(server_name: str):
            """Start a specific server"""
            server_config = self.get_server_info(server_name)
            if not server_config:
                raise HTTPException(status_code=404, detail="Server not found")
            
            result = await self.start_server(server_name)
            return result
        
        @self.app.post("/servers/{server_name}/stop")
        async def stop_server_endpoint(server_name: str):
            """Stop a specific server"""
            server_config = self.get_server_info(server_name)
            if not server_config:
                raise HTTPException(status_code=404, detail="Server not found")
            
            result = await self.stop_server(server_name)
            return result

    async def start_server(self, server_name: str) -> Dict[str, Any]:
        """Start a specific MCP server"""
        server_config = self.get_server_info(server_name)
        if not server_config:
            return {"error": f"Server {server_name} not found"}
        
        if not server_config.enabled:
            return {"error": f"Server {server_name} is disabled"}
        
        if server_name in self.server_processes:
            return {"message": f"Server {server_name} is already running"}
        
        try:
            # Start the server process
            cmd = ["python", f"{server_config.module}.py"]
            process = subprocess.Popen(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                cwd=Path(__file__).parent
            )
            
            self.server_processes[server_name] = process
            self.servers[server_name] = {
                "config": server_config,
                "status": "running",
                "started_at": datetime.now(),
                "process_id": process.pid
            }
            
            logger.info(f"Started server {server_name} with PID {process.pid}")
            return {
                "message": f"Server {server_name} started successfully",
                "pid": process.pid,
                "status": "running"
            }
            
        except Exception as e:
            logger.error(f"Failed to start server {server_name}: {e}")
            return {"error": f"Failed to start server {server_name}: {str(e)}"}

    async def stop_server(self, server_name: str) -> Dict[str, Any]:
        """Stop a specific MCP server"""
        if server_name not in self.server_processes:
            return {"message": f"Server {server_name} is not running"}
        
        try:
            process = self.server_processes[server_name]
            process.terminate()
            
            # Wait for graceful shutdown
            try:
                process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                process.kill()
                process.wait()
            
            del self.server_processes[server_name]
            if server_name in self.servers:
                self.servers[server_name]["status"] = "stopped"
            
            logger.info(f"Stopped server {server_name}")
            return {"message": f"Server {server_name} stopped successfully"}
            
        except Exception as e:
            logger.error(f"Failed to stop server {server_name}: {e}")
            return {"error": f"Failed to stop server {server_name}: {str(e)}"}

    async def start_all_servers(self):
        """Start all enabled servers"""
        for config in self.server_configs:
            if config.enabled:
                try:
                    await self.start_server(config.name)
                except Exception as e:
                    logger.error(f"Failed to start server {config.name}: {e}")

    async def stop_all_servers(self):
        """Stop all running servers"""
        for server_name in list(self.server_processes.keys()):
            try:
                await self.stop_server(server_name)
            except Exception as e:
                logger.error(f"Failed to stop server {server_name}: {e}")

    async def run(self):
        """Run the MCP server manager"""
        self.running = True

        # Setup signal handlers
        def signal_handler(signum, frame):
            logger.info("Received shutdown signal")
            self.running = False

        signal.signal(signal.SIGINT, signal_handler)
        signal.signal(signal.SIGTERM, signal_handler)

        try:
            # Start FastAPI server
            config = uvicorn.Config(
                self.app,
                host=self.base_config["host"],
                port=self.base_config["base_port"],
                log_level=self.base_config["log_level"].lower()
            )
            server = uvicorn.Server(config)

            logger.info("🚀 MCP Server Manager started successfully")
            logger.info(f"📡 Manager API: http://{config.host}:{config.port}")
            logger.info(f"🔧 Available servers: {self.list_available_servers()}")

            await server.serve()

        except Exception as e:
            logger.error(f"Server error: {e}")
        finally:
            await self.stop_all_servers()
            self.running = False

async def main():
    """Main entry point"""
    try:
        manager = MCPServerManager()
        await manager.run()
    except KeyboardInterrupt:
        logger.info("Shutting down...")
    except Exception as e:
        logger.error(f"Fatal error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())