#!/usr/bin/env python3
"""
MCP Validation Utils
====================

Validation utilities for MCP servers.
Provides parameter validation, type checking, and data validation.
"""

import re
import json
from typing import Dict, List, Optional, Any, Union, Type, Callable
from datetime import datetime

try:
    from email_validator import validate_email, EmailNotValidError
    EMAIL_VALIDATOR_AVAILABLE = True
except ImportError:
    EMAIL_VALIDATOR_AVAILABLE = False

from ..core import MCPValidationError


class MCPParameterValidator:
    """Parameter validation utility."""

    @staticmethod
    def validate_required(params: Dict[str, Any], required_fields: List[str]) -> None:
        """Validate that required fields are present."""
        missing = []
        for field in required_fields:
            if field not in params or params[field] is None:
                missing.append(field)

        if missing:
            raise MCPValidationError(f"Missing required fields: {', '.join(missing)}")

    @staticmethod
    def validate_types(params: Dict[str, Any], type_specs: Dict[str, Type]) -> None:
        """Validate parameter types."""
        for field, expected_type in type_specs.items():
            if field in params:
                value = params[field]
                if not isinstance(value, expected_type):
                    raise MCPValidationError(
                        f"Field '{field}' must be of type {expected_type.__name__}, "
                        f"got {type(value).__name__}"
                    )

    @staticmethod
    def validate_ranges(params: Dict[str, Any], range_specs: Dict[str, Dict[str, Any]]) -> None:
        """Validate parameter ranges."""
        for field, spec in range_specs.items():
            if field in params:
                value = params[field]

                if "min" in spec and value < spec["min"]:
                    raise MCPValidationError(f"Field '{field}' must be >= {spec['min']}")

                if "max" in spec and value > spec["max"]:
                    raise MCPValidationError(f"Field '{field}' must be <= {spec['max']}")

                if "choices" in spec and value not in spec["choices"]:
                    raise MCPValidationError(f"Field '{field}' must be one of: {spec['choices']}")


class MCPTypeValidator:
    """Type validation utilities."""

    @staticmethod
    def is_email(value: str) -> bool:
        """Validate email address."""
        if not EMAIL_VALIDATOR_AVAILABLE:
            # Basic email validation using regex
            import re
            email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
            return bool(re.match(email_pattern, value))

        try:
            validate_email(value)
            return True
        except EmailNotValidError:
            return False

    @staticmethod
    def is_url(value: str) -> bool:
        """Validate URL format."""
        url_pattern = re.compile(
            r'^https?://'  # http:// or https://
            r'(?:(?:[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?\.)+[A-Z]{2,6}\.?|'  # domain...
            r'localhost|'  # localhost...
            r'\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})'  # ...or ip
            r'(?::\d+)?'  # optional port
            r'(?:/?|[/?]\S+)$', re.IGNORECASE)

        return url_pattern.match(value) is not None

    @staticmethod
    def is_phone_number(value: str) -> bool:
        """Validate phone number format."""
        # Basic phone number validation (US format)
        phone_pattern = re.compile(r'^\+?1?[-.\s]?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})$')
        return phone_pattern.match(value) is not None

    @staticmethod
    def is_credit_card(value: str) -> bool:
        """Validate credit card number using Luhn algorithm."""
        def luhn_checksum(card_num: str) -> bool:
            def digits_of(n):
                return [int(d) for d in str(n)]
            digits = digits_of(card_num)
            odd_digits = digits[-1::-2]
            even_digits = digits[-2::-2]
            checksum = sum(odd_digits)
            for d in even_digits:
                checksum += sum(digits_of(d*2))
            return checksum % 10 == 0

        # Remove spaces and dashes
        card_num = re.sub(r'[-\s]', '', value)

        if not card_num.isdigit():
            return False

        # Check length (13-19 digits for most cards)
        if not 13 <= len(card_num) <= 19:
            return False

        return luhn_checksum(card_num)

    @staticmethod
    def is_uuid(value: str) -> bool:
        """Validate UUID format."""
        uuid_pattern = re.compile(
            r'^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$',
            re.IGNORECASE
        )
        return uuid_pattern.match(value) is not None

    @staticmethod
    def is_json(value: str) -> bool:
        """Validate JSON format."""
        try:
            json.loads(value)
            return True
        except (ValueError, TypeError):
            return False


