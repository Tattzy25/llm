import aiohttp

class BaseScrapingTool:
    """Session & driver lifecycle."""

    def __init__(self):
        self.session = None
        self.driver = None

    async def __aenter__(self):
        self.session = aiohttp.ClientSession(
            headers={'User-Agent': 'Mozilla/5.0 ...'}
        )
        return self

    async def __aexit__(self, *args):
        if self.session:
            await self.session.close()
        if self.driver:
            self.driver.quit()
