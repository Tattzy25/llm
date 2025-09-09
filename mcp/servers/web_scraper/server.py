#!/usr/bin/env python3
"""
Web Scraper MCP Server
MCP server implementation for web scraping functionality.
"""

import asyncio
import logging
from typing import Any, Dict

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from mcp.server import FastMCP

from .core import WebScrapingTool
from .search import SearchEngineTool
from .analysis import ContentAnalysisTool

logger = logging.getLogger(__name__)

# MCP Server Implementation
app = FastMCP("web-scraper-server")
fastapi_app = FastAPI(title="Web Scraper MCP Server")

# Initialize tools
scraping_tool = WebScrapingTool()
search_tool = SearchEngineTool()
analysis_tool = ContentAnalysisTool()


@app.tool()
async def web_scrape(url: str, selectors: Dict[str, str] = None, headers: Dict[str, str] = None,
                    use_selenium: bool = False, wait_for: str = None) -> Dict[str, Any]:
    """Scrape content from a webpage."""
    try:
        async with scraping_tool:
            if use_selenium:
                return await scraping_tool.scrape_with_selenium(url, selectors, wait_for)
            else:
                return await scraping_tool.scrape_with_requests(url, selectors, headers)
    except Exception as e:
        logger.error(f"Error in web_scrape: {e}")
        return {"error": str(e), "url": url}


@app.tool()
async def web_search(query: str, engine: str = "google", max_results: int = 10,
                    safe_search: bool = True) -> Dict[str, Any]:
    """Search the web using various search engines."""
    try:
        async with search_tool:
            results = await search_tool.search_web(query, engine, max_results, safe_search)
            return {
                "query": query,
                "engine": engine,
                "results_count": len(results),
                "results": results
            }
    except Exception as e:
        logger.error(f"Error in web_search: {e}")
        return {"error": str(e), "query": query}


@app.tool()
async def content_analysis(url: str, analysis_type: str = "seo") -> Dict[str, Any]:
    """Analyze web content for various metrics."""
    try:
        async with analysis_tool:
            return await analysis_tool.analyze_content(url, analysis_type)
    except Exception as e:
        logger.error(f"Error in content_analysis: {e}")
        return {"error": str(e), "url": url}


# Mount FastMCP app to FastAPI for WebSocket support
fastapi_app.mount("/mcp", app)


@fastapi_app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time communication."""
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_text()
            # Process WebSocket messages if needed
            await websocket.send_text(f"Echo: {data}")
    except WebSocketDisconnect:
        logger.info("WebSocket disconnected")


@fastapi_app.on_event("startup")
async def startup_event():
    """Initialize resources on startup."""
    logger.info("Web Scraper MCP Server starting up")


@fastapi_app.on_event("shutdown")
async def shutdown_event():
    """Clean up resources on shutdown."""
    logger.info("Web Scraper MCP Server shutting down")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(fastapi_app, host="api.digitalhustlelab.com", port=3003)
