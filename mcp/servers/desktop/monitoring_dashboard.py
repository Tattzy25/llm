#!/usr/bin/env python3
"""
System Monitoring Dashboard Tools
=================================

Real-time system monitoring and dashboard tools for MCP servers.
"""

import json
import logging
import platform
import time
from typing import Dict, List, Any, Optional, Union
from datetime import datetime, timedelta
import threading
import asyncio

import psutil

from mcp.core.utils.validation import MCPValidationError

logger = logging.getLogger(__name__)


class SystemMetricsCollector:
    """Collects real-time system metrics."""

    def __init__(self):
        self.history: List[Dict[str, Any]] = []
        self.max_history = 100
        self.collection_interval = 5  # seconds
        self.is_collecting = False
        self.collection_thread: Optional[threading.Thread] = None

    def start_collection(self) -> None:
        """Start collecting system metrics."""
        if self.is_collecting:
            return

        self.is_collecting = True
        self.collection_thread = threading.Thread(target=self._collect_loop, daemon=True)
        self.collection_thread.start()
        logger.info("Started system metrics collection")

    def stop_collection(self) -> None:
        """Stop collecting system metrics."""
        self.is_collecting = False
        if self.collection_thread:
            self.collection_thread.join(timeout=1)
        logger.info("Stopped system metrics collection")

    def _collect_loop(self) -> None:
        """Main collection loop."""
        while self.is_collecting:
            try:
                metrics = self.get_current_metrics()
                self.history.append(metrics)

                # Keep only recent history
                if len(self.history) > self.max_history:
                    self.history = self.history[-self.max_history:]

            except Exception as e:
                logger.error(f"Error collecting metrics: {e}")

            time.sleep(self.collection_interval)

    def get_current_metrics(self) -> Dict[str, Any]:
        """Get current system metrics."""
        try:
            # CPU metrics
            cpu_percent = psutil.cpu_percent(interval=1)
            cpu_count = psutil.cpu_count()
            cpu_freq = psutil.cpu_freq()

            # Memory metrics
            memory = psutil.virtual_memory()
            swap = psutil.swap_memory()

            # Disk metrics
            disk_usage = psutil.disk_usage('/')
            disk_io = psutil.disk_io_counters()

            # Network metrics
            network = psutil.net_io_counters()

            # System info
            load_avg = psutil.getloadavg() if hasattr(psutil, 'getloadavg') else None

            metrics = {
                "timestamp": datetime.now().isoformat(),
                "cpu": {
                    "percent": cpu_percent,
                    "count": cpu_count,
                    "frequency": cpu_freq.current if cpu_freq else None,
                    "load_average": load_avg
                },
                "memory": {
                    "total": memory.total,
                    "available": memory.available,
                    "percent": memory.percent,
                    "used": memory.used,
                    "swap_total": swap.total,
                    "swap_used": swap.used,
                    "swap_percent": swap.percent
                },
                "disk": {
                    "total": disk_usage.total,
                    "used": disk_usage.used,
                    "free": disk_usage.free,
                    "percent": disk_usage.percent,
                    "read_bytes": disk_io.read_bytes if disk_io else 0,
                    "write_bytes": disk_io.write_bytes if disk_io else 0
                },
                "network": {
                    "bytes_sent": network.bytes_sent,
                    "bytes_recv": network.bytes_recv,
                    "packets_sent": network.packets_sent,
                    "packets_recv": network.packets_recv
                },
                "system": {
                    "platform": platform.platform(),
                    "processor": platform.processor(),
                    "python_version": platform.python_version(),
                    "uptime": time.time() - psutil.boot_time()
                }
            }

            return metrics

        except Exception as e:
            logger.error(f"Error getting system metrics: {e}")
            return {
                "timestamp": datetime.now().isoformat(),
                "error": str(e)
            }

    def get_metrics_history(self, hours: int = 1) -> List[Dict[str, Any]]:
        """Get metrics history for the specified time period."""
        if not self.history:
            return []

        cutoff_time = datetime.now() - timedelta(hours=hours)
        recent_history = []

        for metric in reversed(self.history):
            metric_time = datetime.fromisoformat(metric["timestamp"])
            if metric_time >= cutoff_time:
                recent_history.append(metric)
            else:
                break

        return list(reversed(recent_history))

    def get_average_metrics(self, hours: int = 1) -> Dict[str, Any]:
        """Get average metrics over the specified time period."""
        history = self.get_metrics_history(hours)

        if not history:
            return self.get_current_metrics()

        # Calculate averages
        cpu_percents = [m["cpu"]["percent"] for m in history if "cpu" in m]
        memory_percents = [m["memory"]["percent"] for m in history if "memory" in m]
        disk_percents = [m["disk"]["percent"] for m in history if "disk" in m]

        avg_metrics = {
            "timestamp": datetime.now().isoformat(),
            "period_hours": hours,
            "samples": len(history),
            "averages": {
                "cpu_percent": sum(cpu_percents) / len(cpu_percents) if cpu_percents else 0,
                "memory_percent": sum(memory_percents) / len(memory_percents) if memory_percents else 0,
                "disk_percent": sum(disk_percents) / len(disk_percents) if disk_percents else 0
            },
            "peaks": {
                "cpu_percent": max(cpu_percents) if cpu_percents else 0,
                "memory_percent": max(memory_percents) if memory_percents else 0,
                "disk_percent": max(disk_percents) if disk_percents else 0
            }
        }

        return avg_metrics


