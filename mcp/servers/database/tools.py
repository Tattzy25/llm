#!/usr/bin/env python3
"""
Database Tools Manager
======================

Manages database-related tools for MCP servers.
"""

import logging
from typing import Dict, List, Any, Optional
from pathlib import Path

from mcp.core.utils.validation import MCPValidationError
from mcp.servers.database.migration_backup_tools import (
    DatabaseMigrationTool,
    DatabaseBackupTool,
    DatabaseMaintenanceTool
)

logger = logging.getLogger(__name__)


class MCPTool:
    """Base class for MCP tools."""

    def __init__(self, name: str, description: str, parameters: Dict[str, Any]):
        self.name = name
        self.description = description
        self.parameters = parameters

    async def execute(self, **kwargs) -> Any:
        raise NotImplementedError("Tool execution not implemented")


class DatabaseToolsManager:
    """Manager for database-related tools."""

    def __init__(self, db_path: str):
        self.db_path = db_path
        self.migration_tool = DatabaseMigrationTool(db_path)
        self.backup_tool = DatabaseBackupTool(db_path)
        self.maintenance_tool = DatabaseMaintenanceTool(db_path)
        self.tools: Dict[str, MCPTool] = {}

    def register_migration_tools(self) -> None:
        """Register database migration tools."""

        class CreateMigrationTool(MCPTool):
            def __init__(self):
                schema = {
                    "type": "object",
                    "properties": {
                        "name": {"type": "string", "description": "Migration name"},
                        "up_sql": {"type": "string", "description": "SQL for migration up"},
                        "down_sql": {"type": "string", "description": "SQL for migration down"}
                    },
                    "required": ["name", "up_sql"]
                }
                super().__init__("create_migration", "Create a new database migration", schema)
                self.migration_tool = DatabaseMigrationTool(self.db_path)

            async def execute(self, name: str, up_sql: str, down_sql: Optional[str] = None) -> Dict[str, Any]:
                return self.migration_tool.create_migration(name, up_sql, down_sql)

        class RunMigrationTool(MCPTool):
            def __init__(self):
                schema = {
                    "type": "object",
                    "properties": {
                        "migration_id": {"type": "string", "description": "Migration ID to run"}
                    },
                    "required": ["migration_id"]
                }
                super().__init__("run_migration", "Run a specific database migration", schema)
                self.migration_tool = DatabaseMigrationTool(self.db_path)

            async def execute(self, migration_id: str) -> Dict[str, Any]:
                return self.migration_tool.run_migration(migration_id)

        class RollbackMigrationTool(MCPTool):
            def __init__(self):
                schema = {
                    "type": "object",
                    "properties": {
                        "migration_id": {"type": "string", "description": "Migration ID to rollback"}
                    },
                    "required": ["migration_id"]
                }
                super().__init__("rollback_migration", "Rollback a specific database migration", schema)
                self.migration_tool = DatabaseMigrationTool(self.db_path)

            async def execute(self, migration_id: str) -> Dict[str, Any]:
                return self.migration_tool.rollback_migration(migration_id)

        class GetMigrationStatusTool(MCPTool):
            def __init__(self):
                schema = {"type": "object", "properties": {}}
                super().__init__("get_migration_status", "Get status of all database migrations", schema)
                self.migration_tool = DatabaseMigrationTool(self.db_path)

            async def execute(self) -> Dict[str, Any]:
                return self.migration_tool.get_migration_status()

        # Create tool instances
        self.tools.update({
            "create_migration": CreateMigrationTool(),
            "run_migration": RunMigrationTool(),
            "rollback_migration": RollbackMigrationTool(),
            "get_migration_status": GetMigrationStatusTool()
        })

    def register_backup_tools(self) -> None:
        """Register database backup tools."""

        class CreateBackupTool(MCPTool):
            def __init__(self):
                schema = {
                    "type": "object",
                    "properties": {
                        "name": {"type": "string", "description": "Backup name"},
                        "compress": {"type": "boolean", "description": "Whether to compress backup", "default": True}
                    }
                }
                super().__init__("create_backup", "Create a database backup", schema)
                self.backup_tool = DatabaseBackupTool(self.db_path)

            async def execute(self, name: Optional[str] = None, compress: bool = True) -> Dict[str, Any]:
                backup_path, info = self.backup_tool.create_backup(name, compress)
                return info

        class RestoreBackupTool(MCPTool):
            def __init__(self):
                schema = {
                    "type": "object",
                    "properties": {
                        "backup_path": {"type": "string", "description": "Path to backup file"}
                    },
                    "required": ["backup_path"]
                }
                super().__init__("restore_backup", "Restore database from backup", schema)
                self.backup_tool = DatabaseBackupTool(self.db_path)

            async def execute(self, backup_path: str) -> Dict[str, Any]:
                return self.backup_tool.restore_backup(backup_path)

        class ListBackupsTool(MCPTool):
            def __init__(self):
                schema = {"type": "object", "properties": {}}
                super().__init__("list_backups", "List all available database backups", schema)
                self.backup_tool = DatabaseBackupTool(self.db_path)

            async def execute(self) -> List[Dict[str, Any]]:
                return self.backup_tool.list_backups()

        class CleanupBackupsTool(MCPTool):
            def __init__(self):
                schema = {
                    "type": "object",
                    "properties": {
                        "keep_days": {"type": "integer", "description": "Days to keep backups", "default": 30}
                    }
                }
                super().__init__("cleanup_backups", "Clean up old database backups", schema)
                self.backup_tool = DatabaseBackupTool(self.db_path)

            async def execute(self, keep_days: int = 30) -> Dict[str, Any]:
                return self.backup_tool.cleanup_old_backups(keep_days)

        class VerifyBackupTool(MCPTool):
            def __init__(self):
                schema = {
                    "type": "object",
                    "properties": {
                        "backup_path": {"type": "string", "description": "Path to backup file"}
                    },
                    "required": ["backup_path"]
                }
                super().__init__("verify_backup", "Verify backup integrity", schema)
                self.backup_tool = DatabaseBackupTool(self.db_path)

            async def execute(self, backup_path: str) -> Dict[str, Any]:
                return self.backup_tool.verify_backup(backup_path)

        # Create tool instances
        self.tools.update({
            "create_backup": CreateBackupTool(),
            "restore_backup": RestoreBackupTool(),
            "list_backups": ListBackupsTool(),
            "cleanup_backups": CleanupBackupsTool(),
            "verify_backup": VerifyBackupTool()
        })

    def register_maintenance_tools(self) -> None:
        """Register database maintenance tools."""

        class OptimizeDatabaseTool(MCPTool):
            def __init__(self):
                schema = {"type": "object", "properties": {}}
                super().__init__("optimize_database", "Optimize database performance", schema)
                self.maintenance_tool = DatabaseMaintenanceTool(self.db_path)

            async def execute(self) -> Dict[str, Any]:
                return self.maintenance_tool.optimize_database()

        class GetDatabaseStatsTool(MCPTool):
            def __init__(self):
                schema = {"type": "object", "properties": {}}
                super().__init__("get_database_stats", "Get comprehensive database statistics", schema)
                self.maintenance_tool = DatabaseMaintenanceTool(self.db_path)

            async def execute(self) -> Dict[str, Any]:
                return self.maintenance_tool.get_database_stats()

        class RepairDatabaseTool(MCPTool):
            def __init__(self):
                schema = {"type": "object", "properties": {}}
                super().__init__("repair_database", "Attempt to repair database corruption", schema)
                self.maintenance_tool = DatabaseMaintenanceTool(self.db_path)

            async def execute(self) -> Dict[str, Any]:
                return self.maintenance_tool.repair_database()

        # Create tool instances
        self.tools.update({
            "optimize_database": OptimizeDatabaseTool(),
            "get_database_stats": GetDatabaseStatsTool(),
            "repair_database": RepairDatabaseTool()
        })

    def register_all_tools(self) -> None:
        """Register all database tools."""
        self.register_migration_tools()
        self.register_backup_tools()
        self.register_maintenance_tools()

        logger.info(f"Registered {len(self.tools)} database tools")

    def get_tool(self, name: str) -> Optional[MCPTool]:
        """Get a tool by name."""
        return self.tools.get(name)

    def get_all_tools(self) -> Dict[str, MCPTool]:
        """Get all registered tools."""
        return self.tools.copy()

    def initialize_database(self) -> None:
        """Initialize database with required tables."""
        self.migration_tool.initialize_migrations_table()
        logger.info("Database initialized with migrations table")
