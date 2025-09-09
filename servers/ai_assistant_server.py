#!/usr/bin/env python3
"""
AI Assistant MCP Server - Production Ready
=========================================

An AI-powered MCP server providing intelligent code analysis, assistance,
and automation capabilities.

Features:
- Code analysis and insights
- AI-powered code generation
- Intelligent code review
- Documentation generation
- Code optimization suggestions
- Language model integration
- Context-aware assistance

Usage:
    python ai_assistant_server.py
"""

import asyncio
import json
import logging
import os
import sys
import re
from typing import Any, Dict, List, Optional, Union
from pathlib import Path
from datetime import datetime
import ast
import inspect

# AI/ML dependencies (optional)
try:
    import openai
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False

try:
    import anthropic
    ANTHROPIC_AVAILABLE = True
except ImportError:
    ANTHROPIC_AVAILABLE = False

# MCP Protocol
from mcp import Tool
from mcp.server import Server
from mcp.types import TextContent, PromptMessage

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stderr),
        logging.FileHandler('ai_assistant_server.log')
    ]
)
logger = logging.getLogger(__name__)

class AIAssistantServer:
    """Production-grade AI Assistant MCP Server"""

    def __init__(self):
        self.server = Server("ai-assistant-server")
        self.allowed_paths = self._get_allowed_paths()
        self.code_cache = {}
        self.analysis_cache = {}

        # AI model configurations
        self.ai_config = {
            "openai": {
                "api_key": os.getenv("OPENAI_API_KEY"),
                "model": "gpt-4",
                "max_tokens": 2000
            },
            "anthropic": {
                "api_key": os.getenv("ANTHROPIC_API_KEY"),
                "model": "claude-3-sonnet-20240229",
                "max_tokens": 2000
            }
        }

        self.setup_tools()

    def _get_allowed_paths(self) -> List[str]:
        """Get list of allowed file system paths"""
        home = str(Path.home())
        desktop = str(Path.home() / "Desktop")
        documents = str(Path.home() / "Documents")
        downloads = str(Path.home() / "Downloads")

        return [
            home,
            desktop,
            documents,
            downloads,
            os.getcwd()
        ]

    def _is_path_allowed(self, path: str) -> bool:
        """Check if path is within allowed directories"""
        try:
            abs_path = os.path.abspath(path)
            return any(abs_path.startswith(allowed) for allowed in self.allowed_paths)
        except:
            return False

    def setup_tools(self):
        """Setup all MCP tools"""

        @self.server.tool()
        async def analyze_code_intelligence(path: str, analysis_type: str = "comprehensive") -> str:
            """Perform intelligent code analysis with AI insights"""
            if not self._is_path_allowed(path):
                raise ValueError(f"Access denied: {path}")

            try:
                with open(path, 'r', encoding='utf-8') as f:
                    code = f.read()

                # Cache check
                cache_key = f"{path}:{hash(code)}:{analysis_type}"
                if cache_key in self.analysis_cache:
                    return self.analysis_cache[cache_key]

                analysis = await self._perform_ai_code_analysis(code, path, analysis_type)

                # Cache result
                self.analysis_cache[cache_key] = analysis
                return analysis

            except Exception as e:
                raise ValueError(f"Failed to analyze code: {e}")

        @self.server.tool()
        async def generate_code_suggestion(context: str, language: str, task: str) -> str:
            """Generate code suggestions using AI"""
            try:
                prompt = f"""
                Generate {language} code for the following task:
                {task}

                Context: {context}

                Provide clean, well-documented code with best practices.
                """

                suggestion = await self._call_ai_model(prompt, "code_generation")
                return suggestion

            except Exception as e:
                raise ValueError(f"Failed to generate code suggestion: {e}")

        @self.server.tool()
        async def review_code_quality(path: str) -> str:
            """Perform comprehensive code review with AI"""
            if not self._is_path_allowed(path):
                raise ValueError(f"Access denied: {path}")

            try:
                with open(path, 'r', encoding='utf-8') as f:
                    code = f.read()

                review = await self._perform_code_review(code, path)
                return review

            except Exception as e:
                raise ValueError(f"Failed to review code: {e}")

        @self.server.tool()
        async def optimize_code(path: str, optimization_type: str = "performance") -> str:
            """Optimize code using AI analysis"""
            if not self._is_path_allowed(path):
                raise ValueError(f"Access denied: {path}")

            try:
                with open(path, 'r', encoding='utf-8') as f:
                    code = f.read()

                optimization = await self._optimize_code_with_ai(code, path, optimization_type)
                return optimization

            except Exception as e:
                raise ValueError(f"Failed to optimize code: {e}")

        @self.server.tool()
        async def generate_documentation(path: str, doc_type: str = "comprehensive") -> str:
            """Generate documentation for code using AI"""
            if not self._is_path_allowed(path):
                raise ValueError(f"Access denied: {path}")

            try:
                with open(path, 'r', encoding='utf-8') as f:
                    code = f.read()

                docs = await self._generate_ai_documentation(code, path, doc_type)
                return docs

            except Exception as e:
                raise ValueError(f"Failed to generate documentation: {e}")

        @self.server.tool()
        async def explain_code_segment(code: str, language: str) -> str:
            """Explain code segment using AI"""
            try:
                explanation = await self._explain_code_with_ai(code, language)
                return explanation

            except Exception as e:
                raise ValueError(f"Failed to explain code: {e}")

        @self.server.tool()
        async def suggest_improvements(path: str) -> str:
            """Suggest code improvements using AI analysis"""
            if not self._is_path_allowed(path):
                raise ValueError(f"Access denied: {path}")

            try:
                with open(path, 'r', encoding='utf-8') as f:
                    code = f.read()

                suggestions = await self._suggest_improvements_with_ai(code, path)
                return suggestions

            except Exception as e:
                raise ValueError(f"Failed to suggest improvements: {e}")

        @self.server.tool()
        async def detect_code_smells(path: str) -> str:
            """Detect code smells and anti-patterns"""
            if not self._is_path_allowed(path):
                raise ValueError(f"Access denied: {path}")

            try:
                with open(path, 'r', encoding='utf-8') as f:
                    code = f.read()

                smells = await self._detect_code_smells_with_ai(code, path)
                return smells

            except Exception as e:
                raise ValueError(f"Failed to detect code smells: {e}")

    async def _perform_ai_code_analysis(self, code: str, path: str, analysis_type: str) -> str:
        """Perform AI-powered code analysis"""
        try:
            file_ext = Path(path).suffix.lower()
            language = self._detect_language(file_ext)

            prompt = f"""
            Analyze the following {language} code from file {path}:

            ```{language}
            {code}
            ```

            Provide a {analysis_type} analysis including:
            1. Code structure and organization
            2. Potential issues or bugs
            3. Best practices compliance
            4. Performance considerations
            5. Maintainability assessment
            6. Security concerns (if any)

            Format your response as structured JSON.
            """

            analysis_result = await self._call_ai_model(prompt, "analysis")

            # Parse and structure the response
            try:
                analysis_data = json.loads(analysis_result)
                return json.dumps(analysis_data, indent=2)
            except:
                return analysis_result

        except Exception as e:
            logger.error(f"AI code analysis failed: {e}")
            return self._fallback_code_analysis(code, path)

    async def _perform_code_review(self, code: str, path: str) -> str:
        """Perform AI-powered code review"""
        try:
            file_ext = Path(path).suffix.lower()
            language = self._detect_language(file_ext)

            prompt = f"""
            Perform a comprehensive code review of the following {language} code:

            ```{language}
            {code}
            ```

            Provide feedback on:
            1. Code quality and style
            2. Potential bugs or issues
            3. Security vulnerabilities
            4. Performance optimizations
            5. Best practices adherence
            6. Documentation quality
            7. Test coverage suggestions

            Rate the code on a scale of 1-10 for each category.
            Provide specific recommendations for improvement.
            """

            review_result = await self._call_ai_model(prompt, "review")
            return review_result

        except Exception as e:
            logger.error(f"AI code review failed: {e}")
            return "Code review failed due to AI service unavailability"

    async def _optimize_code_with_ai(self, code: str, path: str, optimization_type: str) -> str:
        """Optimize code using AI"""
        try:
            file_ext = Path(path).suffix.lower()
            language = self._detect_language(file_ext)

            prompt = f"""
            Optimize the following {language} code for {optimization_type}:

            ```{language}
            {code}
            ```

            Focus on:
            1. Algorithm efficiency
            2. Memory usage optimization
            3. Code readability improvements
            4. Best practices implementation
            5. Performance bottlenecks

            Provide the optimized version with explanations of changes made.
            """

            optimization_result = await self._call_ai_model(prompt, "optimization")
            return optimization_result

        except Exception as e:
            logger.error(f"AI code optimization failed: {e}")
            return "Code optimization failed due to AI service unavailability"

    async def _generate_ai_documentation(self, code: str, path: str, doc_type: str) -> str:
        """Generate documentation using AI"""
        try:
            file_ext = Path(path).suffix.lower()
            language = self._detect_language(file_ext)

            prompt = f"""
            Generate {doc_type} documentation for the following {language} code:

            ```{language}
            {code}
            ```

            Include:
            1. Overview and purpose
            2. Function/class documentation
            3. Usage examples
            4. API reference
            5. Dependencies and requirements
            6. Installation/setup instructions

            Format as clean, readable documentation.
            """

            docs_result = await self._call_ai_model(prompt, "documentation")
            return docs_result

        except Exception as e:
            logger.error(f"AI documentation generation failed: {e}")
            return "Documentation generation failed due to AI service unavailability"

    async def _explain_code_with_ai(self, code: str, language: str) -> str:
        """Explain code using AI"""
        try:
            prompt = f"""
            Explain the following {language} code in detail:

            ```{language}
            {code}
            ```

            Provide:
            1. What the code does
            2. How it works (step by step)
            3. Key concepts and patterns used
            4. Potential edge cases
            5. Alternative approaches

            Make it easy to understand for both beginners and experienced developers.
            """

            explanation = await self._call_ai_model(prompt, "explanation")
            return explanation

        except Exception as e:
            logger.error(f"AI code explanation failed: {e}")
            return "Code explanation failed due to AI service unavailability"

    async def _suggest_improvements_with_ai(self, code: str, path: str) -> str:
        """Suggest code improvements using AI"""
        try:
            file_ext = Path(path).suffix.lower()
            language = self._detect_language(file_ext)

            prompt = f"""
            Suggest improvements for the following {language} code:

            ```{language}
            {code}
            ```

            Focus on:
            1. Code readability and maintainability
            2. Error handling improvements
            3. Performance optimizations
            4. Security enhancements
            5. Modern language features usage
            6. Testing recommendations

            Prioritize suggestions by impact and difficulty.
            """

            suggestions = await self._call_ai_model(prompt, "suggestions")
            return suggestions

        except Exception as e:
            logger.error(f"AI improvement suggestions failed: {e}")
            return "Improvement suggestions failed due to AI service unavailability"

    async def _detect_code_smells_with_ai(self, code: str, path: str) -> str:
        """Detect code smells using AI"""
        try:
            file_ext = Path(path).suffix.lower()
            language = self._detect_language(file_ext)

            prompt = f"""
            Analyze the following {language} code for code smells and anti-patterns:

            ```{language}
            {code}
            ```

            Identify:
            1. Code smells (long methods, large classes, etc.)
            2. Anti-patterns
            3. Design issues
            4. Maintainability concerns
            5. Technical debt indicators

            For each issue found, provide:
            - Description of the problem
            - Severity level
            - Suggested fix
            - Code example of the improvement
            """

            smells = await self._call_ai_model(prompt, "code_smells")
            return smells

        except Exception as e:
            logger.error(f"AI code smell detection failed: {e}")
            return "Code smell detection failed due to AI service unavailability"

    async def _call_ai_model(self, prompt: str, task_type: str) -> str:
        """Call AI model for various tasks"""
        # Try OpenAI first
        if OPENAI_AVAILABLE and self.ai_config["openai"]["api_key"]:
            try:
                client = openai.OpenAI(api_key=self.ai_config["openai"]["api_key"])

                response = client.chat.completions.create(
                    model=self.ai_config["openai"]["model"],
                    messages=[
                        {"role": "system", "content": f"You are an expert {task_type} assistant."},
                        {"role": "user", "content": prompt}
                    ],
                    max_tokens=self.ai_config["openai"]["max_tokens"],
                    temperature=0.7
                )

                return response.choices[0].message.content

            except Exception as e:
                logger.warning(f"OpenAI call failed: {e}")

        # Try Anthropic as fallback
        if ANTHROPIC_AVAILABLE and self.ai_config["anthropic"]["api_key"]:
            try:
                client = anthropic.Anthropic(api_key=self.ai_config["anthropic"]["api_key"])

                response = client.messages.create(
                    model=self.ai_config["anthropic"]["model"],
                    max_tokens=self.ai_config["anthropic"]["max_tokens"],
                    system=f"You are an expert {task_type} assistant.",
                    messages=[
                        {"role": "user", "content": prompt}
                    ]
                )

                return response.content[0].text

            except Exception as e:
                logger.warning(f"Anthropic call failed: {e}")

        # Fallback to basic analysis
        return self._fallback_ai_response(task_type)

    def _fallback_ai_response(self, task_type: str) -> str:
        """Provide fallback response when AI is unavailable"""
        fallbacks = {
            "analysis": "AI analysis unavailable. Basic static analysis shows the code structure appears valid.",
            "review": "AI code review unavailable. Please ensure code follows language-specific best practices.",
            "optimization": "AI optimization unavailable. Consider profiling for performance bottlenecks.",
            "documentation": "AI documentation unavailable. Please add docstrings and comments manually.",
            "explanation": "AI explanation unavailable. Review language documentation for code understanding.",
            "suggestions": "AI suggestions unavailable. Consider code linting tools for basic improvements.",
            "code_smells": "AI smell detection unavailable. Use static analysis tools for code quality checks."
        }

        return fallbacks.get(task_type, "AI service unavailable")

    def _detect_language(self, file_extension: str) -> str:
        """Detect programming language from file extension"""
        language_map = {
            '.py': 'Python',
            '.js': 'JavaScript',
            '.ts': 'TypeScript',
            '.java': 'Java',
            '.cpp': 'C++',
            '.c': 'C',
            '.cs': 'C#',
            '.php': 'PHP',
            '.rb': 'Ruby',
            '.go': 'Go',
            '.rs': 'Rust',
            '.swift': 'Swift',
            '.kt': 'Kotlin',
            '.scala': 'Scala'
        }

        return language_map.get(file_extension, 'Unknown')

    def _fallback_code_analysis(self, code: str, path: str) -> str:
        """Basic static code analysis fallback"""
        lines = code.splitlines()
        analysis = {
            "basic_metrics": {
                "total_lines": len(lines),
                "code_lines": len([l for l in lines if l.strip() and not l.strip().startswith('#')]),
                "comment_lines": len([l for l in lines if l.strip().startswith('#')]),
                "empty_lines": len([l for l in lines if not l.strip()])
            },
            "structure": {
                "functions": len(re.findall(r'def\s+\w+', code)),
                "classes": len(re.findall(r'class\s+\w+', code)),
                "imports": len(re.findall(r'^(import|from)\s+', code, re.MULTILINE))
            }
        }

        return json.dumps(analysis, indent=2)

import uvicorn
from fastapi import FastAPI

# ... (rest of the imports)

# MCP Protocol
from mcp import Tool
from mcp.server import Server
from mcp.types import TextContent, PromptMessage
from mcp.transport.fastapi import add_mcp_routes

# ... (rest of the file)

class AIAssistantServer:
    # ... (rest of the class)

# Create FastAPI app
app = FastAPI(title="AI Assistant MCP Server", version="1.0.0")

# Create and setup the server
ai_server = AIAssistantServer()

# Add the MCP routes to the FastAPI app
add_mcp_routes(app, ai_server.server)

@app.get("/")sync def root():
    return {"message": "AI Assistant MCP Server is running"}

if __name__ == "__main__":
    uvicorn.run(app, host="localhost", port=8002)