class MCPFormatValidator:
    """Format validation utilities."""

    @staticmethod
    def validate_date_format(value: str, format_str: str = "%Y-%m-%d") -> bool:
        """Validate date format."""
        try:
            datetime.strptime(value, format_str)
            return True
        except ValueError:
            return False

    @staticmethod
    def validate_postal_code(value: str, country: str = "US") -> bool:
        """Validate postal code format."""
        patterns = {
            "US": r'^\d{5}(?:[-\s]\d{4})?$',
            "CA": r'^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$',
            "UK": r'^[A-Za-z]{1,2}\d[A-Za-z\d]?\s?\d[A-Za-z]{2}$',
            "DE": r'^\d{5}$',
            "FR": r'^\d{5}$'
        }

        pattern = patterns.get(country.upper(), patterns["US"])
        return re.match(pattern, value) is not None

    @staticmethod
    def validate_password_strength(password: str, min_length: int = 8) -> Dict[str, Any]:
        """Validate password strength."""
        if len(password) < min_length:
            return {"valid": False, "reason": f"Password must be at least {min_length} characters"}

        checks = {
            "has_lowercase": bool(re.search(r'[a-z]', password)),
            "has_uppercase": bool(re.search(r'[A-Z]', password)),
            "has_digit": bool(re.search(r'\d', password)),
            "has_special": bool(re.search(r'[!@#$%^&*(),.?":{}|<>]', password))
        }

        score = sum(checks.values())
        strength = "weak" if score < 2 else "medium" if score < 4 else "strong"

        return {
            "valid": score >= 3,  # Require at least 3 criteria
            "strength": strength,
            "score": score,
            "checks": checks
        }

    @staticmethod
    def validate_file_extension(filename: str, allowed_extensions: List[str]) -> bool:
        """Validate file extension."""
        if not filename or '.' not in filename:
            return False

        ext = filename.split('.')[-1].lower()
        return ext in [e.lower().lstrip('.') for e in allowed_extensions]


class MCPBusinessRuleValidator:
    """Business rule validation utilities."""

    def __init__(self):
        self.rules = {}

    def add_rule(self, name: str, rule_func: Callable[[Any], bool], error_message: str) -> None:
        """Add a business rule."""
        self.rules[name] = {"func": rule_func, "error": error_message}

    def validate(self, data: Dict[str, Any]) -> None:
        """Validate data against business rules."""
        for rule_name, rule_info in self.rules.items():
            if not rule_info["func"](data):
                raise MCPValidationError(rule_info["error"])

    @staticmethod
    def validate_age_range(age: int, min_age: int = 0, max_age: int = 150) -> bool:
        """Validate age is within reasonable range."""
        return min_age <= age <= max_age

    @staticmethod
    def validate_price_range(price: float, min_price: float = 0, max_price: float = 1000000) -> bool:
        """Validate price is within reasonable range."""
        return min_price <= price <= max_price

    @staticmethod
    def validate_quantity_range(quantity: int, min_qty: int = 0, max_qty: int = 10000) -> bool:
        """Validate quantity is within reasonable range."""
        return min_qty <= quantity <= max_qty


