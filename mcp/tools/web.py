#!/usr/bin/env python3
"""
MCP Web Tools
=============

Web-related tools for MCP servers.
Provides web scraping, API interaction, and web utilities.
"""

import re
import json
import requests
from typing import Dict, List, Optional, Any, Union
from urllib.parse import urlparse, urljoin
from bs4 import BeautifulSoup

from ..core import MCPValidationError


class MCPWebTools:
    """Basic web tools for MCP servers."""

    @staticmethod
    def fetch_url(url: str, headers: Optional[Dict[str, str]] = None,
                 timeout: int = 10) -> Dict[str, Any]:
        """Fetch content from a URL."""
        try:
            response = requests.get(url, headers=headers, timeout=timeout)

            return {
                "url": response.url,
                "status_code": response.status_code,
                "headers": dict(response.headers),
                "content": response.text,
                "content_type": response.headers.get("content-type", ""),
                "encoding": response.encoding,
                "elapsed": response.elapsed.total_seconds()
            }
        except Exception as e:
            raise MCPValidationError(f"Failed to fetch URL: {str(e)}")

    @staticmethod
    def parse_html(html_content: str, parser: str = "html.parser") -> Dict[str, Any]:
        """Parse HTML content and extract basic information."""
        try:
            soup = BeautifulSoup(html_content, parser)

            # Extract basic metadata
            title = soup.title.string if soup.title else None
            meta_description = soup.find("meta", attrs={"name": "description"})
            description = meta_description["content"] if meta_description else None

            # Extract links
            links = []
            for link in soup.find_all("a", href=True):
                links.append({
                    "text": link.get_text().strip(),
                    "href": link["href"],
                    "absolute_url": urljoin("http://example.com", link["href"])
                })

            # Extract headings
            headings = []
            for i in range(1, 7):
                for h in soup.find_all(f"h{i}"):
                    headings.append({
                        "level": i,
                        "text": h.get_text().strip(),
                        "id": h.get("id")
                    })

            return {
                "title": title,
                "description": description,
                "links": links,
                "headings": headings,
                "text_content": soup.get_text(),
                "word_count": len(soup.get_text().split())
            }
        except Exception as e:
            raise MCPValidationError(f"Failed to parse HTML: {str(e)}")

    @staticmethod
    def extract_urls(text: str) -> List[str]:
        """Extract URLs from text using regex."""
        try:
            url_pattern = r'https?://(?:[-\w.])+(?:[:\d]+)?(?:/(?:[\w/_.])*(?:\?(?:[\w&=%.])*)?(?:#(?:\w*))*)?'
            urls = re.findall(url_pattern, text)
            return list(set(urls))  # Remove duplicates
        except Exception as e:
            raise MCPValidationError(f"Failed to extract URLs: {str(e)}")

    @staticmethod
    def validate_url(url: str) -> Dict[str, Any]:
        """Validate and parse a URL."""
        try:
            parsed = urlparse(url)

            return {
                "url": url,
                "is_valid": bool(parsed.scheme and parsed.netloc),
                "scheme": parsed.scheme,
                "netloc": parsed.netloc,
                "hostname": parsed.hostname,
                "port": parsed.port,
                "path": parsed.path,
                "query": parsed.query,
                "fragment": parsed.fragment
            }
        except Exception as e:
            raise MCPValidationError(f"Failed to validate URL: {str(e)}")


