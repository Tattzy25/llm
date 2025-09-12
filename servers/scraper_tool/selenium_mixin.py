from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

class SeleniumMixin:
    """Selenium driver init + scrape_with_selenium."""

    def _init_selenium_driver(self):
        if not self.driver:
            opts = Options()
            opts.add_argument('--headless')
            opts.add_argument('--no-sandbox')
            opts.add_argument('--disable-dev-shm-usage')
            opts.add_argument('--disable-gpu')
            opts.add_argument('--window-size=1920,1080')
            self.driver = webdriver.Chrome(options=opts)

    async def scrape_with_selenium(self, url: str, selectors=None, wait_for: str=None):
        """...existing scrape_with_selenium logic..."""
        self._init_selenium_driver()
        # ...existing code for get, wait, extract elements...
        # return the same dict as before
