"""Ref.tools documentation search integration."""

from typing import Any

import httpx

from src.config import get_settings
from src.utils import get_logger

settings = get_settings()
logger = get_logger(__name__)


class RefToolsTool:
    """Documentation search using Ref.tools.

    This interfaces with the Ref.tools MCP server for documentation lookup.
    """

    def __init__(self) -> None:
        self.api_key = settings.ref_tools_api_key

    async def search_docs(
        self,
        query: str,
        library: str | None = None,
    ) -> list[dict[str, Any]]:
        """Search documentation.

        Args:
            query: Search query
            library: Optional library/framework to search within

        Returns:
            List of documentation results
        """
        logger.info("Searching documentation", query=query, library=library)

        # This would interface with the Ref.tools MCP server
        # For now, return placeholder
        return [
            {
                "title": f"Documentation for: {query}",
                "url": f"https://docs.example.com/{query}",
                "snippet": "Documentation snippet...",
            }
        ]

    async def get_doc_page(self, url: str) -> dict[str, Any]:
        """Get content of a documentation page.

        Args:
            url: URL of the documentation page

        Returns:
            Page content
        """
        logger.info("Fetching documentation page", url=url)

        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(url)
                response.raise_for_status()

                return {
                    "url": url,
                    "content": response.text,
                    "status": response.status_code,
                }

        except Exception as e:
            logger.error("Failed to fetch documentation", error=str(e))
            return {
                "url": url,
                "content": "",
                "error": str(e),
            }

    async def get_api_reference(
        self,
        library: str,
        symbol: str,
    ) -> dict[str, Any] | None:
        """Get API reference for a specific symbol.

        Args:
            library: Library/package name
            symbol: Symbol name (function, class, etc.)

        Returns:
            API reference information
        """
        logger.info("Getting API reference", library=library, symbol=symbol)

        # This would interface with the Ref.tools API
        return {
            "library": library,
            "symbol": symbol,
            "signature": f"{symbol}(...)",
            "description": f"API reference for {library}.{symbol}",
            "parameters": [],
            "returns": None,
            "examples": [],
        }
