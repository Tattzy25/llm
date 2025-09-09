#!/usr/bin/env python3
"""
Web Scraping Tools for Desktop Server
=====================================

Advanced web scraping tools integrated with the desktop server.
"""

import json
import asyncio
import logging
import re
from typing import Dict, List, Optional, Any, Union
from urllib.parse import urlparse, urljoin
from pathlib import Path

import requests
from bs4 import BeautifulSoup
import aiohttp
import aiofiles

from mcp.core.utils.validation import MCPValidationError
from .tools import MCPTool

logger = logging.getLogger(__name__)


class WebScrapingTool(MCPTool):
    """Advanced web scraping tool for desktop server."""

    def __init__(self):
        schema = {
            "type": "object",
            "properties": {
                "operation": {
                    "type": "string",
                    "enum": ["scrape_page", "extract_links", "download_content", "analyze_structure"],
                    "description": "Scraping operation to perform"
                },
                "url": {"type": "string", "description": "Target URL"},
                "selectors": {
                    "type": "object",
                    "description": "CSS selectors for content extraction",
                    "properties": {
                        "title": {"type": "string"},
                        "content": {"type": "string"},
                        "images": {"type": "string"},
                        "links": {"type": "string"}
                    }
                },
                "output_path": {"type": "string", "description": "Path to save downloaded content"},
                "headers": {"type": "object", "description": "Custom HTTP headers"},
                "timeout": {"type": "integer", "description": "Request timeout in seconds", "default": 30}
            },
            "required": ["operation", "url"]
        }
        super().__init__("web_scraping", "Advanced web scraping and content extraction", schema)

    async def execute(self, operation: str, url: str, **kwargs) -> Any:
        """Execute web scraping operation."""
        try:
            if operation == "scrape_page":
                return await self._scrape_page(url, **kwargs)
            elif operation == "extract_links":
                return await self._extract_links(url, **kwargs)
            elif operation == "download_content":
                return await self._download_content(url, **kwargs)
            elif operation == "analyze_structure":
                return await self._analyze_structure(url, **kwargs)
            else:
                raise Exception(f"Unknown operation: {operation}")
        except Exception as e:
            raise Exception(f"Web scraping failed: {str(e)}")

    async def _scrape_page(self, url: str, **kwargs) -> Dict[str, Any]:
        """Scrape a web page with custom selectors."""
        selectors = kwargs.get("selectors", {})
        headers = kwargs.get("headers", {})
        timeout = kwargs.get("timeout", 30)

        async with aiohttp.ClientSession(headers=headers, timeout=aiohttp.ClientTimeout(total=timeout)) as session:
            async with session.get(url) as response:
                if response.status != 200:
                    raise Exception(f"HTTP {response.status}: {response.reason}")

                html = await response.text()
                soup = BeautifulSoup(html, 'html.parser')

                result = {
                    "url": str(response.url),
                    "status_code": response.status,
                    "content_type": response.headers.get("content-type", ""),
                    "title": None,
                    "meta_description": None,
                    "extracted_content": {}
                }

                # Extract title
                if soup.title:
                    result["title"] = soup.title.string.strip()

                # Extract meta description
                meta_desc = soup.find("meta", attrs={"name": "description"})
                if meta_desc:
                    result["meta_description"] = meta_desc.get("content", "")

                # Extract content using selectors
                for key, selector in selectors.items():
                    if selector:
                        elements = soup.select(selector)
                        if elements:
                            if len(elements) == 1:
                                result["extracted_content"][key] = elements[0].get_text(strip=True)
                            else:
                                result["extracted_content"][key] = [el.get_text(strip=True) for el in elements]

                return result

    async def _extract_links(self, url: str, **kwargs) -> Dict[str, Any]:
        """Extract all links from a web page."""
        headers = kwargs.get("headers", {})
        timeout = kwargs.get("timeout", 30)

        async with aiohttp.ClientSession(headers=headers, timeout=aiohttp.ClientTimeout(total=timeout)) as session:
            async with session.get(url) as response:
                if response.status != 200:
                    raise Exception(f"HTTP {response.status}: {response.reason}")

                html = await response.text()
                soup = BeautifulSoup(html, 'html.parser')

                links = []
                base_url = str(response.url)

                for link in soup.find_all('a', href=True):
                    href = link['href']
                    absolute_url = urljoin(base_url, href)

                    links.append({
                        "text": link.get_text(strip=True),
                        "url": absolute_url,
                        "is_external": urlparse(absolute_url).netloc != urlparse(base_url).netloc
                    })

                return {
                    "url": base_url,
                    "total_links": len(links),
                    "internal_links": len([l for l in links if not l["is_external"]]),
                    "external_links": len([l for l in links if l["is_external"]]),
                    "links": links
                }

    async def _download_content(self, url: str, **kwargs) -> Dict[str, Any]:
        """Download content from URL to file."""
        output_path = kwargs.get("output_path")
        headers = kwargs.get("headers", {})
        timeout = kwargs.get("timeout", 30)

        if not output_path:
            raise Exception("output_path is required for download operation")

        async with aiohttp.ClientSession(headers=headers, timeout=aiohttp.ClientTimeout(total=timeout)) as session:
            async with session.get(url) as response:
                if response.status != 200:
                    raise Exception(f"HTTP {response.status}: {response.reason}")

                # Ensure output directory exists
                Path(output_path).parent.mkdir(parents=True, exist_ok=True)

                async with aiofiles.open(output_path, 'wb') as f:
                    async for chunk in response.content.iter_chunked(8192):
                        await f.write(chunk)

                return {
                    "url": str(response.url),
                    "output_path": output_path,
                    "content_type": response.headers.get("content-type", ""),
                    "content_length": response.headers.get("content-length"),
                    "status_code": response.status
                }

    async def _analyze_structure(self, url: str, **kwargs) -> Dict[str, Any]:
        """Analyze the structure of a web page."""
        headers = kwargs.get("headers", {})
        timeout = kwargs.get("timeout", 30)

        async with aiohttp.ClientSession(headers=headers, timeout=aiohttp.ClientTimeout(total=timeout)) as session:
            async with session.get(url) as response:
                if response.status != 200:
                    raise Exception(f"HTTP {response.status}: {response.reason}")

                html = await response.text()
                soup = BeautifulSoup(html, 'html.parser')

                # Analyze HTML structure
                structure = {
                    "headings": {},
                    "forms": len(soup.find_all('form')),
                    "images": len(soup.find_all('img')),
                    "scripts": len(soup.find_all('script')),
                    "stylesheets": len(soup.find_all('link', rel='stylesheet')),
                    "tables": len(soup.find_all('table')),
                    "divs": len(soup.find_all('div')),
                    "paragraphs": len(soup.find_all('p')),
                    "links": len(soup.find_all('a')),
                    "meta_tags": len(soup.find_all('meta'))
                }

                # Count headings by level
                for i in range(1, 7):
                    structure["headings"][f"h{i}"] = len(soup.find_all(f'h{i}'))

                # Get page metadata
                metadata = {}
                for meta in soup.find_all('meta'):
                    name = meta.get('name') or meta.get('property')
                    if name:
                        metadata[name] = meta.get('content', '')

                return {
                    "url": str(response.url),
                    "structure": structure,
                    "metadata": metadata,
                    "doctype": str(soup.find_parent('html'))[:100] if soup.find_parent('html') else None,
                    "charset": soup.find('meta', charset=True)['charset'] if soup.find('meta', charset=True) else None
                }


