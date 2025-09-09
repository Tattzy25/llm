#!/usr/bin/env python3
"""
MCP Database Tools
==================

Database-related tools for MCP servers.
Provides database connection, query execution, and data management utilities.
"""

import json
import sqlite3
from typing import Dict, List, Optional, Any, Union
from datetime import datetime

from ..core import MCPValidationError


class MCPDatabaseTools:
    """Basic database tools for MCP servers."""

    @staticmethod
    def connect_sqlite(database_path: str) -> Dict[str, Any]:
        """Connect to a SQLite database."""
        try:
            conn = sqlite3.connect(database_path)
            cursor = conn.cursor()

            # Get database info
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
            tables = cursor.fetchall()

            cursor.execute("PRAGMA database_list;")
            db_info = cursor.fetchone()

            conn.close()

            return {
                "database_path": database_path,
                "database_type": "SQLite",
                "connected": True,
                "tables": [table[0] for table in tables],
                "database_file": db_info[2] if db_info else None
            }
        except Exception as e:
            raise MCPValidationError(f"Failed to connect to SQLite database: {str(e)}")

    @staticmethod
    def execute_sqlite_query(database_path: str, query: str,
                           params: Optional[List[Any]] = None) -> Dict[str, Any]:
        """Execute a SQLite query."""
        try:
            conn = sqlite3.connect(database_path)
            cursor = conn.cursor()

            if params:
                cursor.execute(query, params)
            else:
                cursor.execute(query)

            # Get results for SELECT queries
            if query.strip().upper().startswith("SELECT"):
                columns = [desc[0] for desc in cursor.description]
                rows = cursor.fetchall()

                result = {
                    "query": query,
                    "columns": columns,
                    "rows": rows,
                    "row_count": len(rows),
                    "success": True
                }
            else:
                # For non-SELECT queries
                conn.commit()
                result = {
                    "query": query,
                    "rows_affected": cursor.rowcount,
                    "success": True
                }

            conn.close()
            return result
        except Exception as e:
            raise MCPValidationError(f"Failed to execute SQLite query: {str(e)}")

    @staticmethod
    def get_table_schema(database_path: str, table_name: str) -> Dict[str, Any]:
        """Get schema information for a SQLite table."""
        try:
            conn = sqlite3.connect(database_path)
            cursor = conn.cursor()

            # Get table info
            cursor.execute(f"PRAGMA table_info({table_name});")
            columns = cursor.fetchall()

            # Get indexes
            cursor.execute(f"PRAGMA index_list({table_name});")
            indexes = cursor.fetchall()

            # Get foreign keys
            cursor.execute(f"PRAGMA foreign_key_list({table_name});")
            foreign_keys = cursor.fetchall()

            conn.close()

            schema = {
                "table_name": table_name,
                "columns": [
                    {
                        "name": col[1],
                        "type": col[2],
                        "not_null": bool(col[3]),
                        "default_value": col[4],
                        "primary_key": bool(col[5])
                    }
                    for col in columns
                ],
                "indexes": [
                    {
                        "name": idx[1],
                        "unique": bool(idx[2]),
                        "origin": idx[3],
                        "partial": bool(idx[4])
                    }
                    for idx in indexes
                ],
                "foreign_keys": [
                    {
                        "id": fk[0],
                        "seq": fk[1],
                        "table": fk[2],
                        "from": fk[3],
                        "to": fk[4],
                        "on_update": fk[5],
                        "on_delete": fk[6],
                        "match": fk[7]
                    }
                    for fk in foreign_keys
                ]
            }

            return schema
        except Exception as e:
            raise MCPValidationError(f"Failed to get table schema: {str(e)}")

    @staticmethod
    def backup_database(source_path: str, backup_path: str) -> Dict[str, Any]:
        """Create a backup of a SQLite database."""
        try:
            import shutil
            from pathlib import Path

            source = Path(source_path)
            backup = Path(backup_path)

            if not source.exists():
                raise MCPValidationError(f"Source database not found: {source_path}")

            # Create backup directory if it doesn't exist
            backup.parent.mkdir(parents=True, exist_ok=True)

            # Copy the database file
            shutil.copy2(source, backup)

            # Verify backup
            source_size = source.stat().st_size
            backup_size = backup.stat().st_size

            return {
                "source_path": str(source),
                "backup_path": str(backup),
                "source_size": source_size,
                "backup_size": backup_size,
                "backup_successful": source_size == backup_size,
                "timestamp": datetime.now().isoformat()
            }
        except Exception as e:
            raise MCPValidationError(f"Failed to backup database: {str(e)}")