class ProcessMonitor:
    """Monitors system processes."""

    def __init__(self):
        self.process_cache: Dict[int, Dict[str, Any]] = {}
        self.update_interval = 30  # seconds
        self.last_update = 0

    def get_process_list(self, sort_by: str = "cpu_percent", limit: int = 20) -> List[Dict[str, Any]]:
        """Get list of running processes."""
        try:
            processes = []
            for proc in psutil.process_iter(['pid', 'name', 'cpu_percent', 'memory_percent', 'status']):
                try:
                    info = proc.info
                    processes.append({
                        "pid": info["pid"],
                        "name": info["name"],
                        "cpu_percent": info["cpu_percent"] or 0,
                        "memory_percent": info["memory_percent"] or 0,
                        "status": info["status"]
                    })
                except (psutil.NoSuchProcess, psutil.AccessDenied):
                    continue

            # Sort processes
            if sort_by == "cpu_percent":
                processes.sort(key=lambda x: x["cpu_percent"], reverse=True)
            elif sort_by == "memory_percent":
                processes.sort(key=lambda x: x["memory_percent"], reverse=True)
            elif sort_by == "name":
                processes.sort(key=lambda x: x["name"])

            return processes[:limit]

        except Exception as e:
            logger.error(f"Error getting process list: {e}")
            return []

    def get_process_details(self, pid: int) -> Optional[Dict[str, Any]]:
        """Get detailed information about a specific process."""
        try:
            proc = psutil.Process(pid)
            info = proc.as_dict(attrs=[
                'pid', 'name', 'exe', 'cwd', 'status', 'cpu_percent',
                'memory_percent', 'memory_info', 'create_time', 'num_threads'
            ])

            return {
                "pid": info["pid"],
                "name": info["name"],
                "executable": info["exe"],
                "working_directory": info["cwd"],
                "status": info["status"],
                "cpu_percent": info["cpu_percent"],
                "memory_percent": info["memory_percent"],
                "memory_rss": info["memory_info"].rss if info["memory_info"] else 0,
                "memory_vms": info["memory_info"].vms if info["memory_info"] else 0,
                "threads": info["num_threads"],
                "created": datetime.fromtimestamp(info["create_time"]).isoformat()
            }

        except (psutil.NoSuchProcess, psutil.AccessDenied) as e:
            logger.error(f"Error getting process details for PID {pid}: {e}")
            return None

    def kill_process(self, pid: int, force: bool = False) -> Dict[str, Any]:
        """Kill a process."""
        try:
            proc = psutil.Process(pid)
            proc.kill() if force else proc.terminate()

            return {
                "success": True,
                "pid": pid,
                "action": "killed" if force else "terminated"
            }

        except (psutil.NoSuchProcess, psutil.AccessDenied) as e:
            return {
                "success": False,
                "pid": pid,
                "error": str(e)
            }


