from bs4 import BeautifulSoup
import asyncio
import logging
import re

logger = logging.getLogger(__name__)

class AnalysisMixin:
    """analyze_content + _analyze_seo/_analyze_readability/..."""

    async def analyze_content(self, url: str, analysis_type='seo'):
        """...existing analyze_content logic..."""

    # ...existing _analyze_seo, _analyze_readability, _count_syllables, etc. ...
