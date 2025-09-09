#!/usr/bin/env python3
"""
AI Assistant MCP Server
Main server module that integrates all AI assistant tools.
"""

import asyncio
import json
import logging
import os
from typing import Any, Dict, List, Optional

from mcp import Tool
from mcp.server import Server
from mcp.types import TextContent, PromptMessage, Resource, ResourceTemplate

from .models import AIModelManager
from .content import ContentGenerator
from .code import CodeAnalyzer
from .data import DataAnalyzer

logger = logging.getLogger(__name__)


class AIAssistantServer:
    """AI Assistant MCP Server with integrated tools."""

    def __init__(self):
        self.server = Server("ai-assistant")
        self.ai_manager = AIModelManager()
        self.content_generator = ContentGenerator()
        self.code_analyzer = CodeAnalyzer()
        self.data_analyzer = DataAnalyzer()

        # Register tools
        self._register_tools()

    def _register_tools(self):
        """Register all available tools."""

        # AI Model Tools
        @self.server.tool()
        async def generate_content(prompt: str, model: str = "openai", max_tokens: int = 1000) -> str:
            """Generate content using AI models."""
            try:
                result = await self.ai_manager.generate_content(prompt, model, max_tokens)
                return json.dumps(result, indent=2)
            except Exception as e:
                return f"Error generating content: {e}"

        @self.server.tool()
        async def analyze_sentiment(text: str, model: str = "openai") -> str:
            """Analyze sentiment of text."""
            try:
                result = await self.ai_manager.analyze_sentiment(text, model)
                return json.dumps(result, indent=2)
            except Exception as e:
                return f"Error analyzing sentiment: {e}"

        @self.server.tool()
        async def translate_text(text: str, target_language: str, source_language: str = "auto", model: str = "openai") -> str:
            """Translate text to target language."""
            try:
                result = await self.ai_manager.translate_text(text, target_language, source_language, model)
                return json.dumps(result, indent=2)
            except Exception as e:
                return f"Error translating text: {e}"

        # Content Generation Tools
        @self.server.tool()
        async def generate_blog_post(topic: str, length: str = "medium", style: str = "informative") -> str:
            """Generate a blog post on a given topic."""
            try:
                result = await self.content_generator.generate_blog_post(topic, length, style)
                return json.dumps(result, indent=2)
            except Exception as e:
                return f"Error generating blog post: {e}"

        @self.server.tool()
        async def generate_social_media_post(content: str, platform: str = "twitter", tone: str = "engaging") -> str:
            """Generate social media posts from content."""
            try:
                result = await self.content_generator.generate_social_media_post(content, platform, tone)
                return json.dumps(result, indent=2)
            except Exception as e:
                return f"Error generating social media post: {e}"

        @self.server.tool()
        async def generate_email(content: str, email_type: str = "professional", recipient: str = "colleague") -> str:
            """Generate professional emails."""
            try:
                result = await self.content_generator.generate_email(content, email_type, recipient)
                return json.dumps(result, indent=2)
            except Exception as e:
                return f"Error generating email: {e}"

        @self.server.tool()
        async def summarize_text(text: str, summary_type: str = "concise", length: str = "medium") -> str:
            """Summarize text content."""
            try:
                result = await self.content_generator.summarize_text(text, summary_type, length)
                return json.dumps(result, indent=2)
            except Exception as e:
                return f"Error summarizing text: {e}"

        @self.server.tool()
        async def analyze_content_quality(text: str, content_type: str = "article") -> str:
            """Analyze content quality and provide suggestions."""
            try:
                result = await self.content_generator.analyze_content_quality(text, content_type)
                return json.dumps(result, indent=2)
            except Exception as e:
                return f"Error analyzing content quality: {e}"

        # Code Analysis Tools
        @self.server.tool()
        async def analyze_code(code: str, language: str, analysis_type: str = "bugs") -> str:
            """Analyze code for various issues."""
            try:
                result = await self.code_analyzer.analyze_code(code, language, analysis_type)
                return json.dumps(result, indent=2)
            except Exception as e:
                return f"Error analyzing code: {e}"

        @self.server.tool()
        async def generate_code(description: str, language: str, complexity: str = "simple") -> str:
            """Generate code based on description."""
            try:
                result = await self.code_analyzer.generate_code(description, language, complexity)
                return json.dumps(result, indent=2)
            except Exception as e:
                return f"Error generating code: {e}"

        # Data Analysis Tools
        @self.server.tool()
        async def analyze_data(data: str, data_type: str = "auto") -> str:
            """Analyze data and provide insights."""
            try:
                # Try to parse data as JSON first
                try:
                    parsed_data = json.loads(data)
                except json.JSONDecodeError:
                    parsed_data = data

                result = self.data_analyzer.analyze_data(parsed_data, data_type)
                return json.dumps(result, indent=2)
            except Exception as e:
                return f"Error analyzing data: {e}"

        @self.server.tool()
        async def generate_visualization_data(data: str, chart_type: str = "auto") -> str:
            """Generate data for visualization."""
            try:
                parsed_data = json.loads(data)
                result = self.data_analyzer.generate_visualization_data(parsed_data, chart_type)
                return json.dumps(result, indent=2)
            except Exception as e:
                return f"Error generating visualization data: {e}"

    async def serve_stdio(self):
        """Serve the MCP server over stdio."""
        from mcp.server.stdio import stdio_server

        async with stdio_server() as (read_stream, write_stream):
            await self.server.run(
                read_stream,
                write_stream,
                self.server.create_initialization_options()
            )

    async def serve_websocket(self, host: str = "localhost", port: int = 8000):
        """Serve the MCP server over WebSocket."""
        from mcp.server.websocket import websocket_server

        async with websocket_server(host=host, port=port) as server:
            await self.server.run(
                server.read_stream,
                server.write_stream,
                self.server.create_initialization_options()
            )


async def main():
    """Main entry point for the AI Assistant MCP Server."""
    import sys

    # Configure logging
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )

    server = AIAssistantServer()

    # Check if WebSocket mode is requested
    if len(sys.argv) > 1 and sys.argv[1] == "--websocket":
        host = sys.argv[2] if len(sys.argv) > 2 else "localhost"
        port = int(sys.argv[3]) if len(sys.argv) > 3 else 8000
        logger.info(f"Starting AI Assistant MCP Server on WebSocket {host}:{port}")
        await server.serve_websocket(host, port)
    else:
        logger.info("Starting AI Assistant MCP Server on stdio")
        await server.serve_stdio()


if __name__ == "__main__":
    asyncio.run(main())