class MCPQueryTools:
    """Database query building and optimization tools."""

    @staticmethod
    def build_select_query(table: str, columns: Optional[List[str]] = None,
                          where: Optional[Dict[str, Any]] = None,
                          order_by: Optional[List[str]] = None,
                          limit: Optional[int] = None) -> str:
        """Build a SELECT query from parameters."""
        try:
            # Build column list
            if columns:
                column_str = ", ".join(columns)
            else:
                column_str = "*"

            query = f"SELECT {column_str} FROM {table}"

            # Add WHERE clause
            if where:
                conditions = []
                for key, value in where.items():
                    if isinstance(value, str):
                        conditions.append(f"{key} = '{value}'")
                    else:
                        conditions.append(f"{key} = {value}")
                query += f" WHERE {' AND '.join(conditions)}"

            # Add ORDER BY clause
            if order_by:
                query += f" ORDER BY {', '.join(order_by)}"

            # Add LIMIT clause
            if limit:
                query += f" LIMIT {limit}"

            return query
        except Exception as e:
            raise MCPValidationError(f"Failed to build SELECT query: {str(e)}")

    @staticmethod
    def build_insert_query(table: str, data: Dict[str, Any]) -> str:
        """Build an INSERT query from data dictionary."""
        try:
            columns = list(data.keys())
            values = list(data.values())

            column_str = ", ".join(columns)
            value_placeholders = ", ".join(["?" for _ in values])

            query = f"INSERT INTO {table} ({column_str}) VALUES ({value_placeholders})"
            return query
        except Exception as e:
            raise MCPValidationError(f"Failed to build INSERT query: {str(e)}")

    @staticmethod
    def build_update_query(table: str, data: Dict[str, Any],
                          where: Dict[str, Any]) -> str:
        """Build an UPDATE query from data and conditions."""
        try:
            # Build SET clause
            set_parts = []
            for key, value in data.items():
                if isinstance(value, str):
                    set_parts.append(f"{key} = '{value}'")
                else:
                    set_parts.append(f"{key} = {value}")
            set_clause = ", ".join(set_parts)

            # Build WHERE clause
            where_parts = []
            for key, value in where.items():
                if isinstance(value, str):
                    where_parts.append(f"{key} = '{value}'")
                else:
                    where_parts.append(f"{key} = {value}")
            where_clause = " AND ".join(where_parts)

            query = f"UPDATE {table} SET {set_clause} WHERE {where_clause}"
            return query
        except Exception as e:
            raise MCPValidationError(f"Failed to build UPDATE query: {str(e)}")

    @staticmethod
    def analyze_query_performance(database_path: str, query: str,
                                iterations: int = 1) -> Dict[str, Any]:
        """Analyze query performance."""
        try:
            import time

            conn = sqlite3.connect(database_path)
            cursor = conn.cursor()

            # Enable query statistics if available
            try:
                cursor.execute("PRAGMA cache_size = 10000;")
                cursor.execute("PRAGMA temp_store = memory;")
            except:
                pass

            execution_times = []

            for _ in range(iterations):
                start_time = time.time()
                cursor.execute(query)
                if query.strip().upper().startswith("SELECT"):
                    cursor.fetchall()
                end_time = time.time()

                execution_times.append(end_time - start_time)

            conn.close()

            avg_time = sum(execution_times) / len(execution_times)
            min_time = min(execution_times)
            max_time = max(execution_times)

            return {
                "query": query,
                "iterations": iterations,
                "average_time": round(avg_time, 6),
                "min_time": round(min_time, 6),
                "max_time": round(max_time, 6),
                "total_time": round(sum(execution_times), 6),
                "performance_rating": "fast" if avg_time < 0.01 else "medium" if avg_time < 0.1 else "slow"
            }
        except Exception as e:
            raise MCPValidationError(f"Failed to analyze query performance: {str(e)}")


