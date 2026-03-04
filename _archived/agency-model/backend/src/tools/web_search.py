"""Exa web search integration."""

from typing import Any

import httpx

from src.config import get_settings
from src.utils import get_logger

settings = get_settings()
logger = get_logger(__name__)


class ExaSearchTool:
    """Web search using Exa API."""

    BASE_URL = "https://api.exa.ai"

    def __init__(self) -> None:
        self.api_key = settings.exa_api_key

    async def search(
        self,
        query: str,
        num_results: int = 10,
        use_autoprompt: bool = True,
    ) -> list[dict[str, Any]]:
        """Search the web using Exa.

        Args:
            query: Search query
            num_results: Number of results to return
            use_autoprompt: Whether to use Exa's autoprompt feature

        Returns:
            List of search results
        """
        if not self.api_key:
            logger.warning("Exa API key not configured")
            return []

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.BASE_URL}/search",
                    headers={"x-api-key": self.api_key},
                    json={
                        "query": query,
                        "numResults": num_results,
                        "useAutoprompt": use_autoprompt,
                    },
                )
                response.raise_for_status()
                data = response.json()
                return data.get("results", [])

        except Exception as e:
            logger.error("Exa search failed", error=str(e))
            return []

    async def get_contents(
        self,
        urls: list[str],
        text: bool = True,
    ) -> list[dict[str, Any]]:
        """Get contents of URLs.

        Args:
            urls: List of URLs to fetch
            text: Whether to extract text content

        Returns:
            List of URL contents
        """
        if not self.api_key:
            logger.warning("Exa API key not configured")
            return []

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.BASE_URL}/contents",
                    headers={"x-api-key": self.api_key},
                    json={
                        "urls": urls,
                        "text": text,
                    },
                )
                response.raise_for_status()
                data = response.json()
                return data.get("results", [])

        except Exception as e:
            logger.error("Exa get contents failed", error=str(e))
            return []

    async def find_similar(
        self,
        url: str,
        num_results: int = 10,
    ) -> list[dict[str, Any]]:
        """Find similar pages to a URL.

        Args:
            url: URL to find similar pages for
            num_results: Number of results to return

        Returns:
            List of similar pages
        """
        if not self.api_key:
            logger.warning("Exa API key not configured")
            return []

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.BASE_URL}/findSimilar",
                    headers={"x-api-key": self.api_key},
                    json={
                        "url": url,
                        "numResults": num_results,
                    },
                )
                response.raise_for_status()
                data = response.json()
                return data.get("results", [])

        except Exception as e:
            logger.error("Exa find similar failed", error=str(e))
            return []
