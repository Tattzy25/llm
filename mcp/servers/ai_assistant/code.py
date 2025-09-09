#!/usr/bin/env python3
"""
Code Analysis Tools
AI-powered code analysis and assistance tools.
"""

import logging
import re
from typing import Any, Dict, List, Optional

from .models import AIModelManager

logger = logging.getLogger(__name__)


class CodeAnalyzer:
    """Code analysis and assistance tools."""

    def __init__(self):
        self.ai_manager = AIModelManager()

    async def analyze_code(self, code: str, language: str, analysis_type: str = "bugs") -> Dict[str, Any]:
        """Analyze code for various issues."""
        try:
            if analysis_type == "bugs":
                return await self._analyze_bugs(code, language)
            elif analysis_type == "performance":
                return await self._analyze_performance(code, language)
            elif analysis_type == "security":
                return await self._analyze_security(code, language)
            elif analysis_type == "style":
                return await self._analyze_style(code, language)
            else:
                return await self._analyze_general(code, language)

        except Exception as e:
            logger.error(f"Code analysis failed: {e}")
            return {"error": str(e), "language": language, "analysis_type": analysis_type}

    async def _analyze_bugs(self, code: str, language: str) -> Dict[str, Any]:
        """Analyze code for potential bugs."""
        prompt = f"""Analyze this {language} code for potential bugs and issues:

```python
{code}
```

Provide:
1. List of potential bugs or issues
2. Severity level for each issue
3. Suggested fixes
4. Best practices recommendations

Format as JSON with the following structure:
{{
    "issues": [
        {{
            "type": "bug/performance/security/style",
            "severity": "low/medium/high/critical",
            "description": "description of the issue",
            "line_number": 123,
            "suggestion": "how to fix it"
        }}
    ],
    "overall_score": 85,
    "recommendations": ["list of recommendations"]
}}"""

        try:
            result = await self.ai_manager.generate_content(prompt, model="openai")
            return {
                "analysis": result["content"],
                "language": language,
                "analysis_type": "bugs",
                "code_length": len(code)
            }
        except:
            return self._basic_bug_analysis(code, language)

    def _basic_bug_analysis(self, code: str, language: str) -> Dict[str, Any]:
        """Basic bug analysis without AI."""
        issues = []

        # Check for common Python issues
        if language.lower() == "python":
            # Check for print statements without parentheses (Python 2 style)
            if re.search(r'\bprint\s+[^(]', code):
                issues.append({
                    "type": "syntax",
                    "severity": "medium",
                    "description": "Print statement without parentheses",
                    "suggestion": "Use print() function instead of print statement"
                })

            # Check for undefined variables (simple check)
            lines = code.split('\n')
            defined_vars = set()
            used_vars = set()

            for line in lines:
                # Simple variable definition detection
                def_match = re.search(r'\b(\w+)\s*=', line)
                if def_match:
                    defined_vars.add(def_match.group(1))

                # Simple variable usage detection
                for word in re.findall(r'\b\w+\b', line):
                    if word not in ['if', 'for', 'while', 'def', 'class', 'import', 'from', 'return', 'print']:
                        used_vars.add(word)

            undefined = used_vars - defined_vars - {'True', 'False', 'None'}
            for var in undefined:
                issues.append({
                    "type": "variable",
                    "severity": "high",
                    "description": f"Variable '{var}' may be undefined",
                    "suggestion": "Ensure all variables are defined before use"
                })

        return {
            "issues": issues,
            "overall_score": max(0, 100 - len(issues) * 10),
            "language": language,
            "analysis_type": "bugs"
        }

    async def _analyze_performance(self, code: str, language: str) -> Dict[str, Any]:
        """Analyze code for performance issues."""
        prompt = f"""Analyze this {language} code for performance optimization opportunities:

```python
{code}
```

Provide:
1. Performance bottlenecks
2. Optimization suggestions
3. Time/space complexity analysis
4. Best practices for performance

Format as JSON."""

        try:
            result = await self.ai_manager.generate_content(prompt, model="openai")
            return {
                "analysis": result["content"],
                "language": language,
                "analysis_type": "performance"
            }
        except:
            return {"error": "Performance analysis requires AI model configuration"}

    async def _analyze_security(self, code: str, language: str) -> Dict[str, Any]:
        """Analyze code for security vulnerabilities."""
        prompt = f"""Analyze this {language} code for security vulnerabilities:

```python
{code}
```

Provide:
1. Security vulnerabilities
2. Risk assessment
3. Remediation suggestions
4. Security best practices

Format as JSON."""

        try:
            result = await self.ai_manager.generate_content(prompt, model="openai")
            return {
                "analysis": result["content"],
                "language": language,
                "analysis_type": "security"
            }
        except:
            return {"error": "Security analysis requires AI model configuration"}

    async def _analyze_style(self, code: str, language: str) -> Dict[str, Any]:
        """Analyze code style and formatting."""
        prompt = f"""Analyze this {language} code for style and formatting issues:

```python
{code}
```

Provide:
1. Style violations
2. Formatting suggestions
3. Code readability improvements
4. Language-specific best practices

Format as JSON."""

        try:
            result = await self.ai_manager.generate_content(prompt, model="openai")
            return {
                "analysis": result["content"],
                "language": language,
                "analysis_type": "style"
            }
        except:
            return {"error": "Style analysis requires AI model configuration"}

    async def _analyze_general(self, code: str, language: str) -> Dict[str, Any]:
        """General code analysis."""
        return {
            "language": language,
            "code_length": len(code),
            "line_count": len(code.split('\n')),
            "character_count": len(code),
            "analysis_type": "general"
        }

    async def generate_code(self, description: str, language: str, complexity: str = "simple") -> Dict[str, Any]:
        """Generate code based on description."""
        prompt = f"""Generate {language} code for: {description}

Requirements:
- Complexity: {complexity}
- Include comments
- Follow {language} best practices
- Make it readable and maintainable

Provide the complete code with proper formatting."""

        try:
            result = await self.ai_manager.generate_content(prompt, model="openai")
            return {
                "code": result["content"],
                "language": language,
                "description": description,
                "complexity": complexity
            }
        except Exception as e:
            return {"error": str(e), "language": language, "description": description}