class MCPScrapingTools:
    """Web scraping tools for MCP servers."""

    @staticmethod
    def scrape_website(url: str, selectors: Optional[Dict[str, str]] = None,
                      headers: Optional[Dict[str, str]] = None) -> Dict[str, Any]:
        """Scrape specific content from a website using CSS selectors."""
        try:
            response = requests.get(url, headers=headers, timeout=10)
            response.raise_for_status()

            soup = BeautifulSoup(response.text, "html.parser")
            results = {}

            if selectors:
                for name, selector in selectors.items():
                    elements = soup.select(selector)
                    results[name] = [
                        {
                            "text": elem.get_text().strip(),
                            "html": str(elem),
                            "attributes": dict(elem.attrs)
                        }
                        for elem in elements
                    ]
            else:
                # Default scraping
                results = {
                    "title": soup.title.string if soup.title else None,
                    "headings": [h.get_text().strip() for h in soup.find_all(["h1", "h2", "h3"])],
                    "paragraphs": [p.get_text().strip() for p in soup.find_all("p")],
                    "links": [{"text": a.get_text().strip(), "href": a.get("href")} for a in soup.find_all("a", href=True)]
                }

            return {
                "url": url,
                "status_code": response.status_code,
                "results": results,
                "timestamp": response.headers.get("date")
            }
        except Exception as e:
            raise MCPValidationError(f"Failed to scrape website: {str(e)}")

    @staticmethod
    def extract_structured_data(html_content: str) -> Dict[str, Any]:
        """Extract structured data from HTML (JSON-LD, microdata, etc.)."""
        try:
            soup = BeautifulSoup(html_content, "html.parser")
            structured_data = {}

            # Extract JSON-LD
            json_ld_scripts = soup.find_all("script", type="application/ld+json")
            structured_data["json_ld"] = []
            for script in json_ld_scripts:
                try:
                    data = json.loads(script.string)
                    structured_data["json_ld"].append(data)
                except json.JSONDecodeError:
                    continue

            # Extract Open Graph data
            og_data = {}
            for meta in soup.find_all("meta", property=re.compile(r"^og:")):
                og_data[meta["property"][3:]] = meta.get("content", "")

            if og_data:
                structured_data["open_graph"] = og_data

            # Extract Twitter Card data
            twitter_data = {}
            for meta in soup.find_all("meta", attrs={"name": re.compile(r"^twitter:")}):
                twitter_data[meta["name"][8:]] = meta.get("content", "")

            if twitter_data:
                structured_data["twitter_card"] = twitter_data

            return structured_data
        except Exception as e:
            raise MCPValidationError(f"Failed to extract structured data: {str(e)}")

    @staticmethod
    def get_page_metadata(url: str, headers: Optional[Dict[str, str]] = None) -> Dict[str, Any]:
        """Get comprehensive metadata about a web page."""
        try:
            response = requests.head(url, headers=headers, timeout=10)
            response.raise_for_status()

            # Get full content for metadata extraction
            full_response = requests.get(url, headers=headers, timeout=10)
            soup = BeautifulSoup(full_response.text, "html.parser")

            metadata = {
                "url": url,
                "status_code": response.status_code,
                "content_type": response.headers.get("content-type", ""),
                "content_length": response.headers.get("content-length"),
                "last_modified": response.headers.get("last-modified"),
                "server": response.headers.get("server"),
                "title": soup.title.string if soup.title else None,
                "charset": soup.meta.get("charset") if soup.meta else None
            }

            # Extract meta tags
            meta_tags = {}
            for meta in soup.find_all("meta"):
                name = meta.get("name") or meta.get("property")
                if name:
                    meta_tags[name] = meta.get("content", "")

            if meta_tags:
                metadata["meta_tags"] = meta_tags

            return metadata
        except Exception as e:
            raise MCPValidationError(f"Failed to get page metadata: {str(e)}")


class MCPAPITools:
    """API interaction tools for MCP servers."""

    @staticmethod
    def make_api_request(url: str, method: str = "GET",
                        headers: Optional[Dict[str, str]] = None,
                        data: Optional[Dict[str, Any]] = None,
                        params: Optional[Dict[str, str]] = None,
                        auth: Optional[tuple] = None,
                        timeout: int = 30) -> Dict[str, Any]:
        """Make a generic API request."""
        try:
            method = method.upper()

            if method == "GET":
                response = requests.get(url, headers=headers, params=params,
                                      auth=auth, timeout=timeout)
            elif method == "POST":
                response = requests.post(url, headers=headers, json=data,
                                       params=params, auth=auth, timeout=timeout)
            elif method == "PUT":
                response = requests.put(url, headers=headers, json=data,
                                      params=params, auth=auth, timeout=timeout)
            elif method == "DELETE":
                response = requests.delete(url, headers=headers, params=params,
                                         auth=auth, timeout=timeout)
            elif method == "PATCH":
                response = requests.patch(url, headers=headers, json=data,
                                        params=params, auth=auth, timeout=timeout)
            else:
                raise MCPValidationError(f"Unsupported HTTP method: {method}")

            # Try to parse JSON response
            try:
                json_data = response.json()
            except ValueError:
                json_data = None

            return {
                "url": response.url,
                "method": method,
                "status_code": response.status_code,
                "headers": dict(response.headers),
                "json": json_data,
                "text": response.text if not json_data else None,
                "elapsed": response.elapsed.total_seconds(),
                "success": response.status_code < 400
            }
        except Exception as e:
            raise MCPValidationError(f"API request failed: {str(e)}")

    @staticmethod
    def rest_api_discovery(url: str, headers: Optional[Dict[str, str]] = None) -> Dict[str, Any]:
        """Discover REST API endpoints and capabilities."""
        try:
            response = requests.options(url, headers=headers, timeout=10)

            return {
                "url": url,
                "allowed_methods": response.headers.get("allow", "").split(", "),
                "content_type": response.headers.get("content-type"),
                "api_version": response.headers.get("api-version"),
                "status_code": response.status_code
            }
        except Exception as e:
            raise MCPValidationError(f"API discovery failed: {str(e)}")

    @staticmethod
    def graphql_query(endpoint: str, query: str,
                     variables: Optional[Dict[str, Any]] = None,
                     headers: Optional[Dict[str, str]] = None) -> Dict[str, Any]:
        """Execute a GraphQL query."""
        try:
            payload = {"query": query}
            if variables:
                payload["variables"] = variables

            response = requests.post(
                endpoint,
                json=payload,
                headers=headers,
                timeout=30
            )

            return {
                "endpoint": endpoint,
                "status_code": response.status_code,
                "data": response.json() if response.status_code == 200 else None,
                "errors": response.json().get("errors") if response.status_code != 200 else None,
                "success": response.status_code == 200
            }
        except Exception as e:
            raise MCPValidationError(f"GraphQL query failed: {str(e)}")
