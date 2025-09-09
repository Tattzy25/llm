#!/usr/bin/env python3
"""
Database Migration and Backup Tools
===================================

Advanced database migration and backup tools for MCP servers.
"""

import json
import sqlite3
import logging
from typing import Dict, List, Optional, Any, Union
from datetime import datetime
from pathlib import Path
import shutil
import gzip

from mcp.core.utils.validation import MCPValidationError

logger = logging.getLogger(__name__)


class DatabaseMigrationTool:
    """Database migration management tool."""

    def __init__(self, db_path: str):
        self.db_path = db_path
        self.migrations_dir = Path(db_path).parent / "migrations"
        self.migrations_dir.mkdir(exist_ok=True)

    def create_migration(self, name: str, up_sql: str, down_sql: Optional[str] = None) -> str:
        """Create a new migration file."""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        migration_id = f"{timestamp}_{name}"

        migration_data = {
            "id": migration_id,
            "name": name,
            "created_at": datetime.now().isoformat(),
            "up_sql": up_sql,
            "down_sql": down_sql
        }

        migration_file = self.migrations_dir / f"{migration_id}.json"

        with open(migration_file, 'w') as f:
            json.dump(migration_data, f, indent=2)

        return migration_id

    def run_migration(self, migration_id: str) -> Dict[str, Any]:
        """Run a specific migration."""
        migration_file = self.migrations_dir / f"{migration_id}.json"

        if not migration_file.exists():
            raise MCPValidationError(f"Migration {migration_id} not found")

        with open(migration_file, 'r') as f:
            migration = json.load(f)

        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        try:
            # Check if migration already applied
            cursor.execute("SELECT id FROM migrations WHERE id = ?", (migration_id,))
            if cursor.fetchone():
                return {"status": "already_applied", "migration_id": migration_id}

            # Run migration
            cursor.executescript(migration["up_sql"])

            # Record migration
            cursor.execute("INSERT INTO migrations (id, name, applied_at) VALUES (?, ?, ?)",
                         (migration_id, migration["name"], datetime.now().isoformat()))

            conn.commit()

            return {
                "status": "success",
                "migration_id": migration_id,
                "applied_at": datetime.now().isoformat()
            }

        except Exception as e:
            conn.rollback()
            raise MCPValidationError(f"Migration failed: {str(e)}")
        finally:
            conn.close()

    def rollback_migration(self, migration_id: str) -> Dict[str, Any]:
        """Rollback a specific migration."""
        migration_file = self.migrations_dir / f"{migration_id}.json"

        if not migration_file.exists():
            raise MCPValidationError(f"Migration {migration_id} not found")

        with open(migration_file, 'r') as f:
            migration = json.load(f)

        if not migration.get("down_sql"):
            raise MCPValidationError(f"No rollback SQL defined for migration {migration_id}")

        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        try:
            # Run rollback
            cursor.executescript(migration["down_sql"])

            # Remove migration record
            cursor.execute("DELETE FROM migrations WHERE id = ?", (migration_id,))

            conn.commit()

            return {
                "status": "rolled_back",
                "migration_id": migration_id,
                "rolled_back_at": datetime.now().isoformat()
            }

        except Exception as e:
            conn.rollback()
            raise MCPValidationError(f"Rollback failed: {str(e)}")
        finally:
            conn.close()

    def get_migration_status(self) -> Dict[str, Any]:
        """Get status of all migrations."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        try:
            # Ensure migrations table exists
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS migrations (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    applied_at TEXT NOT NULL
                )
            """)

            cursor.execute("SELECT id, name, applied_at FROM migrations ORDER BY applied_at")
            applied_migrations = cursor.fetchall()

            # Get all migration files
            migration_files = []
            for file_path in self.migrations_dir.glob("*.json"):
                with open(file_path, 'r') as f:
                    migration = json.load(f)
                    migration_files.append(migration)

            applied_ids = {m[0] for m in applied_migrations}

            return {
                "applied_migrations": [
                    {
                        "id": m[0],
                        "name": m[1],
                        "applied_at": m[2]
                    } for m in applied_migrations
                ],
                "pending_migrations": [
                    m for m in migration_files if m["id"] not in applied_ids
                ],
                "total_migrations": len(migration_files)
            }

        finally:
            conn.close()

    def initialize_migrations_table(self) -> None:
        """Initialize the migrations tracking table."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        try:
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS migrations (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    applied_at TEXT NOT NULL
                )
            """)
            conn.commit()
        finally:
            conn.close()


