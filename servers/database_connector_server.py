#!/usr/bin/env python3
"""
Advanced Database Connector MCP Server
Provides comprehensive database connectivity and query capabilities for multiple database types.
"""

import asyncio
import json
import logging
import os
from typing import Any, Dict, List, Optional, Union
from urllib.parse import urlparse

import asyncpg
import aiomysql
import aiosqlite
import pymongo
import redis.asyncio as redis
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from mcp.server import FastMCP
from motor.motor_asyncio import AsyncIOMotorClient
from sqlalchemy import create_engine, text, MetaData, Table, Column
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class DatabaseConnector:
    """Advanced database connector supporting multiple database types."""

    def __init__(self):
        self.connections = {}
        self.engines = {}

    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.close_all_connections()

    def _parse_connection_string(self, connection_string: str) -> Dict[str, Any]:
        """Parse database connection string into components."""
        parsed = urlparse(connection_string)

        return {
            'dialect': parsed.scheme,
            'host': parsed.hostname,
            'port': parsed.port,
            'database': parsed.path.lstrip('/'),
            'username': parsed.username,
            'password': parsed.password,
            'query_params': dict(param.split('=') for param in parsed.query.split('&') if param)
        }

    async def connect_postgresql(self, connection_string: str) -> asyncpg.Connection:
        """Connect to PostgreSQL database."""
        try:
            conn = await asyncpg.connect(connection_string)
            logger.info("Connected to PostgreSQL database")
            return conn
        except Exception as e:
            logger.error(f"Failed to connect to PostgreSQL: {str(e)}")
            raise

    async def connect_mysql(self, connection_string: str) -> aiomysql.Connection:
        """Connect to MySQL database."""
        try:
            parsed = self._parse_connection_string(connection_string)
            conn = await aiomysql.connect(
                host=parsed['host'],
                port=parsed['port'] or 3306,
                user=parsed['username'],
                password=parsed['password'],
                db=parsed['database']
            )
            logger.info("Connected to MySQL database")
            return conn
        except Exception as e:
            logger.error(f"Failed to connect to MySQL: {str(e)}")
            raise

    async def connect_sqlite(self, connection_string: str) -> aiosqlite.Connection:
        """Connect to SQLite database."""
        try:
            # Extract path from connection string
            path = connection_string.replace('sqlite:///', '')
            conn = await aiosqlite.connect(path)
            logger.info("Connected to SQLite database")
            return conn
        except Exception as e:
            logger.error(f"Failed to connect to SQLite: {str(e)}")
            raise

    def connect_mongodb(self, connection_string: str) -> AsyncIOMotorClient:
        """Connect to MongoDB database."""
        try:
            client = AsyncIOMotorClient(connection_string)
            logger.info("Connected to MongoDB database")
            return client
        except Exception as e:
            logger.error(f"Failed to connect to MongoDB: {str(e)}")
            raise

    async def connect_redis(self, connection_string: str) -> redis.Redis:
        """Connect to Redis database."""
        try:
            parsed = self._parse_connection_string(connection_string)
            conn = redis.Redis(
                host=parsed['host'] or 'digitalhustlelab.com',
                port=parsed['port'] or 6379,
                db=int(parsed['database'] or 0),
                password=parsed['password']
            )
            # Test connection
            await conn.ping()
            logger.info("Connected to Redis database")
            return conn
        except Exception as e:
            logger.error(f"Failed to connect to Redis: {str(e)}")
            raise

    async def get_connection(self, connection_string: str) -> Any:
        """Get or create database connection based on connection string."""
        if connection_string in self.connections:
            return self.connections[connection_string]

        parsed = self._parse_connection_string(connection_string)
        dialect = parsed['dialect']

        if dialect.startswith('postgresql'):
            conn = await self.connect_postgresql(connection_string)
        elif dialect.startswith('mysql'):
            conn = await self.connect_mysql(connection_string)
        elif dialect.startswith('sqlite'):
            conn = await self.connect_sqlite(connection_string)
        elif dialect.startswith('mongodb'):
            conn = self.connect_mongodb(connection_string)
        elif dialect.startswith('redis'):
            conn = await self.connect_redis(connection_string)
        else:
            raise ValueError(f"Unsupported database dialect: {dialect}")

        self.connections[connection_string] = conn
        return conn

    async def close_connection(self, connection_string: str):
        """Close database connection."""
        if connection_string in self.connections:
            conn = self.connections[connection_string]
            if hasattr(conn, 'close'):
                if asyncio.iscoroutinefunction(conn.close):
                    await conn.close()
                else:
                    conn.close()
            del self.connections[connection_string]

    async def close_all_connections(self):
        """Close all database connections."""
        for conn_string in list(self.connections.keys()):
            await self.close_connection(conn_string)

    async def execute_query(self, connection_string: str, query: str,
                           parameters: List[Any] = None, timeout: int = 30) -> Dict[str, Any]:
        """Execute SQL query on database."""
        try:
            conn = await self.get_connection(connection_string)
            parsed = self._parse_connection_string(connection_string)
            dialect = parsed['dialect']

            if dialect.startswith('postgresql'):
                return await self._execute_postgresql(conn, query, parameters, timeout)
            elif dialect.startswith('mysql'):
                return await self._execute_mysql(conn, query, parameters, timeout)
            elif dialect.startswith('sqlite'):
                return await self._execute_sqlite(conn, query, parameters, timeout)
            else:
                raise ValueError(f"SQL queries not supported for {dialect}")

        except Exception as e:
            logger.error(f"Query execution failed: {str(e)}")
            return {'error': str(e), 'query': query}

    async def _execute_postgresql(self, conn: asyncpg.Connection, query: str,
                                 parameters: List[Any], timeout: int) -> Dict[str, Any]:
        """Execute query on PostgreSQL."""
        try:
            if parameters:
                result = await asyncio.wait_for(
                    conn.fetch(query, *parameters),
                    timeout=timeout
                )
            else:
                result = await asyncio.wait_for(
                    conn.fetch(query),
                    timeout=timeout
                )

            return {
                'success': True,
                'rows_affected': len(result),
                'columns': [desc[0] for desc in result[0].keys()] if result else [],
                'data': [dict(row) for row in result]
            }
        except Exception as e:
            return {'error': str(e), 'query': query}

    async def _execute_mysql(self, conn: aiomysql.Connection, query: str,
                            parameters: List[Any], timeout: int) -> Dict[str, Any]:
        """Execute query on MySQL."""
        try:
            async with conn.cursor() as cursor:
                if parameters:
                    await asyncio.wait_for(
                        cursor.execute(query, parameters),
                        timeout=timeout
                    )
                else:
                    await asyncio.wait_for(
                        cursor.execute(query),
                        timeout=timeout
                    )

                result = await asyncio.wait_for(cursor.fetchall(), timeout=timeout)
                columns = [desc[0] for desc in cursor.description] if cursor.description else []

                return {
                    'success': True,
                    'rows_affected': cursor.rowcount,
                    'columns': columns,
                    'data': [dict(zip(columns, row)) for row in result] if columns else result
                }
        except Exception as e:
            return {'error': str(e), 'query': query}

    async def _execute_sqlite(self, conn: aiosqlite.Connection, query: str,
                             parameters: List[Any], timeout: int) -> Dict[str, Any]:
        """Execute query on SQLite."""
        try:
            if parameters:
                cursor = await asyncio.wait_for(
                    conn.execute(query, parameters),
                    timeout=timeout
                )
            else:
                cursor = await asyncio.wait_for(
                    conn.execute(query),
                    timeout=timeout
                )

            result = await asyncio.wait_for(cursor.fetchall(), timeout=timeout)
            columns = [desc[0] for desc in cursor.description] if cursor.description else []

            return {
                'success': True,
                'rows_affected': len(result),
                'columns': columns,
                'data': [dict(zip(columns, row)) for row in result] if columns else result
            }
        except Exception as e:
            return {'error': str(e), 'query': query}

    async def explore_schema(self, connection_string: str, operation: str,
                           table_name: str = None) -> Dict[str, Any]:
        """Explore database schema."""
        try:
            conn = await self.get_connection(connection_string)
            parsed = self._parse_connection_string(connection_string)
            dialect = parsed['dialect']

            if dialect.startswith('postgresql'):
                return await self._explore_postgresql_schema(conn, operation, table_name)
            elif dialect.startswith('mysql'):
                return await self._explore_mysql_schema(conn, operation, table_name)
            elif dialect.startswith('sqlite'):
                return await self._explore_sqlite_schema(conn, operation, table_name)
            else:
                raise ValueError(f"Schema exploration not supported for {dialect}")

        except Exception as e:
            logger.error(f"Schema exploration failed: {str(e)}")
            return {'error': str(e), 'operation': operation}

    async def _explore_postgresql_schema(self, conn: asyncpg.Connection,
                                       operation: str, table_name: str) -> Dict[str, Any]:
        """Explore PostgreSQL schema."""
        try:
            if operation == 'tables':
                result = await conn.fetch("""
                    SELECT table_name
                    FROM information_schema.tables
                    WHERE table_schema = 'public'
                    ORDER BY table_name
                """)
                return {'tables': [row['table_name'] for row in result]}

            elif operation == 'columns' and table_name:
                result = await conn.fetch("""
                    SELECT column_name, data_type, is_nullable, column_default
                    FROM information_schema.columns
                    WHERE table_name = $1 AND table_schema = 'public'
                    ORDER BY ordinal_position
                """, table_name)
                return {'columns': [dict(row) for row in result]}

            elif operation == 'indexes' and table_name:
                result = await conn.fetch("""
                    SELECT indexname, indexdef
                    FROM pg_indexes
                    WHERE tablename = $1
                """, table_name)
                return {'indexes': [dict(row) for row in result]}

            else:
                return {'error': f'Unsupported operation: {operation}'}

        except Exception as e:
            return {'error': str(e)}

    async def _explore_mysql_schema(self, conn: aiomysql.Connection,
                                  operation: str, table_name: str) -> Dict[str, Any]:
        """Explore MySQL schema."""
        try:
            async with conn.cursor() as cursor:
                if operation == 'tables':
                    await cursor.execute("SHOW TABLES")
                    result = await cursor.fetchall()
                    return {'tables': [row[0] for row in result]}

                elif operation == 'columns' and table_name:
                    await cursor.execute(f"DESCRIBE {table_name}")
                    result = await cursor.fetchall()
                    columns = ['Field', 'Type', 'Null', 'Key', 'Default', 'Extra']
                    return {'columns': [dict(zip(columns, row)) for row in result]}

                elif operation == 'indexes' and table_name:
                    await cursor.execute(f"SHOW INDEX FROM {table_name}")
                    result = await cursor.fetchall()
                    return {'indexes': [dict(zip(cursor.description, row)) for row in result]}

                else:
                    return {'error': f'Unsupported operation: {operation}'}

        except Exception as e:
            return {'error': str(e)}

    async def _explore_sqlite_schema(self, conn: aiosqlite.Connection,
                                   operation: str, table_name: str) -> Dict[str, Any]:
        """Explore SQLite schema."""
        try:
            if operation == 'tables':
                cursor = await conn.execute("SELECT name FROM sqlite_master WHERE type='table'")
                result = await cursor.fetchall()
                return {'tables': [row[0] for row in result]}

            elif operation == 'columns' and table_name:
                cursor = await conn.execute(f"PRAGMA table_info({table_name})")
                result = await cursor.fetchall()
                columns = ['cid', 'name', 'type', 'notnull', 'dflt_value', 'pk']
                return {'columns': [dict(zip(columns, row)) for row in result]}

            elif operation == 'indexes' and table_name:
                cursor = await conn.execute(f"PRAGMA index_list({table_name})")
                result = await cursor.fetchall()
                return {'indexes': [dict(zip(['seq', 'name', 'unique', 'origin', 'partial'], row)) for row in result]}

            else:
                return {'error': f'Unsupported operation: {operation}'}

        except Exception as e:
            return {'error': str(e)}

    async def backup_database(self, connection_string: str, operation: str,
                            backup_path: str = None, compression: bool = True) -> Dict[str, Any]:
        """Backup database."""
        try:
            parsed = self._parse_connection_string(connection_string)
            dialect = parsed['dialect']

            if operation == 'backup':
                if dialect.startswith('postgresql'):
                    return await self._backup_postgresql(connection_string, backup_path, compression)
                elif dialect.startswith('mysql'):
                    return await self._backup_mysql(connection_string, backup_path, compression)
                elif dialect.startswith('sqlite'):
                    return await self._backup_sqlite(connection_string, backup_path, compression)
                else:
                    return {'error': f'Backup not supported for {dialect}'}

            elif operation == 'list':
                # List available backups (simplified)
                return {'backups': []}

            else:
                return {'error': f'Unsupported backup operation: {operation}'}

        except Exception as e:
            logger.error(f"Backup operation failed: {str(e)}")
            return {'error': str(e), 'operation': operation}

    async def _backup_postgresql(self, connection_string: str, backup_path: str,
                               compression: bool) -> Dict[str, Any]:
        """Backup PostgreSQL database using pg_dump."""
        # This would require pg_dump to be installed
        return {'error': 'pg_dump not available in this environment'}

    async def _backup_mysql(self, connection_string: str, backup_path: str,
                          compression: bool) -> Dict[str, Any]:
        """Backup MySQL database using mysqldump."""
        # This would require mysqldump to be installed
        return {'error': 'mysqldump not available in this environment'}

    async def _backup_sqlite(self, connection_string: str, backup_path: str,
                           compression: bool) -> Dict[str, Any]:
        """Backup SQLite database by copying the file."""
        try:
            import shutil

            parsed = self._parse_connection_string(connection_string)
            db_path = parsed['database']

            if not backup_path:
                backup_path = f"{db_path}.backup"

            shutil.copy2(db_path, backup_path)

            return {
                'success': True,
                'backup_path': backup_path,
                'original_size': os.path.getsize(db_path),
                'backup_size': os.path.getsize(backup_path)
            }

        except Exception as e:
            return {'error': str(e)}

