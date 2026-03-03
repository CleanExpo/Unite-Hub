"""Tool Search Tool Implementation.

Provides dynamic tool discovery to reduce context window usage.
Instead of loading all 50+ tool definitions upfront (~55K tokens),
Claude uses the Tool Search Tool to find relevant tools on-demand.

This implementation supports:
- Regex-based search (fast, good for exact matches)
- BM25-based search (better for natural language queries)
- Category-based filtering
- Usage-aware ranking
"""

from __future__ import annotations

import math
import re
from dataclasses import dataclass
from typing import TYPE_CHECKING, Any

if TYPE_CHECKING:
    from .registry import ToolDefinition, ToolRegistry


@dataclass
class SearchResult:
    """Result from a tool search."""

    tool_name: str
    description: str
    score: float
    categories: list[str]
    keywords: list[str]

    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary format."""
        return {
            "name": self.tool_name,
            "description": self.description,
            "score": round(self.score, 3),
            "categories": self.categories,
            "keywords": self.keywords,
        }


class ToolSearcher:
    """Tool Search implementation for dynamic discovery.

    Supports multiple search strategies:
    - regex: Fast pattern matching on tool names/descriptions
    - bm25: TF-IDF based ranking for natural language queries
    - category: Filter by tool category
    - combined: Uses all strategies with weighted scoring

    Usage:
        searcher = ToolSearcher(registry)

        # Find tools for GitHub operations
        results = searcher.search("github pull request")

        # Load found tools into context
        for result in results:
            registry.load_tool(result.tool_name)
    """

    def __init__(
        self,
        registry: ToolRegistry,
        usage_weight: float = 0.1,
    ) -> None:
        """Initialize the searcher.

        Args:
            registry: Tool registry to search
            usage_weight: Weight for usage-based ranking boost (0-1)
        """
        self.registry = registry
        self.usage_weight = usage_weight
        self._bm25_index: dict[str, dict[str, float]] | None = None

    def search(
        self,
        query: str,
        limit: int = 5,
        strategy: str = "combined",
        category: str | None = None,
    ) -> list[SearchResult]:
        """Search for tools matching a query.

        Args:
            query: Search query
            limit: Maximum number of results
            strategy: Search strategy (regex, bm25, category, combined)
            category: Optional category filter

        Returns:
            List of search results sorted by relevance
        """
        if strategy == "regex":
            return self._search_regex(query, limit, category)
        elif strategy == "bm25":
            return self._search_bm25(query, limit, category)
        elif strategy == "category":
            return self._search_category(query, limit)
        else:
            return self._search_combined(query, limit, category)

    def _search_regex(
        self,
        query: str,
        limit: int,
        category: str | None = None,
    ) -> list[SearchResult]:
        """Regex-based search for exact pattern matching."""
        results: list[SearchResult] = []
        pattern = re.compile(re.escape(query), re.IGNORECASE)

        for tool in self.registry._tools.values():
            # Apply category filter
            if category and not any(
                c.value == category for c in tool.categories
            ):
                continue

            score = 0.0

            # Check name
            if pattern.search(tool.name):
                score += 1.0
                if tool.name.lower() == query.lower():
                    score += 0.5  # Exact match bonus

            # Check description
            if pattern.search(tool.description):
                score += 0.5

            # Check keywords
            for keyword in tool.keywords:
                if pattern.search(keyword):
                    score += 0.3

            # Check aliases
            for alias in tool.aliases:
                if pattern.search(alias):
                    score += 0.4

            if score > 0:
                # Apply usage boost
                usage = self.registry._usage_count.get(tool.name, 0)
                score += min(usage * 0.01, 0.3) * self.usage_weight

                results.append(
                    SearchResult(
                        tool_name=tool.name,
                        description=tool.description[:200],
                        score=score,
                        categories=[c.value for c in tool.categories],
                        keywords=tool.keywords[:5],
                    )
                )

        results.sort(key=lambda x: x.score, reverse=True)
        return results[:limit]

    def _search_bm25(
        self,
        query: str,
        limit: int,
        category: str | None = None,
    ) -> list[SearchResult]:
        """BM25-based search for natural language queries."""
        if self._bm25_index is None:
            self._build_bm25_index()

        query_terms = self._tokenize(query)
        if not query_terms:
            return []

        results: list[SearchResult] = []
        tools = list(self.registry._tools.values())
        avg_doc_len = sum(
            len(self._get_tool_text(t)) for t in tools
        ) / max(len(tools), 1)

        for tool in tools:
            # Apply category filter
            if category and not any(
                c.value == category for c in tool.categories
            ):
                continue

            score = self._compute_bm25_score(
                tool, query_terms, len(tools), avg_doc_len
            )

            if score > 0:
                # Apply usage boost
                usage = self.registry._usage_count.get(tool.name, 0)
                score += min(usage * 0.01, 0.3) * self.usage_weight

                results.append(
                    SearchResult(
                        tool_name=tool.name,
                        description=tool.description[:200],
                        score=score,
                        categories=[c.value for c in tool.categories],
                        keywords=tool.keywords[:5],
                    )
                )

        results.sort(key=lambda x: x.score, reverse=True)
        return results[:limit]

    def _search_category(
        self,
        category: str,
        limit: int,
    ) -> list[SearchResult]:
        """Search by category."""
        results: list[SearchResult] = []

        for tool in self.registry._tools.values():
            if any(c.value == category.lower() for c in tool.categories):
                # Use usage count for ranking within category
                usage = self.registry._usage_count.get(tool.name, 0)
                score = 1.0 + min(usage * 0.01, 0.5)

                results.append(
                    SearchResult(
                        tool_name=tool.name,
                        description=tool.description[:200],
                        score=score,
                        categories=[c.value for c in tool.categories],
                        keywords=tool.keywords[:5],
                    )
                )

        results.sort(key=lambda x: x.score, reverse=True)
        return results[:limit]

    def _search_combined(
        self,
        query: str,
        limit: int,
        category: str | None = None,
    ) -> list[SearchResult]:
        """Combined search using all strategies."""
        # Get results from both strategies
        regex_results = self._search_regex(query, limit * 2, category)
        bm25_results = self._search_bm25(query, limit * 2, category)

        # Combine scores
        combined: dict[str, SearchResult] = {}

        for result in regex_results:
            combined[result.tool_name] = result

        for result in bm25_results:
            if result.tool_name in combined:
                # Average the scores
                existing = combined[result.tool_name]
                existing.score = (existing.score + result.score) / 2
            else:
                combined[result.tool_name] = result

        results = list(combined.values())
        results.sort(key=lambda x: x.score, reverse=True)
        return results[:limit]

    def _build_bm25_index(self) -> None:
        """Build BM25 index for all tools."""
        self._bm25_index = {}
        for tool in self.registry._tools.values():
            text = self._get_tool_text(tool)
            terms = self._tokenize(text)
            term_freq: dict[str, float] = {}
            for term in terms:
                term_freq[term] = term_freq.get(term, 0) + 1
            self._bm25_index[tool.name] = term_freq

    def _get_tool_text(self, tool: ToolDefinition) -> str:
        """Get searchable text for a tool."""
        parts = [
            tool.name,
            tool.description,
            " ".join(tool.keywords),
            " ".join(tool.aliases),
            " ".join(c.value for c in tool.categories),
        ]
        return " ".join(parts)

    def _tokenize(self, text: str) -> list[str]:
        """Tokenize text for search."""
        # Simple tokenization - split on non-alphanumeric
        tokens = re.findall(r"\w+", text.lower())
        # Remove very short tokens
        return [t for t in tokens if len(t) > 2]

    def _compute_bm25_score(
        self,
        tool: ToolDefinition,
        query_terms: list[str],
        num_docs: int,
        avg_doc_len: float,
    ) -> float:
        """Compute BM25 score for a tool given query terms."""
        k1 = 1.5
        b = 0.75

        if tool.name not in self._bm25_index:
            return 0.0

        term_freq = self._bm25_index[tool.name]
        doc_len = sum(term_freq.values())

        score = 0.0
        for term in query_terms:
            if term not in term_freq:
                continue

            tf = term_freq[term]

            # Count documents containing term
            df = sum(
                1
                for tf_dict in self._bm25_index.values()
                if term in tf_dict
            )

            # IDF
            idf = math.log((num_docs - df + 0.5) / (df + 0.5) + 1)

            # TF normalization
            tf_norm = (tf * (k1 + 1)) / (
                tf + k1 * (1 - b + b * doc_len / max(avg_doc_len, 1))
            )

            score += idf * tf_norm

        return score

    def get_search_tool_definition(self) -> dict[str, Any]:
        """Get the Tool Search Tool definition for Claude API.

        This is the tool that Claude uses to discover other tools.
        """
        return {
            "type": "tool_search_tool_regex_20251119",
            "name": "tool_search",
        }

    def handle_search_request(
        self,
        query: str,
        limit: int = 5,
    ) -> dict[str, Any]:
        """Handle a tool search request from Claude.

        Args:
            query: Search query from Claude
            limit: Maximum results

        Returns:
            Response with matching tool references
        """
        results = self.search(query, limit)

        return {
            "matched_tools": [r.to_dict() for r in results],
            "total_matches": len(results),
            "query": query,
        }
