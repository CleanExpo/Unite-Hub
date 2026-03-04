"""Document parsers for different file types."""

import hashlib
from abc import ABC, abstractmethod
from typing import Any


class DocumentParser(ABC):
    """Abstract base for document parsers."""

    @abstractmethod
    async def parse(self, content: bytes, metadata: dict[str, Any]) -> dict[str, Any]:
        """
        Parse document content.

        Returns:
            {
                "text": str,
                "metadata": dict,
                "structure": list  # Headings, sections, etc.
            }
        """
        pass

    def calculate_hash(self, content: bytes) -> str:
        """Calculate SHA256 hash of content."""
        return hashlib.sha256(content).hexdigest()


class PlainTextParser(DocumentParser):
    """Parser for plain text files."""

    async def parse(self, content: bytes, metadata: dict[str, Any]) -> dict[str, Any]:
        text = content.decode("utf-8")
        return {"text": text, "metadata": metadata, "structure": []}


class MarkdownParser(DocumentParser):
    """Parser for Markdown files."""

    async def parse(self, content: bytes, metadata: dict[str, Any]) -> dict[str, Any]:
        text = content.decode("utf-8")

        # Extract headings using regex
        import re

        structure = []
        for match in re.finditer(r"^(#{1,6})\s+(.+)$", text, re.MULTILINE):
            level = len(match.group(1))
            heading_text = match.group(2)
            structure.append(
                {"level": level, "text": heading_text, "position": match.start()}
            )

        return {"text": text, "metadata": metadata, "structure": structure}


def get_parser(mime_type: str) -> DocumentParser:
    """Get parser for MIME type."""
    parsers = {
        "text/plain": PlainTextParser,
        "text/markdown": MarkdownParser,
    }

    parser_class = parsers.get(mime_type, PlainTextParser)
    return parser_class()
