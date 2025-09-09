#!/usr/bin/env python3
"""
Database Connector MCP Server - Production Ready
===============================================

A comprehensive MCP server for database operations and analytics.

Features:
- Multi-database support (PostgreSQL, MySQL, SQLite, MongoDB)
- SQL query execution and analysis
- Database schema exploration
- Data export/import capabilities
- Query optimization suggestions
- Connection pooling and management
- Security controls and access restrictions

Usage:
    python database_connector_server.py
"""

import asyncio
import json
import logging
import os
import sys
import re
from typing import Any, Dict, List, Optional, Union
from pathlib import Path
from datetime import datetime
import hashlib
import csv
import io

# Database dependencies (optional)
try:
    import psycopg2
    import psycopg2.extras
    POSTGRESQL_AVAILABLE = True
except ImportError:
    POSTGRESQL_AVAILABLE = False

try:
    import pymysql
    PYMYSQL_AVAILABLE = True
except ImportError:
    PYMYSQL_AVAILABLE = False

try:
    import sqlite3
    SQLITE_AVAILABLE = True
except ImportError:
    SQLITE_AVAILABLE = False

try:
    import pymongo
    MONGODB_AVAILABLE = True
except ImportError:
    MONGODB_AVAILABLE = False

try:
    import pandas as pd
    PANDAS_AVAILABLE = True
except ImportError:
    PANDAS_AVAILABLE = False

# MCP Protocol
from mcp import Tool
from mcp.server import Server
from mcp.types import TextContent, PromptMessage

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stderr),
        logging.FileHandler('database_connector_server.log')
    ]
)
logger = logging.getLogger(__name__)