class MCPDataValidator:
    """Data validation utilities."""

    @staticmethod
    def validate_unique_values(values: List[Any]) -> bool:
        """Validate that all values in list are unique."""
        return len(values) == len(set(values))

    @staticmethod
    def validate_list_length(values: List[Any], min_length: int = 0, max_length: int = 1000) -> bool:
        """Validate list length."""
        return min_length <= len(values) <= max_length

    @staticmethod
    def validate_dict_keys(data: Dict[str, Any], required_keys: List[str],
                          allowed_keys: Optional[List[str]] = None) -> bool:
        """Validate dictionary keys."""
        # Check required keys
        if not all(key in data for key in required_keys):
            return False

        # Check allowed keys if specified
        if allowed_keys:
            return all(key in allowed_keys for key in data.keys())

        return True

    @staticmethod
    def validate_nested_structure(data: Dict[str, Any], schema: Dict[str, Any]) -> bool:
        """Validate nested data structure against schema."""
        def validate_value(value: Any, schema_value: Any) -> bool:
            if isinstance(schema_value, type):
                return isinstance(value, schema_value)
            elif isinstance(schema_value, dict):
                if not isinstance(value, dict):
                    return False
                return all(validate_value(value.get(k), v) for k, v in schema_value.items())
            elif isinstance(schema_value, list):
                if not isinstance(value, list) or len(schema_value) != 1:
                    return False
                return all(validate_value(item, schema_value[0]) for item in value)
            else:
                return value == schema_value

        return validate_value(data, schema)


class MCPInputSanitizer:
    """Input sanitization utilities."""

    @staticmethod
    def sanitize_string(text: str, max_length: int = 1000) -> str:
        """Sanitize string input."""
        if not text:
            return ""

        # Remove null bytes and control characters
        text = re.sub(r'[\x00-\x1f\x7f-\x9f]', '', text)

        # Trim whitespace
        text = text.strip()

        # Truncate if too long
        if len(text) > max_length:
            text = text[:max_length]

        return text

    @staticmethod
    def sanitize_html(text: str) -> str:
        """Basic HTML sanitization (remove script tags, etc.)."""
        # Remove script tags
        text = re.sub(r'<script[^>]*>.*?</script>', '', text, flags=re.IGNORECASE | re.DOTALL)

        # Remove other potentially dangerous tags
        dangerous_tags = ['iframe', 'object', 'embed', 'form', 'input', 'button']
        for tag in dangerous_tags:
            text = re.sub(rf'<{tag}[^>]*>.*?</{tag}>', '', text, flags=re.IGNORECASE | re.DOTALL)

        return text

    @staticmethod
    def sanitize_filename(filename: str) -> str:
        """Sanitize filename to prevent path traversal."""
        # Remove path separators
        filename = re.sub(r'[\/\\]', '', filename)

        # Remove other dangerous characters
        filename = re.sub(r'[<>:"|?*]', '', filename)

        # Remove control characters
        filename = re.sub(r'[\x00-\x1f\x7f-\x9f]', '', filename)

        return filename.strip()

    @staticmethod
    def sanitize_sql(value: Any) -> Any:
        """Basic SQL injection prevention (escape quotes)."""
        if isinstance(value, str):
            return value.replace("'", "''").replace('"', '""')
        return value


class MCPOutputFormatter:
    """Output formatting utilities."""

    @staticmethod
    def format_error_response(error: Exception, include_traceback: bool = False) -> Dict[str, Any]:
        """Format error response."""
        response = {
            "error": True,
            "message": str(error),
            "type": type(error).__name__
        }

        if include_traceback:
            import traceback
            response["traceback"] = traceback.format_exc()

        return response

    @staticmethod
    def format_success_response(data: Any, metadata: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Format success response."""
        response = {
            "error": False,
            "data": data
        }

        if metadata:
            response["metadata"] = metadata

        return response

    @staticmethod
    def format_paginated_response(data: List[Any], page: int, per_page: int,
                                total: int) -> Dict[str, Any]:
        """Format paginated response."""
        return {
            "error": False,
            "data": data,
            "pagination": {
                "page": page,
                "per_page": per_page,
                "total": total,
                "total_pages": (total + per_page - 1) // per_page,
                "has_next": page * per_page < total,
                "has_prev": page > 1
            }
        }

    @staticmethod
    def format_list_response(items: List[Any], item_type: str = "item") -> Dict[str, Any]:
        """Format list response."""
        return {
            "error": False,
            "data": items,
            "count": len(items),
            "type": item_type
        }
