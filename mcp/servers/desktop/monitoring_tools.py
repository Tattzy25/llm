#!/usr/bin/env python3
"""
System Monitoring Tools Manager
===============================

Manages system monitoring and dashboard tools for MCP servers.
"""

import logging
from typing import Dict, List, Any, Optional

from mcp.core.utils.validation import MCPValidationError
from mcp.servers.desktop.monitoring_dashboard import (
    SystemMonitoringDashboard,
    SystemMetricsCollector,
    ProcessMonitor,
    AlertManager
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


class MonitoringToolsManager:
    """Manager for system monitoring tools."""

    def __init__(self):
        self.dashboard = SystemMonitoringDashboard()
        self.tools: Dict[str, MCPTool] = {}

    def register_monitoring_tools(self) -> None:
        """Register system monitoring tools."""

        class StartMonitoringTool(MCPTool):
            def __init__(self):
                schema = {"type": "object", "properties": {}}
                super().__init__("start_monitoring", "Start system monitoring", schema)
                self.dashboard = SystemMonitoringDashboard()

            async def execute(self) -> Dict[str, Any]:
                return self.dashboard.start_monitoring()

        class StopMonitoringTool(MCPTool):
            def __init__(self):
                schema = {"type": "object", "properties": {}}
                super().__init__("stop_monitoring", "Stop system monitoring", schema)
                self.dashboard = SystemMonitoringDashboard()

            async def execute(self) -> Dict[str, Any]:
                return self.dashboard.stop_monitoring()

        class GetDashboardDataTool(MCPTool):
            def __init__(self):
                schema = {"type": "object", "properties": {}}
                super().__init__("get_dashboard_data", "Get comprehensive dashboard data", schema)
                self.dashboard = SystemMonitoringDashboard()

            async def execute(self) -> Dict[str, Any]:
                return self.dashboard.get_dashboard_data()

        class GetHistoricalDataTool(MCPTool):
            def __init__(self):
                schema = {
                    "type": "object",
                    "properties": {
                        "hours": {"type": "integer", "description": "Hours of historical data", "default": 24}
                    }
                }
                super().__init__("get_historical_data", "Get historical monitoring data", schema)
                self.dashboard = SystemMonitoringDashboard()

            async def execute(self, hours: int = 24) -> Dict[str, Any]:
                return self.dashboard.get_historical_data(hours)

        class GetProcessListTool(MCPTool):
            def __init__(self):
                schema = {
                    "type": "object",
                    "properties": {
                        "sort_by": {"type": "string", "enum": ["cpu_percent", "memory_percent", "name"], "default": "cpu_percent"},
                        "limit": {"type": "integer", "description": "Maximum number of processes", "default": 20}
                    }
                }
                super().__init__("get_process_list", "Get list of running processes", schema)
                self.process_monitor = ProcessMonitor()

            async def execute(self, sort_by: str = "cpu_percent", limit: int = 20) -> List[Dict[str, Any]]:
                return self.process_monitor.get_process_list(sort_by, limit)

        class GetProcessDetailsTool(MCPTool):
            def __init__(self):
                schema = {
                    "type": "object",
                    "properties": {
                        "pid": {"type": "integer", "description": "Process ID"}
                    },
                    "required": ["pid"]
                }
                super().__init__("get_process_details", "Get detailed process information", schema)
                self.process_monitor = ProcessMonitor()

            async def execute(self, pid: int) -> Optional[Dict[str, Any]]:
                return self.process_monitor.get_process_details(pid)

        class KillProcessTool(MCPTool):
            def __init__(self):
                schema = {
                    "type": "object",
                    "properties": {
                        "pid": {"type": "integer", "description": "Process ID to kill"},
                        "force": {"type": "boolean", "description": "Force kill process", "default": False}
                    },
                    "required": ["pid"]
                }
                super().__init__("kill_process", "Kill a running process", schema)
                self.process_monitor = ProcessMonitor()

            async def execute(self, pid: int, force: bool = False) -> Dict[str, Any]:
                return self.process_monitor.kill_process(pid, force)

        class GetActiveAlertsTool(MCPTool):
            def __init__(self):
                schema = {"type": "object", "properties": {}}
                super().__init__("get_active_alerts", "Get currently active system alerts", schema)
                self.alert_manager = AlertManager()

            async def execute(self) -> List[Dict[str, Any]]:
                return self.alert_manager.get_active_alerts()

        class SetAlertThresholdTool(MCPTool):
            def __init__(self):
                schema = {
                    "type": "object",
                    "properties": {
                        "metric": {"type": "string", "enum": ["cpu_percent", "memory_percent", "disk_percent"]},
                        "value": {"type": "number", "description": "Threshold value"}
                    },
                    "required": ["metric", "value"]
                }
                super().__init__("set_alert_threshold", "Set alert threshold for a metric", schema)
                self.alert_manager = AlertManager()

            async def execute(self, metric: str, value: float) -> Dict[str, Any]:
                return self.alert_manager.set_threshold(metric, value)

        class GetSystemMetricsTool(MCPTool):
            def __init__(self):
                schema = {"type": "object", "properties": {}}
                super().__init__("get_system_metrics", "Get current system metrics", schema)
                self.metrics_collector = SystemMetricsCollector()

            async def execute(self) -> Dict[str, Any]:
                return self.metrics_collector.get_current_metrics()

        # Create tool instances
        self.tools.update({
            "start_monitoring": StartMonitoringTool(),
            "stop_monitoring": StopMonitoringTool(),
            "get_dashboard_data": GetDashboardDataTool(),
            "get_historical_data": GetHistoricalDataTool(),
            "get_process_list": GetProcessListTool(),
            "get_process_details": GetProcessDetailsTool(),
            "kill_process": KillProcessTool(),
            "get_active_alerts": GetActiveAlertsTool(),
            "set_alert_threshold": SetAlertThresholdTool(),
            "get_system_metrics": GetSystemMetricsTool()
        })

    def register_all_tools(self) -> None:
        """Register all monitoring tools."""
        self.register_monitoring_tools()
        logger.info(f"Registered {len(self.tools)} monitoring tools")

    def get_tool(self, name: str) -> Optional[MCPTool]:
        """Get a tool by name."""
        return self.tools.get(name)

    def get_all_tools(self) -> Dict[str, MCPTool]:
        """Get all registered tools."""
        return self.tools.copy()

    def start_monitoring(self) -> Dict[str, Any]:
        """Start the monitoring system."""
        return self.dashboard.start_monitoring()

    def stop_monitoring(self) -> Dict[str, Any]:
        """Stop the monitoring system."""
        return self.dashboard.stop_monitoring()

    def get_status(self) -> Dict[str, Any]:
        """Get monitoring system status."""
        return {
            "is_monitoring": self.dashboard.is_monitoring,
            "tools_registered": len(self.tools),
            "collection_interval": self.dashboard.metrics_collector.collection_interval,
            "history_size": len(self.dashboard.metrics_collector.history)
        }
