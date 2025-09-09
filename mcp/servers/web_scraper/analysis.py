#!/usr/bin/env python3
"""
Content Analysis Module
Provides content analysis and SEO evaluation capabilities.
"""

import asyncio
import json
import logging
import re
from typing import Any, Dict, List, Optional

import aiohttp
from bs4 import BeautifulSoup

logger = logging.getLogger(__name__)


class ContentAnalysisTool:
    """Content analysis and SEO evaluation tools."""

    def __init__(self):
        self.session = None

    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()

    async def analyze_content(self, url: str, analysis_type: str = 'seo') -> Dict[str, Any]:
        """Analyze web content for various metrics."""
        try:
            async with self.session.get(url) as response:
                if response.status != 200:
                    return {'error': f'Failed to fetch {url}: {response.status}', 'url': url}

                html = await response.text()
                soup = BeautifulSoup(html, 'html.parser')

                if analysis_type == 'seo':
                    return self._analyze_seo(soup, html)
                elif analysis_type == 'readability':
                    text = soup.get_text()
                    return self._analyze_readability(text)
                elif analysis_type == 'structure':
                    return self._analyze_structure(soup)
                elif analysis_type == 'accessibility':
                    return self._analyze_accessibility(soup)
                elif analysis_type == 'performance':
                    return await self._analyze_performance(url)
                else:
                    return {'error': f'Unknown analysis type: {analysis_type}'}

        except Exception as e:
            logger.error(f"Error analyzing content from {url}: {e}")
            return {'error': str(e), 'url': url}

    def _analyze_seo(self, soup: BeautifulSoup, html: str) -> Dict[str, Any]:
        """Analyze SEO factors."""
        title = soup.title.string if soup.title else ''
        meta_desc = soup.find('meta', attrs={'name': 'description'})
        meta_desc_content = meta_desc.get('content') if meta_desc else ''

        h1_tags = soup.find_all('h1')
        h2_tags = soup.find_all('h2')
        h3_tags = soup.find_all('h3')

        # Count images without alt text
        images = soup.find_all('img')
        images_without_alt = [img for img in images if not img.get('alt')]

        # Check for structured data
        structured_data = soup.find_all('script', type='application/ld+json')

        return {
            'seo_score': self._calculate_seo_score(soup, html),
            'title': title,
            'title_length': len(title),
            'meta_description': meta_desc_content,
            'meta_description_length': len(meta_desc_content),
            'h1_count': len(h1_tags),
            'h2_count': len(h2_tags),
            'h3_count': len(h3_tags),
            'images_total': len(images),
            'images_without_alt': len(images_without_alt),
            'structured_data_count': len(structured_data),
            'word_count': len(html.split()),
            'internal_links': len([link for link in soup.find_all('a') if link.get('href') and not link.get('href').startswith('http')]),
            'external_links': len([link for link in soup.find_all('a') if link.get('href') and link.get('href').startswith('http')])
        }

    def _calculate_seo_score(self, soup: BeautifulSoup, html: str) -> int:
        """Calculate SEO score out of 100."""
        score = 0

        # Title tag (20 points)
        if soup.title and 30 <= len(soup.title.string) <= 60:
            score += 20
        elif soup.title:
            score += 10

        # Meta description (15 points)
        meta_desc = soup.find('meta', attrs={'name': 'description'})
        if meta_desc and meta_desc.get('content') and 120 <= len(meta_desc.get('content')) <= 160:
            score += 15
        elif meta_desc and meta_desc.get('content'):
            score += 7

        # H1 tag (10 points)
        if len(soup.find_all('h1')) == 1:
            score += 10
        elif len(soup.find_all('h1')) > 1:
            score += 5

        # Images with alt text (10 points)
        images = soup.find_all('img')
        if images:
            alt_ratio = len([img for img in images if img.get('alt')]) / len(images)
            score += int(alt_ratio * 10)

        # Internal linking (10 points)
        internal_links = len([link for link in soup.find_all('a') if link.get('href') and not link.get('href').startswith('http')])
        if internal_links > 5:
            score += 10
        elif internal_links > 0:
            score += 5

        # Word count (10 points)
        word_count = len(html.split())
        if word_count > 300:
            score += 10
        elif word_count > 150:
            score += 5

        # HTTPS (5 points)
        if 'https://' in html:
            score += 5

        # Mobile friendly (5 points)
        viewport = soup.find('meta', attrs={'name': 'viewport'})
        if viewport:
            score += 5

        # Structured data (5 points)
        structured_data = soup.find_all('script', type='application/ld+json')
        if structured_data:
            score += 5

        return min(score, 100)

    def _analyze_readability(self, text: str) -> Dict[str, Any]:
        """Analyze text readability."""
        sentences = re.split(r'[.!?]+', text)
        words = text.split()
        syllables = sum(self._count_syllables(word) for word in words)

        if not sentences or not words:
            return {'error': 'No readable text found'}

        avg_words_per_sentence = len(words) / len(sentences)
        avg_syllables_per_word = syllables / len(words)

        # Flesch Reading Ease Score
        flesch_score = 206.835 - (1.015 * avg_words_per_sentence) - (84.6 * avg_syllables_per_word)

        # Flesch-Kincaid Grade Level
        grade_level = (0.39 * avg_words_per_sentence) + (11.8 * avg_syllables_per_word) - 15.59

        return {
            'flesch_reading_ease': round(flesch_score, 2),
            'flesch_kincaid_grade': round(grade_level, 2),
            'readability_level': self._get_readability_level(flesch_score),
            'word_count': len(words),
            'sentence_count': len(sentences),
            'avg_words_per_sentence': round(avg_words_per_sentence, 2),
            'avg_syllables_per_word': round(avg_syllables_per_word, 2)
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
        """Get readability level description."""
        if score >= 90:
            return "Very Easy"
        elif score >= 80:
            return "Easy"
        elif score >= 70:
            return "Fairly Easy"
        elif score >= 60:
            return "Standard"
        elif score >= 50:
            return "Fairly Difficult"
        elif score >= 30:
            return "Difficult"
        else:
            return "Very Difficult"

    def _analyze_structure(self, soup: BeautifulSoup) -> Dict[str, Any]:
        """Analyze page structure."""
        headings = {}
        for i in range(1, 7):
            headings[f'h{i}'] = len(soup.find_all(f'h{i}'))

        return {
            'headings': headings,
            'paragraphs': len(soup.find_all('p')),
            'lists': len(soup.find_all(['ul', 'ol'])),
            'tables': len(soup.find_all('table')),
            'forms': len(soup.find_all('form')),
            'divs': len(soup.find_all('div')),
            'spans': len(soup.find_all('span')),
            'links': len(soup.find_all('a')),
            'images': len(soup.find_all('img')),
            'scripts': len(soup.find_all('script')),
            'stylesheets': len(soup.find_all('link', rel='stylesheet'))
        }

    def _analyze_accessibility(self, soup: BeautifulSoup) -> Dict[str, Any]:
        """Analyze accessibility features."""
        images = soup.find_all('img')
        images_without_alt = [img for img in images if not img.get('alt')]

        links = soup.find_all('a')
        links_without_text = [link for link in links if not link.get_text().strip()]

        forms = soup.find_all('form')
        forms_without_labels = []

        for form in forms:
            inputs = form.find_all('input')
            for input_elem in inputs:
                if input_elem.get('type') not in ['submit', 'button', 'hidden']:
                    label = form.find('label', attrs={'for': input_elem.get('id')})
                    if not label:
                        forms_without_labels.append(input_elem)

        return {
            'images_total': len(images),
            'images_without_alt': len(images_without_alt),
            'links_total': len(links),
            'links_without_text': len(links_without_text),
            'forms_total': len(forms),
            'inputs_without_labels': len(forms_without_labels),
            'has_lang_attribute': bool(soup.find(attrs={'lang': True})),
            'has_title': bool(soup.title and soup.title.string),
            'has_viewport_meta': bool(soup.find('meta', attrs={'name': 'viewport'}))
        }

    async def _analyze_performance(self, url: str) -> Dict[str, Any]:
        """Analyze page performance metrics."""
        try:
            start_time = asyncio.get_event_loop().time()

            async with self.session.get(url) as response:
                content = await response.text()
                load_time = asyncio.get_event_loop().time() - start_time

                return {
                    'response_time': round(load_time, 3),
                    'status_code': response.status,
                    'content_length': len(content),
                    'content_type': response.headers.get('content-type', ''),
                    'server': response.headers.get('server', ''),
                    'compression': 'gzip' in response.headers.get('content-encoding', ''),
                    'cache_control': response.headers.get('cache-control', '')
                }

        except Exception as e:
            return {'error': f'Performance analysis failed: {str(e)}'}
