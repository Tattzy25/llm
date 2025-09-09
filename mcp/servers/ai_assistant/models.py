#!/usr/bin/env python3
"""
AI Model Integrations
Handles integration with various AI models (OpenAI, Anthropic, Google).
"""

import logging
import os
from typing import Any, Dict, List, Optional

try:
    import openai
except ImportError:
    openai = None

try:
    import anthropic
except ImportError:
    anthropic = None

try:
    import google.generativeai as genai
except ImportError:
    genai = None

logger = logging.getLogger(__name__)


class AIModelManager:
    """Manages AI model integrations."""

    def __init__(self):
        self.openai_client = None
        self.anthropic_client = None
        self.google_client = None
        self._setup_clients()

    def _setup_clients(self):
        """Setup AI model clients from environment variables."""
        # OpenAI
        openai_api_key = os.getenv('OPENAI_API_KEY')
        if openai_api_key and openai:
            try:
                self.openai_client = openai.OpenAI(api_key=openai_api_key)
                logger.info("OpenAI client initialized")
            except Exception as e:
                logger.error(f"Failed to initialize OpenAI client: {e}")

        # Anthropic
        anthropic_api_key = os.getenv('ANTHROPIC_API_KEY')
        if anthropic_api_key and anthropic:
            try:
                self.anthropic_client = anthropic.Anthropic(api_key=anthropic_api_key)
                logger.info("Anthropic client initialized")
            except Exception as e:
                logger.error(f"Failed to initialize Anthropic client: {e}")

        # Google Gemini
        google_api_key = os.getenv('GOOGLE_API_KEY')
        if google_api_key and genai:
            try:
                genai.configure(api_key=google_api_key)
                self.google_client = genai.GenerativeModel('gemini-pro')
                logger.info("Google Gemini client initialized")
            except Exception as e:
                logger.error(f"Failed to initialize Google client: {e}")

    async def generate_openai(self, prompt: str, **kwargs) -> Dict[str, Any]:
        """Generate content using OpenAI."""
        if not self.openai_client:
            raise ValueError("OpenAI client not configured")

        try:
            response = await self.openai_client.chat.completions.create(
                model=kwargs.get('model', 'gpt-3.5-turbo'),
                messages=[{"role": "user", "content": prompt}],
                max_tokens=kwargs.get('max_tokens', 1000),
                temperature=kwargs.get('temperature', 0.7)
            )

            return {
                "content": response.choices[0].message.content,
                "model": response.model,
                "usage": {
                    "prompt_tokens": response.usage.prompt_tokens,
                    "completion_tokens": response.usage.completion_tokens,
                    "total_tokens": response.usage.total_tokens
                }
            }
        except Exception as e:
            logger.error(f"OpenAI generation failed: {e}")
            raise

    async def generate_anthropic(self, prompt: str, **kwargs) -> Dict[str, Any]:
        """Generate content using Anthropic."""
        if not self.anthropic_client:
            raise ValueError("Anthropic client not configured")

        try:
            response = await self.anthropic_client.messages.create(
                model=kwargs.get('model', 'claude-3-sonnet-20240229'),
                max_tokens=kwargs.get('max_tokens', 1000),
                temperature=kwargs.get('temperature', 0.7),
                messages=[{"role": "user", "content": prompt}]
            )

            return {
                "content": response.content[0].text,
                "model": response.model,
                "usage": {
                    "input_tokens": response.usage.input_tokens,
                    "output_tokens": response.usage.output_tokens
                }
            }
        except Exception as e:
            logger.error(f"Anthropic generation failed: {e}")
            raise

    async def generate_google(self, prompt: str, **kwargs) -> Dict[str, Any]:
        """Generate content using Google Gemini."""
        if not self.google_client:
            raise ValueError("Google client not configured")

        try:
            response = self.google_client.generate_content(prompt)

            return {
                "content": response.text,
                "model": "gemini-pro"
            }
        except Exception as e:
            logger.error(f"Google generation failed: {e}")
            raise

    async def generate_content(self, prompt: str, model: str = "openai", **kwargs) -> Dict[str, Any]:
        """Generate content using specified model."""
        if model.lower() == "openai":
            return await self.generate_openai(prompt, **kwargs)
        elif model.lower() == "anthropic":
            return await self.generate_anthropic(prompt, **kwargs)
        elif model.lower() == "google":
            return await self.generate_google(prompt, **kwargs)
        else:
            raise ValueError(f"Unsupported model: {model}")

    def is_model_available(self, model: str) -> bool:
        """Check if a model is available."""
        if model.lower() == "openai":
            return self.openai_client is not None
        elif model.lower() == "anthropic":
            return self.anthropic_client is not None
        elif model.lower() == "google":
            return self.google_client is not None
        return False

    def get_available_models(self) -> List[str]:
        """Get list of available models."""
        models = []
        if self.openai_client:
            models.append("openai")
        if self.anthropic_client:
            models.append("anthropic")
        if self.google_client:
            models.append("google")
        return models
