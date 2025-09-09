#!/usr/bin/env python3
"""
MCP Access Control Utils
========================

Access control utilities for MCP servers.
"""

import re
from typing import Dict, List, Optional, Set, Any

from .models import MCPPermission, MCPRole
from ...core.utils.validation import MCPValidationError


class MCPAccessControl:
    """Access control utilities."""

    def __init__(self):
        self.roles: Dict[str, MCPRole] = {}
        self.user_roles: Dict[str, Set[str]] = {}
        self.resource_patterns: Dict[str, re.Pattern] = {}

    def add_role(self, role: MCPRole) -> None:
        """Add a role to the system."""
        self.roles[role.name] = role
        for permission in role.permissions:
            if permission.resource not in self.resource_patterns:
                pattern = permission.resource.replace('*', '.*')
                self.resource_patterns[permission.resource] = re.compile(f"^{pattern}$")

    def assign_role_to_user(self, user_id: str, role_name: str) -> None:
        """Assign role to user."""
        if role_name not in self.roles:
            raise MCPValidationError(f"Role '{role_name}' does not exist")
        if user_id not in self.user_roles:
            self.user_roles[user_id] = set()
        self.user_roles[user_id].add(role_name)

    def remove_role_from_user(self, user_id: str, role_name: str) -> None:
        """Remove role from user."""
        if user_id in self.user_roles:
            self.user_roles[user_id].discard(role_name)

    def check_permission(self, user_id: str, resource: str, action: str,
                        context: Optional[Dict[str, Any]] = None) -> bool:
        """Check if user has permission for resource and action."""
        user_role_names = self.user_roles.get(user_id, set())
        for role_name in user_role_names:
            role = self.roles.get(role_name)
            if role and self._matches_permission(role.permissions, resource, action, context):
                return True
        return False

    def _matches_permission(self, permissions: List[MCPPermission], resource: str,
                           action: str, context: Optional[Dict[str, Any]] = None) -> bool:
        """Check if any permission matches the request."""
        for permission in permissions:
            if self._check_single_permission(permission, resource, action, context):
                return True
        return False

    def _check_single_permission(self, permission: MCPPermission, resource: str,
                                action: str, context: Optional[Dict[str, Any]] = None) -> bool:
        """Check if single permission matches the request."""
        if permission.action != action and permission.action != "*":
            return False
        pattern = self.resource_patterns.get(permission.resource)
        if not pattern or not pattern.match(resource):
            return False
        if permission.conditions and context:
            return self._check_conditions(permission.conditions, context)
        return True

    def _check_conditions(self, conditions: Dict[str, Any], context: Dict[str, Any]) -> bool:
        """Check permission conditions against context."""
        for key, expected_value in conditions.items():
            if key not in context:
                return False
            actual_value = context[key]
            if isinstance(expected_value, list):
                if actual_value not in expected_value:
                    return False
            elif actual_value != expected_value:
                return False
        return True

    def get_user_permissions(self, user_id: str) -> List[MCPPermission]:
        """Get all permissions for a user."""
        permissions = []
        user_role_names = self.user_roles.get(user_id, set())
        for role_name in user_role_names:
            role = self.roles.get(role_name)
            if role:
                permissions.extend(role.permissions)
        return permissions

    def get_user_roles(self, user_id: str) -> List[str]:
        """Get all roles for a user."""
        return list(self.user_roles.get(user_id, set()))