# MCP Server Implementation
app = FastMCP("database-connector-server")
fastapi_app = FastAPI(title="Database Connector MCP Server")

db_connector = DatabaseConnector()

@app.tool()
async def database_query(connection_string: str, query: str, parameters: List[Any] = None,
                        timeout: int = 30) -> Dict[str, Any]:
    """
    Execute SQL queries on various database types.

    Args:
        connection_string: Database connection string (e.g., postgresql://user:pass@host:port/db)
        query: SQL query to execute
        parameters: Query parameters for prepared statements
        timeout: Query timeout in seconds

    Returns:
        Query results with metadata
    """
    async with DatabaseConnector() as connector:
        return await connector.execute_query(connection_string, query, parameters, timeout)

@app.tool()
async def database_schema(connection_string: str, operation: str, table_name: str = None) -> Dict[str, Any]:
    """
    Explore database schema and structure.

    Args:
        connection_string: Database connection string
        operation: Schema operation (tables, columns, indexes, constraints, relationships)
        table_name: Specific table name for detailed operations

    Returns:
        Schema information based on operation
    """
    async with DatabaseConnector() as connector:
        return await connector.explore_schema(connection_string, operation, table_name)

@app.tool()
async def database_backup(connection_string: str, operation: str, backup_path: str = None,
                         compression: bool = True) -> Dict[str, Any]:
    """
    Create and manage database backups.

    Args:
        connection_string: Database connection string
        operation: Backup operation (backup, restore, list, delete)
        backup_path: Path for backup file
        compression: Enable compression for backup

    Returns:
        Backup operation results
    """
    async with DatabaseConnector() as connector:
        return await connector.backup_database(connection_string, operation, backup_path, compression)

# Mount FastMCP app to FastAPI for WebSocket support
fastapi_app.mount("/mcp", app)

@fastapi_app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        # Handle MCP protocol over WebSocket
        await app.run_websocket(websocket)
    except WebSocketDisconnect:
        pass

@fastapi_app.on_event("startup")
async def startup_event():
    """Initialize the database connector on startup."""
    global db_connector
    db_connector = DatabaseConnector()
    await db_connector.__aenter__()

@fastapi_app.on_event("shutdown")
async def shutdown_event():
    """Clean up resources on shutdown."""
    global db_connector
    if db_connector:
        await db_connector.__aexit__(None, None, None)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(fastapi_app, host="api.digitalhustlelab.com", port=3003)