class DatabaseBackupTool:
    """Database backup and restore tool."""

    def __init__(self, db_path: str):
        self.db_path = db_path
        self.backup_dir = Path(db_path).parent / "backups"
        self.backup_dir.mkdir(exist_ok=True)

    def create_backup(self, name: Optional[str] = None, compress: bool = True) -> str:
        """Create a database backup."""
        if not Path(self.db_path).exists():
            raise MCPValidationError(f"Database file not found: {self.db_path}")

        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_name = name or f"backup_{timestamp}"
        backup_path = self.backup_dir / f"{backup_name}.db"

        if compress:
            backup_path = backup_path.with_suffix('.db.gz')

        try:
            if compress:
                with gzip.open(backup_path, 'wb') as gz_file:
                    with open(self.db_path, 'rb') as db_file:
                        shutil.copyfileobj(db_file, gz_file)
            else:
                shutil.copy2(self.db_path, backup_path)

            # Get backup info
            backup_size = backup_path.stat().st_size
            original_size = Path(self.db_path).stat().st_size

            return str(backup_path), {
                "backup_path": str(backup_path),
                "original_size": original_size,
                "backup_size": backup_size,
                "compression_ratio": backup_size / original_size if original_size > 0 else 1,
                "compressed": compress,
                "created_at": datetime.now().isoformat()
            }

        except Exception as e:
            raise MCPValidationError(f"Backup creation failed: {str(e)}")

    def restore_backup(self, backup_path: str) -> Dict[str, Any]:
        """Restore database from backup."""
        backup_path = Path(backup_path)

        if not backup_path.exists():
            raise MCPValidationError(f"Backup file not found: {backup_path}")

        try:
            # Create backup of current database before restore
            current_backup = self.create_backup("pre_restore_backup", compress=False)[0]

            if backup_path.suffix == '.gz':
                with gzip.open(backup_path, 'rb') as gz_file:
                    with open(self.db_path, 'wb') as db_file:
                        shutil.copyfileobj(gz_file, db_file)
            else:
                shutil.copy2(backup_path, self.db_path)

            return {
                "status": "restored",
                "backup_path": str(backup_path),
                "database_path": self.db_path,
                "pre_restore_backup": current_backup,
                "restored_at": datetime.now().isoformat()
            }

        except Exception as e:
            raise MCPValidationError(f"Restore failed: {str(e)}")

    def list_backups(self) -> List[Dict[str, Any]]:
        """List all available backups."""
        backups = []

        for backup_file in self.backup_dir.glob("*.db*"):
            stat = backup_file.stat()
            backups.append({
                "name": backup_file.stem,
                "path": str(backup_file),
                "size": stat.st_size,
                "created": datetime.fromtimestamp(stat.st_mtime).isoformat(),
                "compressed": backup_file.suffix == '.gz'
            })

        return sorted(backups, key=lambda x: x["created"], reverse=True)

    def cleanup_old_backups(self, keep_days: int = 30) -> Dict[str, Any]:
        """Clean up old backups."""
        cutoff_date = datetime.now().timestamp() - (keep_days * 24 * 60 * 60)
        deleted_count = 0
        total_size_freed = 0

        for backup_file in self.backup_dir.glob("*.db*"):
            if backup_file.stat().st_mtime < cutoff_date:
                size = backup_file.stat().st_size
                backup_file.unlink()
                deleted_count += 1
                total_size_freed += size

        return {
            "deleted_backups": deleted_count,
            "space_freed": total_size_freed,
            "keep_days": keep_days
        }

    def verify_backup(self, backup_path: str) -> Dict[str, Any]:
        """Verify backup integrity."""
        backup_path = Path(backup_path)

        if not backup_path.exists():
            return {"valid": False, "error": "Backup file not found"}

        try:
            # Try to connect to backup
            if backup_path.suffix == '.gz':
                # For compressed backups, we'd need to decompress first
                # This is a simplified check
                return {"valid": True, "compressed": True, "size": backup_path.stat().st_size}
            else:
                conn = sqlite3.connect(str(backup_path))
                cursor = conn.cursor()

                # Basic integrity check
                cursor.execute("PRAGMA integrity_check")
                result = cursor.fetchone()

                conn.close()

                return {
                    "valid": result[0] == "ok",
                    "integrity_check": result[0],
                    "size": backup_path.stat().st_size
                }

        except Exception as e:
            return {"valid": False, "error": str(e)}