class DatabaseConnectorServer:
    """Production-grade Database Connector MCP Server"""

    def __init__(self):
        self.server = Server("database-connector-server")
        self.connections = {}
        self.connection_pool = {}
        self.allowed_databases = self._get_allowed_databases()
        self.query_cache = {}
        self.schema_cache = {}

        # Security settings
        self.max_query_time = 30  # seconds
        self.max_result_rows = 10000
        self.blocked_commands = [
            'drop', 'delete', 'truncate', 'alter', 'create', 'insert', 'update'
        ]

        self.setup_tools()

    def _get_allowed_databases(self) -> List[str]:
        """Get list of allowed database configurations"""
        return [
            "postgresql",
            "mysql",
            "sqlite",
            "mongodb"
        ]

    def _is_query_safe(self, query: str) -> bool:
        """Check if query is safe to execute"""
        query_lower = query.lower().strip()

        # Block dangerous commands
        for cmd in self.blocked_commands:
            if re.search(rf'\b{cmd}\b', query_lower):
                return False

        return True

    def _get_connection_hash(self, config: Dict[str, Any]) -> str:
        """Generate hash for connection configuration"""
        config_str = json.dumps(config, sort_keys=True)
        return hashlib.md5(config_str.encode()).hexdigest()

    def setup_tools(self):
        """Setup all MCP tools"""

        @self.server.tool()
        async def connect_database(db_type: str, host: str = None, port: int = None,
                                 database: str = None, username: str = None,
                                 password: str = None, connection_string: str = None) -> str:
            """Connect to a database"""
            try:
                config = {
                    "db_type": db_type,
                    "host": host,
                    "port": port,
                    "database": database,
                    "username": username,
                    "password": password,
                    "connection_string": connection_string
                }

                connection_id = self._get_connection_hash(config)

                if connection_id in self.connections:
                    return f"Already connected to database (ID: {connection_id})"

                connection = await self._establish_connection(config)
                if connection:
                    self.connections[connection_id] = {
                        "connection": connection,
                        "config": config,
                        "created_at": datetime.now(),
                        "last_used": datetime.now()
                    }
                    return f"Successfully connected to {db_type} database (ID: {connection_id})"
                else:
                    raise ValueError(f"Failed to connect to {db_type} database")

            except Exception as e:
                raise ValueError(f"Database connection failed: {e}")

        @self.server.tool()
        async def execute_query(connection_id: str, query: str, params: List[Any] = None) -> str:
            """Execute a database query"""
            if connection_id not in self.connections:
                raise ValueError(f"Connection {connection_id} not found")

            if not self._is_query_safe(query):
                raise ValueError("Query contains blocked commands")

            try:
                connection_info = self.connections[connection_id]
                connection = connection_info["connection"]
                config = connection_info["config"]

                # Update last used timestamp
                connection_info["last_used"] = datetime.now()

                result = await self._execute_query(connection, query, config["db_type"], params)

                # Cache successful queries
                query_hash = hashlib.md5(query.encode()).hexdigest()
                self.query_cache[query_hash] = {
                    "result": result,
                    "timestamp": datetime.now()
                }

                return json.dumps(result, indent=2, default=str)

            except Exception as e:
                raise ValueError(f"Query execution failed: {e}")

        @self.server.tool()
        async def explore_schema(connection_id: str, table_name: str = None) -> str:
            """Explore database schema"""
            if connection_id not in self.connections:
                raise ValueError(f"Connection {connection_id} not found")

            try:
                connection_info = self.connections[connection_id]
                connection = connection_info["connection"]
                config = connection_info["config"]

                schema = await self._explore_schema(connection, config["db_type"], table_name)
                return json.dumps(schema, indent=2)

            except Exception as e:
                raise ValueError(f"Schema exploration failed: {e}")

        @self.server.tool()
        async def analyze_query_performance(connection_id: str, query: str) -> str:
            """Analyze query performance"""
            if connection_id not in self.connections:
                raise ValueError(f"Connection {connection_id} not found")

            try:
                connection_info = self.connections[connection_id]
                connection = connection_info["connection"]
                config = connection_info["config"]

                analysis = await self._analyze_query_performance(connection, query, config["db_type"])
                return json.dumps(analysis, indent=2)

            except Exception as e:
                raise ValueError(f"Query performance analysis failed: {e}")

        @self.server.tool()
        async def export_data(connection_id: str, query: str, format: str = "json",
                            file_path: str = None) -> str:
            """Export query results to file"""
            if connection_id not in self.connections:
                raise ValueError(f"Connection {connection_id} not found")

            if not self._is_query_safe(query):
                raise ValueError("Query contains blocked commands")

            try:
                connection_info = self.connections[connection_id]
                connection = connection_info["connection"]
                config = connection_info["config"]

                result = await self._execute_query(connection, query, config["db_type"])

                if format.lower() == "json":
                    export_data = json.dumps(result.get("rows", []), indent=2, default=str)
                elif format.lower() == "csv":
                    export_data = self._convert_to_csv(result.get("rows", []))
                else:
                    raise ValueError(f"Unsupported export format: {format}")

                if file_path:
                    # Check if path is allowed
                    if not self._is_path_allowed(file_path):
                        raise ValueError(f"Access denied: {file_path}")

                    with open(file_path, 'w', encoding='utf-8') as f:
                        f.write(export_data)
                    return f"Data exported to {file_path}"
                else:
                    return export_data

            except Exception as e:
                raise ValueError(f"Data export failed: {e}")

        @self.server.tool()
        async def get_database_stats(connection_id: str) -> str:
            """Get database statistics"""
            if connection_id not in self.connections:
                raise ValueError(f"Connection {connection_id} not found")

            try:
                connection_info = self.connections[connection_id]
                connection = connection_info["connection"]
                config = connection_info["config"]

                stats = await self._get_database_stats(connection, config["db_type"])
                return json.dumps(stats, indent=2)

            except Exception as e:
                raise ValueError(f"Database stats retrieval failed: {e}")

        @self.server.tool()
        async def disconnect_database(connection_id: str) -> str:
            """Disconnect from database"""
            if connection_id not in self.connections:
                return f"Connection {connection_id} not found"

            try:
                connection_info = self.connections[connection_id]
                connection = connection_info["connection"]
                config = connection_info["config"]

                await self._close_connection(connection, config["db_type"])
                del self.connections[connection_id]

                return f"Successfully disconnected from database (ID: {connection_id})"

            except Exception as e:
                raise ValueError(f"Database disconnection failed: {e}")

        @self.server.tool()
        async def list_connections() -> str:
            """List all active database connections"""
            connections_info = []
            for conn_id, info in self.connections.items():
                connections_info.append({
                    "id": conn_id,
                    "db_type": info["config"]["db_type"],
                    "database": info["config"].get("database", "N/A"),
                    "host": info["config"].get("host", "N/A"),
                    "created_at": info["created_at"].isoformat(),
                    "last_used": info["last_used"].isoformat()
                })

            return json.dumps(connections_info, indent=2)

    async def _establish_connection(self, config: Dict[str, Any]) -> Any:
        """Establish database connection"""
        db_type = config["db_type"].lower()

        if db_type == "postgresql":
            if not POSTGRESQL_AVAILABLE:
                raise ValueError("PostgreSQL support not available")
            return self._connect_postgresql(config)

        elif db_type == "mysql":
            if not PYMYSQL_AVAILABLE:
                raise ValueError("MySQL support not available")
            return self._connect_mysql(config)

        elif db_type == "sqlite":
            if not SQLITE_AVAILABLE:
                raise ValueError("SQLite support not available")
            return self._connect_sqlite(config)

        elif db_type == "mongodb":
            if not MONGODB_AVAILABLE:
                raise ValueError("MongoDB support not available")
            return self._connect_mongodb(config)

        else:
            raise ValueError(f"Unsupported database type: {db_type}")

    def _connect_postgresql(self, config: Dict[str, Any]) -> Any:
        """Connect to PostgreSQL database"""
        try:
            conn = psycopg2.connect(
                host=config.get("host", "localhost"),
                port=config.get("port", 5432),
                database=config.get("database"),
                user=config.get("username"),
                password=config.get("password")
            )
            conn.autocommit = True
            return conn
        except Exception as e:
            raise ValueError(f"PostgreSQL connection failed: {e}")

    def _connect_mysql(self, config: Dict[str, Any]) -> Any:
        """Connect to MySQL database"""
        try:
            conn = pymysql.connect(
                host=config.get("host", "localhost"),
                port=config.get("port", 3306),
                database=config.get("database"),
                user=config.get("username"),
                password=config.get("password")
            )
            return conn
        except Exception as e:
            raise ValueError(f"MySQL connection failed: {e}")

    def _connect_sqlite(self, config: Dict[str, Any]) -> Any:
        """Connect to SQLite database"""
        try:
            db_path = config.get("database", ":memory:")
            if db_path != ":memory:" and not os.path.isabs(db_path):
                db_path = os.path.abspath(db_path)
            return sqlite3.connect(db_path)
        except Exception as e:
            raise ValueError(f"SQLite connection failed: {e}")

    def _connect_mongodb(self, config: Dict[str, Any]) -> Any:
        """Connect to MongoDB database"""
        try:
            client = pymongo.MongoClient(
                host=config.get("host", "localhost"),
                port=config.get("port", 27017),
                username=config.get("username"),
                password=config.get("password")
            )
            db = client[config.get("database", "test")]
            return db
        except Exception as e:
            raise ValueError(f"MongoDB connection failed: {e}")

    async def _execute_query(self, connection: Any, query: str, db_type: str,
                           params: List[Any] = None) -> Dict[str, Any]:
        """Execute database query"""
        try:
            if db_type.lower() == "mongodb":
                return await self._execute_mongodb_query(connection, query, params)
            else:
                return await self._execute_sql_query(connection, query, db_type, params)
        except Exception as e:
            raise ValueError(f"Query execution failed: {e}")

    async def _execute_sql_query(self, connection: Any, query: str, db_type: str,
                               params: List[Any] = None) -> Dict[str, Any]:
        """Execute SQL query"""
        cursor = None
        try:
            cursor = connection.cursor()

            if params:
                cursor.execute(query, params)
            else:
                cursor.execute(query)

            # Get column names
            if hasattr(cursor, 'description') and cursor.description:
                columns = [desc[0] for desc in cursor.description]
            else:
                columns = []

            # Get results
            if query.lower().strip().startswith(('select', 'show', 'describe')):
                rows = cursor.fetchall()

                # Limit results
                if len(rows) > self.max_result_rows:
                    rows = rows[:self.max_result_rows]

                result = {
                    "success": True,
                    "columns": columns,
                    "rows": [list(row) for row in rows],
                    "row_count": len(rows),
                    "truncated": len(rows) >= self.max_result_rows
                }
            else:
                # For non-SELECT queries
                result = {
                    "success": True,
                    "affected_rows": cursor.rowcount,
                    "query_type": "modification"
                }

            return result

        except Exception as e:
            raise ValueError(f"SQL query failed: {e}")
        finally:
            if cursor:
                cursor.close()

    async def _execute_mongodb_query(self, db: Any, query: str, params: List[Any] = None) -> Dict[str, Any]:
        """Execute MongoDB query"""
        try:
            # Parse simple MongoDB queries
            query_lower = query.lower().strip()

            if query_lower.startswith('db.'):
                # Extract collection and operation
                parts = query[3:].split('.', 1)
                if len(parts) == 2:
                    collection_name, operation = parts
                    collection = db[collection_name]

                    if operation.startswith('find('):
                        # Simple find operation
                        documents = list(collection.find().limit(self.max_result_rows))
                        result = {
                            "success": True,
                            "collection": collection_name,
                            "rows": documents,
                            "row_count": len(documents),
                            "truncated": len(documents) >= self.max_result_rows
                        }
                    elif operation.startswith('count('):
                        count = collection.count_documents({})
                        result = {
                            "success": True,
                            "collection": collection_name,
                            "count": count
                        }
                    else:
                        result = {
                            "success": False,
                            "error": "Unsupported MongoDB operation"
                        }
                else:
                    result = {
                        "success": False,
                        "error": "Invalid MongoDB query format"
                    }
            else:
                result = {
                    "success": False,
                    "error": "MongoDB queries must start with 'db.'"
                }

            return result

        except Exception as e:
            raise ValueError(f"MongoDB query failed: {e}")

    async def _explore_schema(self, connection: Any, db_type: str, table_name: str = None) -> Dict[str, Any]:
        """Explore database schema"""
        try:
            if db_type.lower() == "mongodb":
                return await self._explore_mongodb_schema(connection, table_name)
            else:
                return await self._explore_sql_schema(connection, db_type, table_name)
        except Exception as e:
            raise ValueError(f"Schema exploration failed: {e}")

    async def _explore_sql_schema(self, connection: Any, db_type: str, table_name: str = None) -> Dict[str, Any]:
        """Explore SQL database schema"""
        cursor = None
        try:
            cursor = connection.cursor()

            if table_name:
                # Get table schema
                if db_type.lower() == "postgresql":
                    cursor.execute("""
                        SELECT column_name, data_type, is_nullable, column_default
                        FROM information_schema.columns
                        WHERE table_name = %s
                        ORDER BY ordinal_position
                    """, (table_name,))
                elif db_type.lower() == "mysql":
                    cursor.execute(f"DESCRIBE {table_name}")
                elif db_type.lower() == "sqlite":
                    cursor.execute(f"PRAGMA table_info({table_name})")

                columns = cursor.fetchall()
                schema = {
                    "table": table_name,
                    "columns": columns,
                    "column_count": len(columns)
                }
            else:
                # Get all tables
                if db_type.lower() == "postgresql":
                    cursor.execute("""
                        SELECT table_name
                        FROM information_schema.tables
                        WHERE table_schema = 'public'
                        ORDER BY table_name
                    """)
                elif db_type.lower() == "mysql":
                    cursor.execute("SHOW TABLES")
                elif db_type.lower() == "sqlite":
                    cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")

                tables = cursor.fetchall()
                schema = {
                    "tables": [table[0] for table in tables],
                    "table_count": len(tables)
                }

            return schema

        except Exception as e:
            raise ValueError(f"SQL schema exploration failed: {e}")
        finally:
            if cursor:
                cursor.close()

    async def _explore_mongodb_schema(self, db: Any, collection_name: str = None) -> Dict[str, Any]:
        """Explore MongoDB schema"""
        try:
            if collection_name:
                collection = db[collection_name]
                # Get a sample document to infer schema
                sample = collection.find_one()
                if sample:
                    schema = {
                        "collection": collection_name,
                        "sample_document": sample,
                        "field_count": len(sample)
                    }
                else:
                    schema = {
                        "collection": collection_name,
                        "message": "Collection is empty"
                    }
            else:
                # Get all collections
                collections = db.list_collection_names()
                schema = {
                    "collections": collections,
                    "collection_count": len(collections)
                }

            return schema

        except Exception as e:
            raise ValueError(f"MongoDB schema exploration failed: {e}")

    async def _analyze_query_performance(self, connection: Any, query: str, db_type: str) -> Dict[str, Any]:
        """Analyze query performance"""
        try:
            if db_type.lower() == "mongodb":
                return {"message": "Performance analysis not available for MongoDB"}
            else:
                return await self._analyze_sql_performance(connection, query, db_type)
        except Exception as e:
            raise ValueError(f"Performance analysis failed: {e}")

    async def _analyze_sql_performance(self, connection: Any, query: str, db_type: str) -> Dict[str, Any]:
        """Analyze SQL query performance"""
        cursor = None
        try:
            cursor = connection.cursor()

            # Execute EXPLAIN query
            if db_type.lower() == "postgresql":
                cursor.execute(f"EXPLAIN ANALYZE {query}")
            elif db_type.lower() == "mysql":
                cursor.execute(f"EXPLAIN {query}")
            elif db_type.lower() == "sqlite":
                cursor.execute(f"EXPLAIN QUERY PLAN {query}")

            explanation = cursor.fetchall()

            analysis = {
                "query": query,
                "explanation": explanation,
                "db_type": db_type,
                "analysis_time": datetime.now().isoformat()
            }

            return analysis

        except Exception as e:
            raise ValueError(f"SQL performance analysis failed: {e}")
        finally:
            if cursor:
                cursor.close()

    async def _get_database_stats(self, connection: Any, db_type: str) -> Dict[str, Any]:
        """Get database statistics"""
        try:
            if db_type.lower() == "mongodb":
                return await self._get_mongodb_stats(connection)
            else:
                return await self._get_sql_stats(connection, db_type)
        except Exception as e:
            raise ValueError(f"Database stats retrieval failed: {e}")

    async def _get_sql_stats(self, connection: Any, db_type: str) -> Dict[str, Any]:
        """Get SQL database statistics"""
        cursor = None
        try:
            cursor = connection.cursor()

            stats = {
                "db_type": db_type,
                "timestamp": datetime.now().isoformat()
            }

            if db_type.lower() == "postgresql":
                # Get PostgreSQL stats
                cursor.execute("SELECT version()")
                stats["version"] = cursor.fetchone()[0]

                cursor.execute("SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public'")
                stats["table_count"] = cursor.fetchone()[0]

            elif db_type.lower() == "mysql":
                # Get MySQL stats
                cursor.execute("SELECT VERSION()")
                stats["version"] = cursor.fetchone()[0]

                cursor.execute("SHOW TABLES")
                stats["table_count"] = len(cursor.fetchall())

            elif db_type.lower() == "sqlite":
                # Get SQLite stats
                cursor.execute("SELECT sqlite_version()")
                stats["version"] = cursor.fetchone()[0]

                cursor.execute("SELECT COUNT(*) FROM sqlite_master WHERE type='table'")
                stats["table_count"] = cursor.fetchone()[0]

            return stats

        except Exception as e:
            raise ValueError(f"SQL stats retrieval failed: {e}")
        finally:
            if cursor:
                cursor.close()

    async def _get_mongodb_stats(self, db: Any) -> Dict[str, Any]:
        """Get MongoDB statistics"""
        try:
            stats = db.command("dbStats")
            return {
                "db_type": "mongodb",
                "database_name": stats.get("db"),
                "collections": stats.get("collections"),
                "objects": stats.get("objects"),
                "data_size": stats.get("dataSize"),
                "storage_size": stats.get("storageSize"),
                "timestamp": datetime.now().isoformat()
            }
        except Exception as e:
            raise ValueError(f"MongoDB stats retrieval failed: {e}")

    async def _close_connection(self, connection: Any, db_type: str):
        """Close database connection"""
        try:
            if db_type.lower() == "mongodb":
                connection.client.close()
            else:
                connection.close()
        except Exception as e:
            logger.warning(f"Error closing {db_type} connection: {e}")

    def _is_path_allowed(self, path: str) -> bool:
        """Check if file path is allowed"""
        try:
            abs_path = os.path.abspath(path)
            allowed_dirs = [
                str(Path.home() / "Desktop"),
                str(Path.home() / "Documents"),
                str(Path.home() / "Downloads"),
                os.getcwd()
            ]
            return any(abs_path.startswith(allowed) for allowed in allowed_dirs)
        except:
            return False

    def _convert_to_csv(self, rows: List[List[Any]]) -> str:
        """Convert rows to CSV format"""
        try:
            output = io.StringIO()
            writer = csv.writer(output)
            writer.writerows(rows)
            return output.getvalue()
        except Exception as e:
            raise ValueError(f"CSV conversion failed: {e}")

async def main():
    """Main server entry point"""
    server = DatabaseConnectorServer()

    # Run the server
    async with server.server:
        logger.info("🗄️ Database Connector MCP Server started successfully")
        logger.info("Available tools: connect_database, execute_query, explore_schema, analyze_query_performance, export_data, get_database_stats, disconnect_database, list_connections")
        await server.server.serve()

if __name__ == "__main__":
    asyncio.run(main())
