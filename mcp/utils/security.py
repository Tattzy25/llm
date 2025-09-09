#!/usr/bin/env python3
"""
MCP Security Utils
==================

Security utilities for MCP servers.
Provides cryptography, hashing, JWT management, and access control.
"""

import os
import re
import hmac
import json
import hashlib
import secrets
from typing import Dict, List, Optional, Any, Union
from datetime import datetime, timedelta

try:
    import jwt
    JWT_AVAILABLE = True
except ImportError:
    JWT_AVAILABLE = False

try:
    from cryptography.fernet import Fernet
    from cryptography.hazmat.primitives import hashes
    from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
    from cryptography.hazmat.backends import default_backend
    CRYPTOGRAPHY_AVAILABLE = True
except ImportError:
    CRYPTOGRAPHY_AVAILABLE = False

from ..core import MCPValidationError


class MCPCryptoUtils:
    """Cryptography utilities."""

    @staticmethod
    def generate_key(length: int = 32) -> bytes:
        """Generate a random cryptographic key."""
        return secrets.token_bytes(length)

    @staticmethod
    def generate_key_hex(length: int = 32) -> str:
        """Generate a random cryptographic key as hex string."""
        return secrets.token_hex(length)

    @staticmethod
    def derive_key(password: str, salt: bytes, length: int = 32) -> bytes:
        """Derive a key from password using PBKDF2."""
        if not CRYPTOGRAPHY_AVAILABLE:
            raise MCPValidationError("Cryptography library not available")

        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=length,
            salt=salt,
            iterations=100000,
            backend=default_backend()
        )
        return kdf.derive(password.encode())

    @staticmethod
    def encrypt_data(data: bytes, key: bytes) -> bytes:
        """Encrypt data using Fernet (AES)."""
        if not CRYPTOGRAPHY_AVAILABLE:
            raise MCPValidationError("Cryptography library not available")

        f = Fernet(key)
        return f.encrypt(data)

    @staticmethod
    def decrypt_data(encrypted_data: bytes, key: bytes) -> bytes:
        """Decrypt data using Fernet (AES)."""
        if not CRYPTOGRAPHY_AVAILABLE:
            raise MCPValidationError("Cryptography library not available")

        try:
            f = Fernet(key)
            return f.decrypt(encrypted_data)
        except Exception as e:
            raise MCPValidationError(f"Decryption failed: {str(e)}")

    @staticmethod
    def encrypt_text(text: str, key: bytes) -> str:
        """Encrypt text and return as base64 string."""
        data = text.encode('utf-8')
        encrypted = MCPCryptoUtils.encrypt_data(data, key)
        return encrypted.decode('utf-8')

    @staticmethod
    def decrypt_text(encrypted_text: str, key: bytes) -> str:
        """Decrypt base64 encrypted text."""
        encrypted_data = encrypted_text.encode('utf-8')
        decrypted = MCPCryptoUtils.decrypt_data(encrypted_data, key)
        return decrypted.decode('utf-8')


class MCPHashUtils:
    """Hashing utilities."""

    @staticmethod
    def hash_password(password: str, salt: Optional[bytes] = None) -> Dict[str, str]:
        """Hash password with salt using PBKDF2."""
        if salt is None:
            salt = secrets.token_bytes(16)

        key = MCPCryptoUtils.derive_key(password, salt, 32)

        return {
            "hash": key.hex(),
            "salt": salt.hex(),
            "algorithm": "PBKDF2-SHA256"
        }

    @staticmethod
    def verify_password(password: str, hash_hex: str, salt_hex: str) -> bool:
        """Verify password against hash."""
        try:
            salt = bytes.fromhex(salt_hex)
            key = MCPCryptoUtils.derive_key(password, salt, 32)
            return hmac.compare_digest(key.hex(), hash_hex)
        except Exception:
            return False

    @staticmethod
    def hash_file(file_path: str, algorithm: str = 'sha256') -> str:
        """Calculate file hash."""
        hash_func = getattr(hashlib, algorithm)()

        try:
            with open(file_path, 'rb') as f:
                for chunk in iter(lambda: f.read(4096), b""):
                    hash_func.update(chunk)
            return hash_func.hexdigest()
        except Exception as e:
            raise MCPValidationError(f"Failed to hash file: {str(e)}")

    @staticmethod
    def hash_data(data: Union[str, bytes], algorithm: str = 'sha256') -> str:
        """Calculate data hash."""
        if isinstance(data, str):
            data = data.encode('utf-8')

        hash_func = getattr(hashlib, algorithm)()
        hash_func.update(data)
        return hash_func.hexdigest()

    @staticmethod
    def generate_checksum(data: Union[str, bytes]) -> str:
        """Generate MD5 checksum for data integrity."""
        return MCPHashUtils.hash_data(data, 'md5')


