#!/usr/bin/env python3
"""
Search Engine Integration Module
Provides web search capabilities across multiple search engines.
"""

import asyncio
import json
import logging
import re
from typing import Any, Dict, List, Optional

import aiohttp
from bs4 import BeautifulSoup

logger = logging.getLogger(__name__)


class SearchEngineTool:
    """Search engine integration for web scraping."""

    def __init__(self):
        self.session = None

    async def __aenter__(self):
        self.session = aiohttp.ClientSession(
            headers={
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        )
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()

    async def search_web(self, query: str, engine: str = 'google', max_results: int = 10,
                        safe_search: bool = True) -> List[Dict[str, str]]:
        """Perform web search using specified engine."""
        if engine.lower() == 'google':
            return await self._search_google(query, max_results, safe_search)
        elif engine.lower() == 'bing':
            return await self._search_bing(query, max_results, safe_search)
        elif engine.lower() == 'duckduckgo':
            return await self._search_duckduckgo(query, max_results, safe_search)
        elif engine.lower() == 'brave':
            return await self._search_brave(query, max_results, safe_search)
        else:
            raise ValueError(f"Unsupported search engine: {engine}")

    async def _search_google(self, query: str, max_results: int, safe_search: bool) -> List[Dict[str, str]]:
        """Search using Google."""
        try:
            search_url = f"https://www.google.com/search?q={query}&num={max_results}"
            if safe_search:
                search_url += "&safe=active"

            async with self.session.get(search_url) as response:
                if response.status != 200:
                    return []

                html = await response.text()
                soup = BeautifulSoup(html, 'html.parser')

                results = []
                for result in soup.select('div.g')[:max_results]:
                    title_elem = result.select_one('h3')
                    link_elem = result.select_one('a')
                    snippet_elem = result.select_one('span')

                    if title_elem and link_elem:
                        results.append({
                            'title': title_elem.get_text(),
                            'url': link_elem.get('href'),
                            'snippet': snippet_elem.get_text() if snippet_elem else ''
                        })

                return results

        except Exception as e:
            logger.error(f"Error searching Google: {e}")
            return []

    async def _search_bing(self, query: str, max_results: int, safe_search: bool) -> List[Dict[str, str]]:
        """Search using Bing."""
        try:
            search_url = f"https://www.bing.com/search?q={query}&count={max_results}"
            if safe_search:
                search_url += "&adlt=strict"

            async with self.session.get(search_url) as response:
                if response.status != 200:
                    return []

                html = await response.text()
                soup = BeautifulSoup(html, 'html.parser')

                results = []
                for result in soup.select('li.b_algo')[:max_results]:
                    title_elem = result.select_one('h2 a')
                    link_elem = result.select_one('h2 a')
                    snippet_elem = result.select_one('p')

                    if title_elem and link_elem:
                        results.append({
                            'title': title_elem.get_text(),
                            'url': link_elem.get('href'),
                            'snippet': snippet_elem.get_text() if snippet_elem else ''
                        })

                return results

        except Exception as e:
            logger.error(f"Error searching Bing: {e}")
            return []

    async def _search_duckduckgo(self, query: str, max_results: int, safe_search: bool) -> List[Dict[str, str]]:
        """Search using DuckDuckGo."""
        try:
            search_url = f"https://duckduckgo.com/html/?q={query}"

            async with self.session.get(search_url) as response:
                if response.status != 200:
                    return []

                html = await response.text()
                soup = BeautifulSoup(html, 'html.parser')

                results = []
                for result in soup.select('div.result')[:max_results]:
                    title_elem = result.select_one('.result__title a')
                    link_elem = result.select_one('.result__title a')
                    snippet_elem = result.select_one('.result__snippet')

                    if title_elem and link_elem:
                        results.append({
                            'title': title_elem.get_text(),
                            'url': link_elem.get('href'),
                            'snippet': snippet_elem.get_text() if snippet_elem else ''
                        })

                return results

        except Exception as e:
            logger.error(f"Error searching DuckDuckGo: {e}")
            return []

    async def _search_brave(self, query: str, max_results: int, safe_search: bool) -> List[Dict[str, str]]:
        """Search using Brave Search."""
        try:
            search_url = f"https://search.brave.com/search?q={query}&count={max_results}"

            async with self.session.get(search_url) as response:
                if response.status != 200:
                    return []

                html = await response.text()
                soup = BeautifulSoup(html, 'html.parser')

                results = []
                for result in soup.select('.snippet')[:max_results]:
                    title_elem = result.select_one('.snippet-title a')
                    link_elem = result.select_one('.snippet-title a')
                    snippet_elem = result.select_one('.snippet-description')

                    if title_elem and link_elem:
                        results.append({
                            'title': title_elem.get_text(),
                            'url': link_elem.get('href'),
                            'snippet': snippet_elem.get_text() if snippet_elem else ''
                        })

                return results

        except Exception as e:
            logger.error(f"Error searching Brave: {e}")
            return []