class ContentAnalysisTool(MCPTool):
    """AI-powered content analysis tool."""

    def __init__(self):
        schema = {
            "type": "object",
            "properties": {
                "operation": {
                    "type": "string",
                    "enum": ["analyze_sentiment", "extract_keywords", "summarize", "classify_content"],
                    "description": "Analysis operation to perform"
                },
                "content": {"type": "string", "description": "Content to analyze"},
                "language": {"type": "string", "description": "Content language", "default": "en"},
                "max_keywords": {"type": "integer", "description": "Maximum keywords to extract", "default": 10}
            },
            "required": ["operation", "content"]
        }
        super().__init__("content_analysis", "AI-powered content analysis and processing", schema)

    async def execute(self, operation: str, content: str, **kwargs) -> Any:
        """Execute content analysis operation."""
        try:
            if operation == "analyze_sentiment":
                return await self._analyze_sentiment(content, **kwargs)
            elif operation == "extract_keywords":
                return await self._extract_keywords(content, **kwargs)
            elif operation == "summarize":
                return await self._summarize(content, **kwargs)
            elif operation == "classify_content":
                return await self._classify_content(content, **kwargs)
            else:
                raise Exception(f"Unknown operation: {operation}")
        except Exception as e:
            raise Exception(f"Content analysis failed: {str(e)}")

    async def _analyze_sentiment(self, content: str, **kwargs) -> Dict[str, Any]:
        """Analyze sentiment of content."""
        # Simple rule-based sentiment analysis
        positive_words = ["good", "great", "excellent", "amazing", "wonderful", "fantastic", "love", "like", "best"]
        negative_words = ["bad", "terrible", "awful", "horrible", "hate", "worst", "disappointing", "poor"]

        words = content.lower().split()
        positive_count = sum(1 for word in words if word in positive_words)
        negative_count = sum(1 for word in words if word in negative_words)

        total_words = len(words)
        sentiment_score = (positive_count - negative_count) / max(total_words, 1)

        if sentiment_score > 0.1:
            sentiment = "positive"
        elif sentiment_score < -0.1:
            sentiment = "negative"
        else:
            sentiment = "neutral"

        return {
            "sentiment": sentiment,
            "score": sentiment_score,
            "positive_words": positive_count,
            "negative_words": negative_count,
            "confidence": min(abs(sentiment_score) * 2, 1.0)
        }

    async def _extract_keywords(self, content: str, **kwargs) -> Dict[str, Any]:
        """Extract keywords from content."""
        max_keywords = kwargs.get("max_keywords", 10)

        # Simple keyword extraction based on frequency
        words = re.findall(r'\b\w+\b', content.lower())
        stop_words = {"the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for", "of", "with", "by", "is", "are", "was", "were", "be", "been", "being", "have", "has", "had", "do", "does", "did", "will", "would", "could", "should", "may", "might", "must", "can", "shall"}

        word_freq = {}
        for word in words:
            if len(word) > 2 and word not in stop_words:
                word_freq[word] = word_freq.get(word, 0) + 1

        keywords = sorted(word_freq.items(), key=lambda x: x[1], reverse=True)[:max_keywords]

        return {
            "keywords": [{"word": word, "frequency": freq} for word, freq in keywords],
            "total_words": len(words),
            "unique_words": len(word_freq)
        }

    async def _summarize(self, content: str, **kwargs) -> Dict[str, Any]:
        """Generate a summary of content."""
        sentences = re.split(r'[.!?]+', content)
        sentences = [s.strip() for s in sentences if s.strip()]

        # Simple extractive summarization - take first and last sentences
        if len(sentences) <= 2:
            summary = ' '.join(sentences)
        else:
            summary = f"{sentences[0]} ... {sentences[-1]}"

        return {
            "summary": summary,
            "original_sentences": len(sentences),
            "summary_length": len(summary.split()),
            "compression_ratio": len(summary.split()) / max(len(content.split()), 1)
        }

    async def _classify_content(self, content: str, **kwargs) -> Dict[str, Any]:
        """Classify content type and topic."""
        # Simple rule-based classification
        content_lower = content.lower()

        categories = {
            "technology": ["computer", "software", "hardware", "programming", "code", "algorithm", "database"],
            "business": ["company", "market", "finance", "investment", "profit", "revenue", "customer"],
            "science": ["research", "study", "experiment", "theory", "discovery", "analysis", "data"],
            "health": ["medical", "disease", "treatment", "patient", "doctor", "health", "medicine"],
            "sports": ["game", "team", "player", "score", "match", "competition", "athlete"],
            "entertainment": ["movie", "music", "film", "actor", "show", "performance", "celebrity"]
        }

        category_scores = {}
        for category, keywords in categories.items():
            score = sum(1 for keyword in keywords if keyword in content_lower)
            if score > 0:
                category_scores[category] = score

        if category_scores:
            top_category = max(category_scores.items(), key=lambda x: x[1])
            return {
                "primary_category": top_category[0],
                "confidence": top_category[1] / max(len(categories[top_category[0]]), 1),
                "all_categories": category_scores
            }
        else:
            return {
                "primary_category": "general",
                "confidence": 0.0,
                "all_categories": {}
            }