class MCPJWTManager:
    """JWT token management."""

    def __init__(self, secret_key: str, algorithm: str = 'HS256'):
        if not JWT_AVAILABLE:
            raise MCPValidationError("PyJWT library not available")
        self.secret_key = secret_key
        self.algorithm = algorithm

    def generate_token(self, payload: Dict[str, Any], expires_in: int = 3600) -> str:
        """Generate JWT token."""
        if not JWT_AVAILABLE:
            raise MCPValidationError("PyJWT library not available")

        now = datetime.utcnow()
        payload.update({
            'iat': now,
            'exp': now + timedelta(seconds=expires_in)
        })

        try:
            token = jwt.encode(payload, self.secret_key, algorithm=self.algorithm)
            return token
        except Exception as e:
            raise MCPValidationError(f"Failed to generate JWT token: {str(e)}")

    def verify_token(self, token: str) -> Dict[str, Any]:
        """Verify and decode JWT token."""
        if not JWT_AVAILABLE:
            raise MCPValidationError("PyJWT library not available")

        try:
            payload = jwt.decode(token, self.secret_key, algorithms=[self.algorithm])
            return payload
        except jwt.ExpiredSignatureError:
            raise MCPValidationError("Token has expired")
        except jwt.InvalidTokenError:
            raise MCPValidationError("Invalid token")
        except Exception as e:
            raise MCPValidationError(f"Token verification failed: {str(e)}")

    def refresh_token(self, token: str, expires_in: int = 3600) -> str:
        """Refresh JWT token."""
        if not JWT_AVAILABLE:
            raise MCPValidationError("PyJWT library not available")

        payload = self.verify_token(token)

        # Remove old timestamps
        payload.pop('iat', None)
        payload.pop('exp', None)

        return self.generate_token(payload, expires_in)

    def get_token_expiry(self, token: str) -> Optional[datetime]:
        """Get token expiry time."""
        if not JWT_AVAILABLE:
            raise MCPValidationError("PyJWT library not available")

        try:
            payload = jwt.decode(token, self.secret_key, algorithms=[self.algorithm], options={"verify_exp": False})
            exp_timestamp = payload.get('exp')
            if exp_timestamp:
                return datetime.fromtimestamp(exp_timestamp)
        except:
            pass
        return None


class MCPPasswordUtils:
    """Password utilities."""

    @staticmethod
    def generate_password(length: int = 12, include_special: bool = True) -> str:
        """Generate a secure random password."""
        if length < 8:
            raise MCPValidationError("Password length must be at least 8 characters")

        # Character sets
        lowercase = 'abcdefghijklmnopqrstuvwxyz'
        uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
        digits = '0123456789'
        special = '!@#$%^&*()_+-=[]{}|;:,.<>?'

        # Ensure at least one character from each set
        password = [
            secrets.choice(lowercase),
            secrets.choice(uppercase),
            secrets.choice(digits)
        ]

        if include_special:
            password.append(secrets.choice(special))

        # Fill remaining length
        all_chars = lowercase + uppercase + digits
        if include_special:
            all_chars += special

        for _ in range(length - len(password)):
            password.append(secrets.choice(all_chars))

        # Shuffle the password
        secrets.SystemRandom().shuffle(password)

        return ''.join(password)

    @staticmethod
    def validate_password_strength(password: str) -> Dict[str, Any]:
        """Validate password strength."""
        if len(password) < 8:
            return {"valid": False, "strength": "too_short", "score": 0}

        checks = {
            "length": len(password) >= 12,
            "lowercase": bool(re.search(r'[a-z]', password)),
            "uppercase": bool(re.search(r'[A-Z]', password)),
            "digits": bool(re.search(r'\d', password)),
            "special": bool(re.search(r'[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]', password))
        }

        score = sum(checks.values())

        if score < 3:
            strength = "weak"
        elif score < 5:
            strength = "medium"
        else:
            strength = "strong"

        return {
            "valid": score >= 4,
            "strength": strength,
            "score": score,
            "checks": checks
        }


