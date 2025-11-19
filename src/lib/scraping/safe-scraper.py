"""
Safe Web Scraper - Minimal Footprint Without VPN
Implements best practices to avoid triggering suspicious activity flags
"""

import time
import random
import logging
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
import json
from pathlib import Path

from web_scraper import WebScraper, CompetitorAnalyzer

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class SafeScraper(WebScraper):
    """
    Web scraper optimized for safe, respectful scraping without VPN

    Features:
    - Extended delays between requests (3-10 seconds)
    - Realistic user agent rotation
    - Request caching to minimize duplicate requests
    - Respectful robots.txt compliance
    - Limited requests per session
    """

    def __init__(
        self,
        min_delay: float = 5.0,  # Minimum 5 seconds between requests
        max_delay: float = 10.0,  # Maximum 10 seconds
        max_requests_per_session: int = 50,  # Limit total requests
        timeout: int = 30,
        cache_enabled: bool = True
    ):
        """
        Initialize safe scraper

        Args:
            min_delay: Minimum delay between requests (seconds)
            max_delay: Maximum delay between requests (seconds)
            max_requests_per_session: Maximum requests in one session
            timeout: Request timeout
            cache_enabled: Enable request caching
        """
        # Use random delay between min and max
        delay = random.uniform(min_delay, max_delay)
        super().__init__(delay=delay, timeout=timeout)

        self.min_delay = min_delay
        self.max_delay = max_delay
        self.max_requests = max_requests_per_session
        self.request_count = 0
        self.cache_enabled = cache_enabled
        self.cache_dir = Path(__file__).parent / '.cache'

        # Create cache directory
        if self.cache_enabled:
            self.cache_dir.mkdir(exist_ok=True)

        # More realistic user agents
        self.user_agents = [
            # Chrome on Windows
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            # Firefox on Windows
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
            # Edge on Windows
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
            # Chrome on macOS
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            # Safari on macOS
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
        ]

        logger.info(f"✅ Safe Scraper initialized:")
        logger.info(f"   Delay: {self.min_delay}-{self.max_delay}s between requests")
        logger.info(f"   Max requests: {self.max_requests} per session")
        logger.info(f"   Cache: {'Enabled' if self.cache_enabled else 'Disabled'}")

    def _get_cache_key(self, url: str) -> str:
        """Generate cache key from URL"""
        import hashlib
        return hashlib.md5(url.encode()).hexdigest()

    def _get_cached_response(self, url: str) -> Optional[str]:
        """Get cached response if available and fresh"""
        if not self.cache_enabled:
            return None

        cache_key = self._get_cache_key(url)
        cache_file = self.cache_dir / f"{cache_key}.json"

        if not cache_file.exists():
            return None

        try:
            with open(cache_file, 'r', encoding='utf-8') as f:
                cache_data = json.load(f)

            # Check if cache is still fresh (24 hours)
            cached_time = datetime.fromisoformat(cache_data['timestamp'])
            if datetime.now() - cached_time > timedelta(hours=24):
                logger.info(f"⏰ Cache expired for: {url}")
                return None

            logger.info(f"✅ Using cached response for: {url}")
            return cache_data['html']

        except Exception as e:
            logger.warning(f"Cache read error: {e}")
            return None

    def _save_to_cache(self, url: str, html: str):
        """Save response to cache"""
        if not self.cache_enabled:
            return

        cache_key = self._get_cache_key(url)
        cache_file = self.cache_dir / f"{cache_key}.json"

        try:
            cache_data = {
                'url': url,
                'html': html,
                'timestamp': datetime.now().isoformat()
            }

            with open(cache_file, 'w', encoding='utf-8') as f:
                json.dump(cache_data, f)

            logger.info(f"💾 Cached response for: {url}")

        except Exception as e:
            logger.warning(f"Cache write error: {e}")

    def _get_headers(self, custom_headers: Optional[Dict] = None) -> Dict:
        """Generate realistic request headers"""
        # Rotate user agent for each request
        user_agent = random.choice(self.user_agents)

        headers = {
            'User-Agent': user_agent,
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Sec-Fetch-User': '?1',
            'Cache-Control': 'max-age=0',
        }

        if custom_headers:
            headers.update(custom_headers)

        return headers

    def fetch_page(self, url: str, custom_headers: Optional[Dict] = None) -> Optional[str]:
        """
        Fetch page with safety checks and caching

        Args:
            url: Target URL
            custom_headers: Optional custom headers

        Returns:
            HTML content or None
        """
        # Check request limit
        if self.request_count >= self.max_requests:
            logger.warning(f"⚠️ Request limit reached ({self.max_requests}). Please wait before making more requests.")
            return None

        # Check cache first
        cached_html = self._get_cached_response(url)
        if cached_html:
            return cached_html

        # Random delay to appear more human-like
        actual_delay = random.uniform(self.min_delay, self.max_delay)

        if self.request_count > 0:
            logger.info(f"⏳ Waiting {actual_delay:.1f}s before next request (being respectful)...")
            time.sleep(actual_delay)

        # Fetch page using parent class method
        html = super().fetch_page(url, custom_headers)

        if html:
            self.request_count += 1
            logger.info(f"📊 Request {self.request_count}/{self.max_requests}")

            # Save to cache
            self._save_to_cache(url, html)

        return html

    def get_session_stats(self) -> Dict[str, Any]:
        """Get statistics about current session"""
        return {
            'requests_made': self.request_count,
            'requests_remaining': self.max_requests - self.request_count,
            'cache_enabled': self.cache_enabled,
            'min_delay': self.min_delay,
            'max_delay': self.max_delay,
        }


