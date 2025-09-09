#!/usr/bin/env python3
"""
Advanced Web Scraping MCP Server
Provides comprehensive web scraping, content analysis, and data extraction capabilities.
"""

import asyncio
import json
import logging
import re
from typing import Any, Dict, List, Optional, Union
from urllib.parse import urlparse, urljoin

import aiohttp
import requests
from bs4 import BeautifulSoup
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from mcp.server import FastMCP
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class WebScrapingTool:
    """Advanced web scraping tool with multiple extraction methods."""

    def __init__(self):
        self.session = None
        self.driver = None

    async def __aenter__(self):
        self.session = aiohttp.ClientSession(
            headers={
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        )
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
        if self.driver:
            self.driver.quit()

    def _init_selenium_driver(self):
        """Initialize Selenium WebDriver for JavaScript-heavy sites."""
        if not self.driver:
            options = Options()
            options.add_argument('--headless')
            options.add_argument('--no-sandbox')
            options.add_argument('--disable-dev-shm-usage')
            options.add_argument('--disable-gpu')
            options.add_argument('--window-size=1920,1080')
            self.driver = webdriver.Chrome(options=options)

    async def scrape_with_requests(self, url: str, selectors: Dict[str, str] = None,
                                 headers: Dict[str, str] = None) -> Dict[str, Any]:
        """Scrape using requests + BeautifulSoup for static content."""
        try:
            custom_headers = headers or {}
            async with self.session.get(url, headers={**self.session.headers, **custom_headers}) as response:
                response.raise_for_status()
                html = await response.text()

            soup = BeautifulSoup(html, 'html.parser')
            result = {
                'url': url,
                'status_code': response.status,
                'title': soup.title.string if soup.title else None,
                'content': {}
            }

            if selectors:
                for name, selector in selectors.items():
                    elements = soup.select(selector)
                    if elements:
                        if len(elements) == 1:
                            result['content'][name] = elements[0].get_text(strip=True)
                        else:
                            result['content'][name] = [elem.get_text(strip=True) for elem in elements]

            return result

        except Exception as e:
            logger.error(f"Error scraping {url}: {str(e)}")
            return {'error': str(e), 'url': url}

    async def scrape_with_selenium(self, url: str, selectors: Dict[str, str] = None,
                                  wait_for: str = None) -> Dict[str, Any]:
        """Scrape using Selenium for JavaScript-heavy sites."""
        try:
            self._init_selenium_driver()
            self.driver.get(url)

            if wait_for:
                WebDriverWait(self.driver, 10).until(
                    EC.presence_of_element_located((By.CSS_SELECTOR, wait_for))
                )

            result = {
                'url': url,
                'title': self.driver.title,
                'content': {}
            }

            if selectors:
                for name, selector in selectors.items():
                    try:
                        elements = self.driver.find_elements(By.CSS_SELECTOR, selector)
                        if elements:
                            if len(elements) == 1:
                                result['content'][name] = elements[0].text
                            else:
                                result['content'][name] = [elem.text for elem in elements]
                    except Exception as e:
                        result['content'][name] = f"Error: {str(e)}"

            return result

        except Exception as e:
            logger.error(f"Error scraping {url} with Selenium: {str(e)}")
            return {'error': str(e), 'url': url}

    async def search_web(self, query: str, engine: str = 'google', max_results: int = 10,
                        safe_search: bool = True) -> List[Dict[str, str]]:
        """Search the web using various search engines."""
        try:
            if engine == 'google':
                return await self._search_google(query, max_results, safe_search)
            elif engine == 'bing':
                return await self._search_bing(query, max_results, safe_search)
            elif engine == 'duckduckgo':
                return await self._search_duckduckgo(query, max_results, safe_search)
            elif engine == 'brave':
                return await self._search_brave(query, max_results, safe_search)
            else:
                return [{'error': f'Unsupported search engine: {engine}'}]

        except Exception as e:
            logger.error(f"Error searching {engine}: {str(e)}")
            return [{'error': str(e)}]

    async def _search_google(self, query: str, max_results: int, safe_search: bool) -> List[Dict[str, str]]:
        """Search using Google Custom Search API."""
        try:
            import os

            # Use environment variables for API keys
            search_api_key = os.getenv('GOOGLE_SEARCH_API_KEY')
            search_engine_id = os.getenv('GOOGLE_SEARCH_ENGINE_ID')

            if search_api_key and search_engine_id:
                # Use official Google Custom Search API
                search_url = "https://www.googleapis.com/customsearch/v1"
                params = {
                    'key': search_api_key,
                    'cx': search_engine_id,
                    'q': query,
                    'num': min(max_results, 10),
                    'safe': 'active' if safe_search else 'off'
                }

                async with self.session.get(search_url, params=params) as response:
                    if response.status == 200:
                        data = await response.json()
                        results = []
                        for item in data.get('items', []):
                            results.append({
                                'title': item.get('title', ''),
                                'url': item.get('link', ''),
                                'snippet': item.get('snippet', ''),
                                'displayLink': item.get('displayLink', '')
                            })
                        return results

            # Fallback to scraping if API keys not available
            search_url = f"https://www.google.com/search?q={query}&num={max_results}"
            if safe_search:
                search_url += "&safe=active"

            async with self.session.get(search_url) as response:
                html = await response.text()

            soup = BeautifulSoup(html, 'html.parser')
            results = []

            for result in soup.select('div.g')[:max_results]:
                title_elem = result.select_one('h3')
                link_elem = result.select_one('a')
                snippet_elem = result.select_one('span.st')

                if title_elem and link_elem:
                    results.append({
                        'title': title_elem.get_text(),
                        'url': link_elem['href'],
                        'snippet': snippet_elem.get_text() if snippet_elem else ''
                    })

            return results

        except Exception as e:
            return [{'error': f'Google search failed: {str(e)}'}]

    async def _search_bing(self, query: str, max_results: int, safe_search: bool) -> List[Dict[str, str]]:
        """Search using Bing."""
        search_url = f"https://www.bing.com/search?q={query}&count={max_results}"
        if safe_search:
            search_url += "&adlt=strict"

        try:
            async with self.session.get(search_url) as response:
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
                        'url': link_elem['href'],
                        'snippet': snippet_elem.get_text() if snippet_elem else ''
                    })

            return results

        except Exception as e:
            return [{'error': f'Bing search failed: {str(e)}'}]

    async def _search_duckduckgo(self, query: str, max_results: int, safe_search: bool) -> List[Dict[str, str]]:
        """Search using DuckDuckGo."""
        search_url = f"https://duckduckgo.com/html?q={query}"

        try:
            async with self.session.get(search_url) as response:
                html = await response.text()

            soup = BeautifulSoup(html, 'html.parser')
            results = []

            for result in soup.select('div.result')[:max_results]:
                title_elem = result.select_one('h2 a')
                link_elem = result.select_one('h2 a')
                snippet_elem = result.select_one('a.result__snippet')

                if title_elem and link_elem:
                    results.append({
                        'title': title_elem.get_text(),
                        'url': link_elem['href'],
                        'snippet': snippet_elem.get_text() if snippet_elem else ''
                    })

            return results

        except Exception as e:
            return [{'error': f'DuckDuckGo search failed: {str(e)}'}]

    async def _search_brave(self, query: str, max_results: int, safe_search: bool) -> List[Dict[str, str]]:
        """Search using Brave Search."""
        search_url = f"https://search.brave.com/search?q={query}&count={max_results}"

        try:
            async with self.session.get(search_url) as response:
                html = await response.text()

            soup = BeautifulSoup(html, 'html.parser')
            results = []

            for result in soup.select('div.snippet')[:max_results]:
                title_elem = result.select_one('h3 a')
                link_elem = result.select_one('h3 a')
                snippet_elem = result.select_one('p')

                if title_elem and link_elem:
                    results.append({
                        'title': title_elem.get_text(),
                        'url': link_elem['href'],
                        'snippet': snippet_elem.get_text() if snippet_elem else ''
                    })

            return results

        except Exception as e:
            return [{'error': f'Brave search failed: {str(e)}'}]

    async def analyze_content(self, url: str, analysis_type: str = 'seo') -> Dict[str, Any]:
        """Analyze web content for various metrics."""
        try:
            async with self.session.get(url) as response:
                html = await response.text()

            soup = BeautifulSoup(html, 'html.parser')
            text_content = soup.get_text()

            result = {
                'url': url,
                'analysis_type': analysis_type,
                'metrics': {}
            }

            if analysis_type == 'seo':
                result['metrics'] = self._analyze_seo(soup, html)
            elif analysis_type == 'readability':
                result['metrics'] = self._analyze_readability(text_content)
            elif analysis_type == 'structure':
                result['metrics'] = self._analyze_structure(soup)
            elif analysis_type == 'accessibility':
                result['metrics'] = self._analyze_accessibility(soup)
            elif analysis_type == 'performance':
                result['metrics'] = await self._analyze_performance(url)

            return result

        except Exception as e:
            logger.error(f"Error analyzing {url}: {str(e)}")
            return {'error': str(e), 'url': url}

    def _analyze_seo(self, soup: BeautifulSoup, html: str) -> Dict[str, Any]:
        """Analyze SEO metrics."""
        return {
            'title_length': len(soup.title.string) if soup.title else 0,
            'meta_description': len(soup.find('meta', {'name': 'description'})['content']) if soup.find('meta', {'name': 'description'}) else 0,
            'h1_count': len(soup.find_all('h1')),
            'h2_count': len(soup.find_all('h2')),
            'image_count': len(soup.find_all('img')),
            'images_with_alt': len([img for img in soup.find_all('img') if img.get('alt')]),
            'internal_links': len([a for a in soup.find_all('a') if a.get('href') and not a['href'].startswith('http')]),
            'external_links': len([a for a in soup.find_all('a') if a.get('href') and a['href'].startswith('http')]),
            'word_count': len(html.split()),
            'load_time_estimate': 'N/A'  # Would need actual timing
        }

    def _analyze_readability(self, text: str) -> Dict[str, Any]:
        """Analyze text readability."""
        sentences = re.split(r'[.!?]+', text)
        words = text.split()
        syllables = sum(self._count_syllables(word) for word in words)

        avg_sentence_length = len(words) / len(sentences) if sentences else 0
        avg_syllables_per_word = syllables / len(words) if words else 0

        # Flesch Reading Ease Score
        flesch_score = 206.835 - (1.015 * avg_sentence_length) - (84.6 * avg_syllables_per_word)

        return {
            'flesch_reading_ease': round(flesch_score, 2),
            'average_sentence_length': round(avg_sentence_length, 2),
            'average_syllables_per_word': round(avg_syllables_per_word, 2),
            'total_words': len(words),
            'total_sentences': len(sentences),
            'readability_level': self._get_readability_level(flesch_score)
        }

    def _count_syllables(self, word: str) -> int:
        """Count syllables in a word."""
        word = word.lower()
        count = 0
        vowels = "aeiouy"
        if word[0] in vowels:
            count += 1
        for i in range(1, len(word)):
            if word[i] in vowels and word[i - 1] not in vowels:
                count += 1
        if word.endswith("e"):
            count -= 1
        if count == 0:
            count += 1
        return count

    def _get_readability_level(self, score: float) -> str:
        """Get readability level from Flesch score."""
        if score >= 90:
            return "Very Easy (5th grade)"
        elif score >= 80:
            return "Easy (6th grade)"
        elif score >= 70:
            return "Fairly Easy (7th grade)"
        elif score >= 60:
            return "Standard (8th-9th grade)"
        elif score >= 50:
            return "Fairly Difficult (10th-12th grade)"
        elif score >= 30:
            return "Difficult (College)"
        else:
            return "Very Difficult (College Graduate)"

    def _analyze_structure(self, soup: BeautifulSoup) -> Dict[str, Any]:
        """Analyze page structure."""
        return {
            'heading_hierarchy': {
                'h1': len(soup.find_all('h1')),
                'h2': len(soup.find_all('h2')),
                'h3': len(soup.find_all('h3')),
                'h4': len(soup.find_all('h4')),
                'h5': len(soup.find_all('h5')),
                'h6': len(soup.find_all('h6'))
            },
            'semantic_elements': {
                'header': len(soup.find_all('header')),
                'nav': len(soup.find_all('nav')),
                'main': len(soup.find_all('main')),
                'article': len(soup.find_all('article')),
                'section': len(soup.find_all('section')),
                'aside': len(soup.find_all('aside')),
                'footer': len(soup.find_all('footer'))
            },
            'list_elements': {
                'ul': len(soup.find_all('ul')),
                'ol': len(soup.find_all('ol')),
                'dl': len(soup.find_all('dl'))
            },
            'table_count': len(soup.find_all('table')),
            'form_count': len(soup.find_all('form'))
        }

    def _analyze_accessibility(self, soup: BeautifulSoup) -> Dict[str, Any]:
        """Analyze accessibility features."""
        images = soup.find_all('img')
        links = soup.find_all('a')

        return {
            'images_without_alt': len([img for img in images if not img.get('alt')]),
            'images_with_alt': len([img for img in images if img.get('alt')]),
            'links_without_text': len([a for a in links if not a.get_text().strip()]),
            'missing_lang_attribute': 1 if not soup.find(['html', 'body'], {'lang': True}) else 0,
            'form_elements': len(soup.find_all(['input', 'select', 'textarea'])),
            'form_labels': len(soup.find_all('label')),
            'aria_attributes': len([elem for elem in soup.find_all(attrs={'aria-*': True})])
        }

    async def _analyze_performance(self, url: str) -> Dict[str, Any]:
        """Analyze page performance (simplified version)."""
        try:
            start_time = asyncio.get_event_loop().time()
            async with self.session.get(url) as response:
                content = await response.text()
            end_time = asyncio.get_event_loop().time()

            return {
                'response_time': round(end_time - start_time, 3),
                'content_size': len(content),
                'status_code': response.status,
                'headers_count': len(dict(response.headers))
            }
        except Exception as e:
            return {'error': str(e)}