class MCPMigrationTools:
    """Database migration and schema management tools."""

    @staticmethod
    def create_migration_script(old_schema: Dict[str, Any],
                              new_schema: Dict[str, Any]) -> List[str]:
        """Generate migration scripts from schema differences."""
        try:
            migrations = []

            old_tables = {table["name"]: table for table in old_schema.get("tables", [])}
            new_tables = {table["name"]: table for table in new_schema.get("tables", [])}

            # Find new tables
            for table_name, table_info in new_tables.items():
                if table_name not in old_tables:
                    columns = []
                    for col in table_info["columns"]:
                        col_def = f"{col['name']} {col['type']}"
                        if col.get("primary_key"):
                            col_def += " PRIMARY KEY"
                        if col.get("not_null"):
                            col_def += " NOT NULL"
                        if col.get("default_value"):
                            col_def += f" DEFAULT {col['default_value']}"
                        columns.append(col_def)

                    migrations.append(f"CREATE TABLE {table_name} ({', '.join(columns)});")

            # Find dropped tables
            for table_name in old_tables:
                if table_name not in new_tables:
                    migrations.append(f"DROP TABLE {table_name};")

            # Find altered tables
            for table_name in new_tables:
                if table_name in old_tables:
                    old_columns = {col["name"]: col for col in old_tables[table_name]["columns"]}
                    new_columns = {col["name"]: col for col in new_tables[table_name]["columns"]}

                    # Find new columns
                    for col_name, col_info in new_columns.items():
                        if col_name not in old_columns:
                            col_def = f"{col_info['name']} {col_info['type']}"
                            if col_info.get("not_null"):
                                col_def += " NOT NULL"
                            if col_info.get("default_value"):
                                col_def += f" DEFAULT {col_info['default_value']}"
                            migrations.append(f"ALTER TABLE {table_name} ADD COLUMN {col_def};")

                    # Find dropped columns (SQLite doesn't support DROP COLUMN directly)
                    for col_name in old_columns:
                        if col_name not in new_columns:
                            migrations.append(f"-- Note: SQLite doesn't support DROP COLUMN for {table_name}.{col_name}")
                            migrations.append(f"-- Consider recreating table without this column")

            return migrations
        except Exception as e:
            raise MCPValidationError(f"Failed to create migration script: {str(e)}")

    @staticmethod
    def validate_database_integrity(database_path: str) -> Dict[str, Any]:
        """Validate database integrity and check for corruption."""
        try:
            conn = sqlite3.connect(database_path)
            cursor = conn.cursor()

            # Run integrity check
            cursor.execute("PRAGMA integrity_check;")
            integrity_result = cursor.fetchone()[0]

            # Get database statistics
            cursor.execute("PRAGMA page_count;")
            page_count = cursor.fetchone()[0]

            cursor.execute("PRAGMA page_size;")
            page_size = cursor.fetchone()[0]

            cursor.execute("PRAGMA freelist_count;")
            freelist_count = cursor.fetchone()[0]

            # Check for foreign key violations
            cursor.execute("PRAGMA foreign_key_check;")
            fk_violations = cursor.fetchall()

            conn.close()

            return {
                "database_path": database_path,
                "integrity_check": integrity_result,
                "database_size": page_count * page_size,
                "page_count": page_count,
                "page_size": page_size,
                "freelist_count": freelist_count,
                "foreign_key_violations": len(fk_violations),
                "is_healthy": integrity_result == "ok" and len(fk_violations) == 0
            }
        except Exception as e:
            raise MCPValidationError(f"Failed to validate database integrity: {str(e)}")

    @staticmethod
    def optimize_database(database_path: str) -> Dict[str, Any]:
        """Optimize database performance."""
        try:
            conn = sqlite3.connect(database_path)
            cursor = conn.cursor()

            # Run optimization commands
            cursor.execute("VACUUM;")
            cursor.execute("REINDEX;")
            cursor.execute("ANALYZE;")

            # Get optimization results
            cursor.execute("PRAGMA page_count;")
            page_count = cursor.fetchone()[0]

            cursor.execute("PRAGMA freelist_count;")
            freelist_count = cursor.fetchone()[0]

            conn.close()

            return {
                "database_path": database_path,
                "optimization_completed": True,
                "page_count": page_count,
                "freelist_count": freelist_count,
                "timestamp": datetime.now().isoformat()
            }
        except Exception as e:
            raise MCPValidationError(f"Failed to optimize database: {str(e)}")