class SafeCompetitorAnalyzer(CompetitorAnalyzer):
    """
    Safe competitor analyzer - minimal requests

    Only scrapes the main page, skips expensive operations
    """

    def __init__(
        self,
        min_delay: float = 5.0,
        max_delay: float = 10.0,
        max_requests: int = 10  # Very conservative for competitor analysis
    ):
        """Initialize safe competitor analyzer"""
        super().__init__()

        # Replace scraper with safe version
        self.scraper = SafeScraper(
            min_delay=min_delay,
            max_delay=max_delay,
            max_requests_per_session=max_requests,
            cache_enabled=True
        )

        logger.info("🛡️ Safe Competitor Analyzer initialized")
        logger.info("   Mode: Single-page analysis only")
        logger.info("   Cache: Enabled (24h)")

    def analyze_website(self, url: str) -> Dict[str, Any]:
        """
        Analyze website with minimal requests

        Only scrapes the main page - no pricing/feature page detection
        """
        logger.info(f"🔍 Analyzing (safe mode): {url}")

        # Scrape main page only
        page_data = self.scraper.scrape_page(url)

        if not page_data or 'error' in page_data:
            return page_data

        soup = self.scraper.parse_html(self.scraper.fetch_page(url))

        # Basic analysis only - no additional requests
        analysis = {
            'url': url,
            'basic_info': page_data['metadata'],
            'seo_analysis': self._analyze_seo(soup, page_data),
            'content_analysis': self._analyze_content(soup, page_data),
            'technology_stack': self._detect_technologies(soup),
            'social_presence': self._extract_social_links(soup),
            'call_to_actions': self._extract_ctas(soup),
            'contact_info': self._extract_contact_info(soup),
            'timestamp': time.time(),
            'note': 'Safe mode: Single-page analysis only (no additional requests)',
        }

        # Session stats
        stats = self.scraper.get_session_stats()
        logger.info(f"📊 Session: {stats['requests_made']}/{stats['requests_made'] + stats['requests_remaining']} requests used")

        return analysis


# CLI Interface
if __name__ == "__main__":
    import sys

    if len(sys.argv) < 2:
        print("""
Safe Web Scraper - No VPN Required

Usage:
  python safe-scraper.py <url> [--competitor] [--max-requests N]

Arguments:
  url                Target URL to scrape

Options:
  --competitor       Use competitor analysis mode
  --max-requests N   Set maximum requests (default: 50 for basic, 10 for competitor)
  --no-cache         Disable caching

Features:
  ✅ Extended delays (5-10 seconds between requests)
  ✅ Realistic user agents
  ✅ Request caching (24h)
  ✅ Request limiting
  ✅ Respectful scraping

Examples:
  # Basic scraping (safe)
  python safe-scraper.py https://example.com

  # Competitor analysis (very safe)
  python safe-scraper.py https://competitor.com --competitor

  # Custom request limit
  python safe-scraper.py https://example.com --max-requests 5
        """)
        sys.exit(1)

    url = sys.argv[1]
    use_competitor = '--competitor' in sys.argv
    use_cache = '--no-cache' not in sys.argv

    # Get max requests from args
    max_requests = 50  # Default
    if '--max-requests' in sys.argv:
        idx = sys.argv.index('--max-requests')
        if idx + 1 < len(sys.argv):
            max_requests = int(sys.argv[idx + 1])

    if use_competitor:
        analyzer = SafeCompetitorAnalyzer(
            min_delay=5.0,
            max_delay=10.0,
            max_requests=min(max_requests, 10)  # Max 10 for competitor
        )

        print(f"\n🔍 Safe Competitor Analysis: {url}\n")
        result = analyzer.analyze_website(url)

    else:
        scraper = SafeScraper(
            min_delay=5.0,
            max_delay=10.0,
            max_requests_per_session=max_requests,
            cache_enabled=use_cache
        )

        print(f"\n🔍 Safe Scraping: {url}\n")
        result = scraper.scrape_page(url)

    # Display results
    print(json.dumps(result, indent=2))

    # Show session stats
    if hasattr(scraper if not use_competitor else analyzer.scraper, 'get_session_stats'):
        stats = (scraper if not use_competitor else analyzer.scraper).get_session_stats()
        print(f"\n📊 Session Statistics:")
        print(f"   Requests made: {stats['requests_made']}")
        print(f"   Requests remaining: {stats['requests_remaining']}")
        print(f"   Cache: {'Enabled' if stats['cache_enabled'] else 'Disabled'}")
