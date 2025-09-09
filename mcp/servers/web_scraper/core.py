#!/usr/bin/env python3
"""
Web Scraping Core Module
Core web scraping functionality with multiple extraction methods.
"""

import asyncio
import json
import logging
from typing import Any, Dict, List, Optional, Union
from urllib.parse import urlparse, urljoin

import aiohttp
import requests
from bs4 import BeautifulSoup
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

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
        """Scrape webpage using requests library."""
        try:
            request_headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
            if headers:
                request_headers.update(headers)

            response = requests.get(url, headers=request_headers, timeout=30)
            response.raise_for_status()

            soup = BeautifulSoup(response.content, 'html.parser')

            result = {
                'url': url,
                'status_code': response.status_code,
                'title': soup.title.string if soup.title else '',
                'text': soup.get_text(),
                'links': [link.get('href') for link in soup.find_all('a') if link.get('href')],
                'images': [img.get('src') for img in soup.find_all('img') if img.get('src')]
            }

            # Extract custom selectors
            if selectors:
                result['selectors'] = {}
                for name, selector in selectors.items():
                    elements = soup.select(selector)
                    result['selectors'][name] = [elem.get_text() for elem in elements]

            return result

        except Exception as e:
            logger.error(f"Error scraping {url} with requests: {e}")
            return {'error': str(e), 'url': url}

    async def scrape_with_selenium(self, url: str, selectors: Dict[str, str] = None,
                                  wait_for: str = None) -> Dict[str, Any]:
        """Scrape webpage using Selenium for JavaScript-heavy sites."""
        try:
            self._init_selenium_driver()

            self.driver.get(url)

            # Wait for specific element if specified
            if wait_for:
                WebDriverWait(self.driver, 10).until(
                    EC.presence_of_element_located((By.CSS_SELECTOR, wait_for))
                )

            # Wait a bit for JavaScript to load
            await asyncio.sleep(2)

            soup = BeautifulSoup(self.driver.page_source, 'html.parser')

            result = {
                'url': url,
                'title': self.driver.title,
                'text': soup.get_text(),
                'links': [link.get('href') for link in soup.find_all('a') if link.get('href')],
                'images': [img.get('src') for img in soup.find_all('img') if img.get('src')]
            }

            # Extract custom selectors
            if selectors:
                result['selectors'] = {}
                for name, selector in selectors.items():
                    elements = soup.select(selector)
                    result['selectors'][name] = [elem.get_text() for elem in elements]

            return result

        except Exception as e:
            logger.error(f"Error scraping {url} with Selenium: {e}")
            return {'error': str(e), 'url': url}