# MCP Server Implementation
app = FastMCP("web-scraper-server")
fastapi_app = FastAPI(title="Web Scraper MCP Server")

scraping_tool = WebScrapingTool()

@app.tool()
async def web_scrape(url: str, selectors: Dict[str, str] = None, headers: Dict[str, str] = None,
                    use_selenium: bool = False, wait_for: str = None) -> Dict[str, Any]:
    """
    Scrape a web page and extract structured data.

    Args:
        url: The URL to scrape
        selectors: CSS selectors for data extraction (optional)
        headers: Custom HTTP headers (optional)
        use_selenium: Whether to use Selenium for JavaScript-heavy sites
        wait_for: CSS selector to wait for before scraping (Selenium only)

    Returns:
        Scraped data with extracted content
    """
    async with WebScrapingTool() as tool:
        if use_selenium:
            return await tool.scrape_with_selenium(url, selectors, wait_for)
        else:
            return await tool.scrape_with_requests(url, selectors, headers)

@app.tool()
async def web_search(query: str, engine: str = "google", max_results: int = 10,
                    safe_search: bool = True) -> List[Dict[str, str]]:
    """
    Search the web using various search engines.

    Args:
        query: Search query
        engine: Search engine to use (google, bing, duckduckgo, brave)
        max_results: Maximum number of results to return
        safe_search: Enable safe search filtering

    Returns:
        List of search results with titles, URLs, and snippets
    """
    async with WebScrapingTool() as tool:
        return await tool.search_web(query, engine, max_results, safe_search)

@app.tool()
async def content_analysis(url: str, analysis_type: str = "seo") -> Dict[str, Any]:
    """
    Analyze web content for various metrics.

    Args:
        url: URL to analyze
        analysis_type: Type of analysis (seo, readability, structure, accessibility, performance)

    Returns:
        Analysis results with relevant metrics
    """
    async with WebScrapingTool() as tool:
        return await tool.analyze_content(url, analysis_type)

# Mount FastMCP app to FastAPI for WebSocket support
fastapi_app.mount("/mcp", app)

@fastapi_app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        # Handle MCP protocol over WebSocket
        await app.run_websocket(websocket)
    except WebSocketDisconnect:
        pass

@fastapi_app.on_event("startup")
async def startup_event():
    """Initialize the web scraping tool on startup."""
    global scraping_tool
    scraping_tool = WebScrapingTool()
    await scraping_tool.__aenter__()

@fastapi_app.on_event("shutdown")
async def shutdown_event():
    """Clean up resources on shutdown."""
    global scraping_tool
    if scraping_tool:
        await scraping_tool.__aexit__(None, None, None)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(fastapi_app, host="api.digitalhustlelab.com", port=3002)
