#!/usr/bin/env python3
"""
Domain Update Script for Digital Hustle Lab MCP Ecosystem
Updates all configuration files to use a new domain instead of localhost.
"""

import os
import json
import re
from pathlib import Path

def update_domain_in_file(file_path, old_domain, new_domain):
    """Update domain references in a file."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        # Replace various patterns
        patterns = [
            (f'localhost:{port}', f'{new_domain}:{port}') for port in ['3000', '3001', '3002', '3003', '3004', '3005', '3006', '3007']
        ] + [
            (f'127.0.0.1:{port}', f'{new_domain}:{port}') for port in ['3000', '3001', '3002', '3003', '3004', '3005', '3006', '3007']
        ] + [
            ('localhost', new_domain),
            ('127.0.0.1', new_domain),
            ('ws://localhost', f'ws://{new_domain}'),
            ('ws://127.0.0.1', f'ws://{new_domain}'),
            ('http://localhost', f'http://{new_domain}'),
            ('http://127.0.0.1', f'http://{new_domain}'),
        ]

        updated_content = content
        for old_pattern, new_pattern in patterns:
            updated_content = updated_content.replace(old_pattern, new_pattern)

        if updated_content != content:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(updated_content)
            print(f"✅ Updated: {file_path}")
            return True
        else:
            return False

    except Exception as e:
        print(f"❌ Error updating {file_path}: {e}")
        return False

def main():
    # Current domain (what we're replacing)
    old_domain = "localhost"

    # New domain
    new_domain = "digitalhustlelab.com"

    print(f"🔄 Updating domain from '{old_domain}' to '{new_domain}'")
    print("=" * 60)

    # Files to update
    files_to_update = [
        # Configuration files
        "servers/mcp-config-expanded.json",
        "servers/mcp-config.json",

        # Server files
        "servers/mcp_server_manager.py",
        "servers/web_scraper_server.py",
        "servers/database_connector_server.py",
        "servers/ai_assistant_server.py",
        "servers/remote_server.py",

        # Client files
        "lib/mcp.ts",

        # Scripts
        "servers/launch.ps1",

        # Test files
        "test_mcp_ecosystem.py",

        # Documentation
        "README.md",
        "README-MCP-ECOSYSTEM.md",
        "servers/README.md",
    ]

    updated_count = 0
    for file_path in files_to_update:
        if os.path.exists(file_path):
            if update_domain_in_file(file_path, old_domain, new_domain):
                updated_count += 1
        else:
            print(f"⚠️  File not found: {file_path}")

    print("=" * 60)
    print(f"✅ Domain update complete! Updated {updated_count} files.")
    print(f"🔗 New domain: {new_domain}")
    print("\n📋 Next steps:")
    print("1. Update your DNS to point to this server")
    print("2. Configure SSL certificates for HTTPS")
    print("3. Update firewall rules if necessary")
    print("4. Test all endpoints with the new domain")

if __name__ == "__main__":
    main()