class MCPCertificateManager:
    """Certificate management utilities."""

    @staticmethod
    def generate_self_signed_cert(common_name: str, validity_days: int = 365) -> Dict[str, str]:
        """Generate self-signed certificate (simplified implementation)."""
        # Note: This is a placeholder implementation
        # In production, install cryptography library and use proper certificate generation

        raise MCPValidationError(
            "Certificate generation requires cryptography library. "
            "Install with: pip install cryptography"
        )


class MCPEncryptionManager:
    """File/directory encryption manager."""

    def __init__(self, key: Optional[bytes] = None):
        if not CRYPTOGRAPHY_AVAILABLE:
            raise MCPValidationError("Cryptography library not available for encryption")
        self.key = key or Fernet.generate_key()
        self.cipher = Fernet(self.key)

    def encrypt_file(self, input_path: str, output_path: str) -> None:
        """Encrypt a file."""
        try:
            with open(input_path, 'rb') as f:
                data = f.read()

            encrypted_data = self.cipher.encrypt(data)

            with open(output_path, 'wb') as f:
                f.write(encrypted_data)
        except Exception as e:
            raise MCPValidationError(f"Failed to encrypt file: {str(e)}")

    def decrypt_file(self, input_path: str, output_path: str) -> None:
        """Decrypt a file."""
        try:
            with open(input_path, 'rb') as f:
                encrypted_data = f.read()

            decrypted_data = self.cipher.decrypt(encrypted_data)

            with open(output_path, 'wb') as f:
                f.write(decrypted_data)
        except Exception as e:
            raise MCPValidationError(f"Failed to decrypt file: {str(e)}")

    def encrypt_directory(self, input_dir: str, output_dir: str) -> None:
        """Encrypt all files in a directory."""
        from pathlib import Path

        input_path = Path(input_dir)
        output_path = Path(output_dir)

        if not input_path.exists() or not input_path.is_dir():
            raise MCPValidationError(f"Input directory not found: {input_dir}")

        output_path.mkdir(parents=True, exist_ok=True)

        for file_path in input_path.rglob('*'):
            if file_path.is_file():
                relative_path = file_path.relative_to(input_path)
                output_file = output_path / relative_path
                output_file.parent.mkdir(parents=True, exist_ok=True)

                self.encrypt_file(str(file_path), str(output_file))


class MCPAccessControl:
    """Access control utilities."""

    def __init__(self):
        self.roles = {}
        self.permissions = {}

    def add_role(self, role_name: str, permissions: List[str]) -> None:
        """Add a role with permissions."""
        self.roles[role_name] = set(permissions)

    def add_permission(self, permission: str, description: str = "") -> None:
        """Add a permission."""
        self.permissions[permission] = description

    def has_permission(self, user_roles: List[str], permission: str) -> bool:
        """Check if user has permission."""
        for role in user_roles:
            if role in self.roles and permission in self.roles[role]:
                return True
        return False

    def get_user_permissions(self, user_roles: List[str]) -> List[str]:
        """Get all permissions for user roles."""
        permissions = set()
        for role in user_roles:
            if role in self.roles:
                permissions.update(self.roles[role])
        return list(permissions)


class MCPAuditLogger:
    """Audit logging utilities."""

    def __init__(self, log_file: str = "audit.log"):
        self.log_file = log_file

    def log_action(self, user: str, action: str, resource: str,
                   success: bool, details: Optional[Dict[str, Any]] = None) -> None:
        """Log an audit event."""
        timestamp = datetime.utcnow().isoformat()
        event = {
            "timestamp": timestamp,
            "user": user,
            "action": action,
            "resource": resource,
            "success": success,
            "details": details or {}
        }

        try:
            with open(self.log_file, 'a') as f:
                f.write(json.dumps(event) + '\n')
        except Exception as e:
            print(f"Failed to write audit log: {str(e)}")

    def get_audit_trail(self, user: Optional[str] = None, action: Optional[str] = None,
                       limit: int = 100) -> List[Dict[str, Any]]:
        """Get audit trail with optional filtering."""
        events = []

        try:
            with open(self.log_file, 'r') as f:
                for line in f:
                    try:
                        event = json.loads(line.strip())
                        if user and event.get('user') != user:
                            continue
                        if action and event.get('action') != action:
                            continue
                        events.append(event)
                        if len(events) >= limit:
                            break
                    except json.JSONDecodeError:
                        continue
        except FileNotFoundError:
            pass

        return events