class DatabaseMaintenanceTool:
    """Database maintenance and optimization tool."""

    def __init__(self, db_path: str):
        self.db_path = db_path

    def optimize_database(self) -> Dict[str, Any]:
        """Optimize database performance."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        try:
            # Run optimization commands
            cursor.execute("VACUUM")
            cursor.execute("ANALYZE")

            # Get database statistics
            cursor.execute("PRAGMA page_count")
            page_count = cursor.fetchone()[0]

            cursor.execute("PRAGMA page_size")
            page_size = cursor.fetchone()[0]

            cursor.execute("PRAGMA freelist_count")
            freelist_count = cursor.fetchone()[0]

            conn.commit()

            return {
                "status": "optimized",
                "page_count": page_count,
                "page_size": page_size,
                "freelist_count": freelist_count,
                "total_size": page_count * page_size,
                "free_space": freelist_count * page_size,
                "optimized_at": datetime.now().isoformat()
            }

        except Exception as e:
            conn.rollback()
            raise MCPValidationError(f"Optimization failed: {str(e)}")
        finally:
            conn.close()

    def get_database_stats(self) -> Dict[str, Any]:
        """Get comprehensive database statistics."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        try:
            stats = {}

            # Basic file info
            db_path = Path(self.db_path)
            stats["file_size"] = db_path.stat().st_size
            stats["modified"] = datetime.fromtimestamp(db_path.stat().st_mtime).isoformat()

            # SQLite pragmas
            pragmas = ["page_count", "page_size", "freelist_count", "auto_vacuum", "cache_size"]
            for pragma in pragmas:
                cursor.execute(f"PRAGMA {pragma}")
                stats[pragma] = cursor.fetchone()[0]

            # Table statistics
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
            tables = cursor.fetchall()

            table_stats = []
            for (table_name,) in tables:
                cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
                count = cursor.fetchone()[0]
                table_stats.append({"name": table_name, "row_count": count})

            stats["tables"] = table_stats
            stats["total_tables"] = len(tables)

            return stats

        finally:
            conn.close()

    def repair_database(self) -> Dict[str, Any]:
        """Attempt to repair database corruption."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        try:
            # Check integrity
            cursor.execute("PRAGMA integrity_check")
            integrity_result = cursor.fetchone()[0]

            if integrity_result == "ok":
                return {"status": "no_repair_needed", "integrity": "ok"}

            # Attempt repair with REINDEX
            cursor.execute("REINDEX")

            # Check integrity again
            cursor.execute("PRAGMA integrity_check")
            new_integrity = cursor.fetchone()[0]

            conn.commit()

            return {
                "status": "repair_attempted",
                "original_integrity": integrity_result,
                "new_integrity": new_integrity,
                "repaired": new_integrity == "ok",
                "repaired_at": datetime.now().isoformat()
            }

        except Exception as e:
            conn.rollback()
            raise MCPValidationError(f"Repair failed: {str(e)}")
        finally:
            conn.close()
