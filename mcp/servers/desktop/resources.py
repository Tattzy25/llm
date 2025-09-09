#!/usr/bin/env python3
"""
Desktop Server Resources
Management of desktop-specific resources.
"""

import json
import logging
import os
import platform
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)


class DesktopResourcesManager:
    """Manager for desktop resources."""

    def __init__(self):
        self.resources: Dict[str, Dict[str, Any]] = {}
        self._register_resources()

    def _register_resources(self):
        """Register available resources."""
        # System information as resources
        self.resources["system://info"] = {
            "name": "System Information",
            "description": "Current system information",
            "mimeType": "application/json",
            "content": json.dumps({
                "platform": platform.platform(),
                "hostname": platform.node(),
                "python_version": platform.python_version()
            })
        }

        # Desktop directory as resource
        desktop_path = os.path.expanduser("~/Desktop")
        self.resources["file://desktop"] = {
            "name": "Desktop Directory",
            "description": "Contents of desktop directory",
            "mimeType": "application/json",
            "content": json.dumps({"path": desktop_path})
        }

        # Home directory as resource
        home_path = os.path.expanduser("~")
        self.resources["file://home"] = {
            "name": "Home Directory",
            "description": "Contents of home directory",
            "mimeType": "application/json",
            "content": json.dumps({"path": home_path})
        }

    def get_resource(self, uri: str) -> Optional[Dict[str, Any]]:
        """Get a resource by URI."""
        return self.resources.get(uri)

    def list_resources(self) -> List[Dict[str, Any]]:
        """List all available resources."""
        return [
            {
                "uri": uri,
                "name": resource["name"],
                "description": resource["description"],
                "mimeType": resource["mimeType"]
            }
            for uri, resource in self.resources.items()
        ]

    def read_resource(self, uri: str) -> Optional[Dict[str, Any]]:
        """Read a resource by URI."""
        resource = self.get_resource(uri)
        if not resource:
            return None

        return {
            "contents": [
                {
                    "uri": uri,
                    "mimeType": resource["mimeType"],
                    "text": resource["content"]
                }
            ]
        }

    def add_resource(self, uri: str, name: str, description: str,
                    mime_type: str, content: str) -> bool:
        """Add a new resource."""
        try:
            self.resources[uri] = {
                "name": name,
                "description": description,
                "mimeType": mime_type,
                "content": content
            }
            return True
        except Exception as e:
            logger.error(f"Failed to add resource {uri}: {e}")
            return False

    def remove_resource(self, uri: str) -> bool:
        """Remove a resource."""
        if uri in self.resources:
            del self.resources[uri]
            return True
        return False

    def update_resource_content(self, uri: str, content: str) -> bool:
        """Update the content of a resource."""
        if uri in self.resources:
            self.resources[uri]["content"] = content
            return True
        return False
