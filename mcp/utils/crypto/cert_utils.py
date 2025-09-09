#!/usr/bin/env python3
"""
MCP Certificate Utils
====================

Certificate utilities for MCP servers.
"""

import ssl
import tempfile
from datetime import datetime, timedelta
from pathlib import Path
from typing import Optional, Tuple

from cryptography import x509
from cryptography.x509.oid import NameOID
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.backends import default_backend

from mcp.core.utils.validation import MCPValidationError


class MCPCertificateUtils:
    """Certificate utilities for SSL/TLS."""

    @staticmethod
    def generate_self_signed_cert(common_name: str, organization: str = "MCP Server",
                                 country: str = "US", validity_days: int = 365) -> Tuple[str, str]:
        """Generate self-signed certificate and private key."""
        try:
            private_key = rsa.generate_private_key(65537, 2048, default_backend())
            subject = issuer = x509.Name([
                x509.NameAttribute(NameOID.COUNTRY_NAME, country),
                x509.NameAttribute(NameOID.ORGANIZATION_NAME, organization),
                x509.NameAttribute(NameOID.COMMON_NAME, common_name),
            ])

            cert = x509.CertificateBuilder().subject_name(subject).issuer_name(issuer)\
                .public_key(private_key.public_key()).serial_number(x509.random_serial_number())\
                .not_valid_before(datetime.utcnow()).not_valid_after(datetime.utcnow() + timedelta(days=validity_days))\
                .add_extension(x509.SubjectAlternativeName([x509.DNSName(common_name)]), critical=False)\
                .sign(private_key, hashes.SHA256(), default_backend())

            cert_pem = cert.public_bytes(serialization.Encoding.PEM).decode('utf-8')
            key_pem = private_key.private_bytes(serialization.Encoding.PEM,
                serialization.PrivateFormat.PKCS8, serialization.NoEncryption()).decode('utf-8')

            return cert_pem, key_pem
        except Exception as e:
            raise MCPValidationError(f"Failed to generate certificate: {str(e)}")

    @staticmethod
    def save_cert_to_files(cert_pem: str, key_pem: str, cert_path: str, key_path: str) -> None:
        """Save certificate and key to files."""
        try:
            Path(cert_path).parent.mkdir(parents=True, exist_ok=True)
            Path(key_path).parent.mkdir(parents=True, exist_ok=True)
            with open(cert_path, 'w') as f: f.write(cert_pem)
            with open(key_path, 'w') as f: f.write(key_pem)
        except Exception as e:
            raise MCPValidationError(f"Failed to save certificate files: {str(e)}")

    @staticmethod
    def load_ssl_context(cert_path: str, key_path: str, ca_cert_path: Optional[str] = None) -> ssl.SSLContext:
        """Load SSL context from certificate files."""
        try:
            context = ssl.create_default_context(ssl.Purpose.CLIENT_AUTH)
            context.load_cert_chain(cert_path, key_path)
            if ca_cert_path: context.load_verify_locations(ca_cert_path)
            context.minimum_version = ssl.TLSVersion.TLSv1_2
            return context
        except Exception as e:
            raise MCPValidationError(f"Failed to load SSL context: {str(e)}")

    @staticmethod
    def generate_temp_cert_files(common_name: str, organization: str = "MCP Server") -> Tuple[str, str]:
        """Generate temporary certificate files."""
        cert_pem, key_pem = MCPCertificateUtils.generate_self_signed_cert(common_name, organization)
        cert_file = tempfile.NamedTemporaryFile(mode='w', suffix='.pem', delete=False)
        cert_file.write(cert_pem); cert_path = cert_file.name; cert_file.close()
        key_file = tempfile.NamedTemporaryFile(mode='w', suffix='.key', delete=False)
        key_file.write(key_pem); key_path = key_file.name; key_file.close()
        return cert_path, key_path