class AlertManager:
    """Manages system alerts and notifications."""

    def __init__(self):
        self.alerts: List[Dict[str, Any]] = []
        self.thresholds = {
            "cpu_percent": 90,
            "memory_percent": 85,
            "disk_percent": 90
        }

    def check_thresholds(self, metrics: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Check if metrics exceed thresholds."""
        new_alerts = []

        if "cpu" in metrics and metrics["cpu"]["percent"] > self.thresholds["cpu_percent"]:
            new_alerts.append({
                "type": "cpu_high",
                "message": f"CPU usage is {metrics['cpu']['percent']:.1f}% (threshold: {self.thresholds['cpu_percent']}%)",
                "severity": "warning",
                "timestamp": datetime.now().isoformat(),
                "value": metrics["cpu"]["percent"]
            })

        if "memory" in metrics and metrics["memory"]["percent"] > self.thresholds["memory_percent"]:
            new_alerts.append({
                "type": "memory_high",
                "message": f"Memory usage is {metrics['memory']['percent']:.1f}% (threshold: {self.thresholds['memory_percent']}%)",
                "severity": "warning",
                "timestamp": datetime.now().isoformat(),
                "value": metrics["memory"]["percent"]
            })

        if "disk" in metrics and metrics["disk"]["percent"] > self.thresholds["disk_percent"]:
            new_alerts.append({
                "type": "disk_high",
                "message": f"Disk usage is {metrics['disk']['percent']:.1f}% (threshold: {self.thresholds['disk_percent']}%)",
                "severity": "critical",
                "timestamp": datetime.now().isoformat(),
                "value": metrics["disk"]["percent"]
            })

        # Add new alerts to history
        self.alerts.extend(new_alerts)

        # Keep only recent alerts (last 100)
        if len(self.alerts) > 100:
            self.alerts = self.alerts[-100:]

        return new_alerts

    def get_active_alerts(self) -> List[Dict[str, Any]]:
        """Get currently active alerts."""
        # For simplicity, return recent alerts (last hour)
        cutoff_time = datetime.now() - timedelta(hours=1)
        active_alerts = []

        for alert in reversed(self.alerts):
            alert_time = datetime.fromisoformat(alert["timestamp"])
            if alert_time >= cutoff_time:
                active_alerts.append(alert)
            else:
                break

        return list(reversed(active_alerts))

    def set_threshold(self, metric: str, value: float) -> Dict[str, Any]:
        """Set alert threshold for a metric."""
        if metric not in self.thresholds:
            raise MCPValidationError(f"Unknown metric: {metric}")

        self.thresholds[metric] = value

        return {
            "metric": metric,
            "threshold": value,
            "updated": datetime.now().isoformat()
        }


class SystemMonitoringDashboard:
    """Main system monitoring dashboard."""

    def __init__(self):
        self.metrics_collector = SystemMetricsCollector()
        self.process_monitor = ProcessMonitor()
        self.alert_manager = AlertManager()
        self.is_monitoring = False

    def start_monitoring(self) -> Dict[str, Any]:
        """Start the monitoring system."""
        if self.is_monitoring:
            return {"status": "already_running"}

        self.metrics_collector.start_collection()
        self.is_monitoring = True

        return {
            "status": "started",
            "collection_interval": self.metrics_collector.collection_interval,
            "started_at": datetime.now().isoformat()
        }

    def stop_monitoring(self) -> Dict[str, Any]:
        """Stop the monitoring system."""
        if not self.is_monitoring:
            return {"status": "not_running"}

        self.metrics_collector.stop_collection()
        self.is_monitoring = False

        return {
            "status": "stopped",
            "stopped_at": datetime.now().isoformat()
        }

    def get_dashboard_data(self) -> Dict[str, Any]:
        """Get comprehensive dashboard data."""
        current_metrics = self.metrics_collector.get_current_metrics()
        alerts = self.alert_manager.check_thresholds(current_metrics)
        active_alerts = self.alert_manager.get_active_alerts()
        top_processes = self.process_monitor.get_process_list(limit=10)

        return {
            "current_metrics": current_metrics,
            "active_alerts": active_alerts,
            "new_alerts": alerts,
            "top_processes": top_processes,
            "monitoring_status": "active" if self.is_monitoring else "inactive",
            "generated_at": datetime.now().isoformat()
        }

    def get_historical_data(self, hours: int = 24) -> Dict[str, Any]:
        """Get historical monitoring data."""
        history = self.metrics_collector.get_metrics_history(hours)
        averages = self.metrics_collector.get_average_metrics(hours)

        return {
            "history": history,
            "averages": averages,
            "period_hours": hours,
            "data_points": len(history)
        }
