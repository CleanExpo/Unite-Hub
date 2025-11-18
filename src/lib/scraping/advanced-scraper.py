"""
Advanced Web Scraper with JavaScript Rendering Support
Uses Playwright for dynamic content scraping
"""

import asyncio
import json
import logging
from typing import Dict, List, Optional, Any
from datetime import datetime
from playwright.async_api import async_playwright, Page, Browser

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class JavaScriptScraper:
    """
    Advanced scraper using Playwright for JavaScript-rendered content
    """

    def __init__(self, headless: bool = True, timeout: int = 30000):
        """
        Initialize JavaScript scraper

        Args:
            headless: Run browser in headless mode
            timeout: Page load timeout in milliseconds
        """
        self.headless = headless
        self.timeout = timeout
        self.browser: Optional[Browser] = None

    async def __aenter__(self):
        """Context manager entry"""
        self.playwright = await async_playwright().start()
        self.browser = await self.playwright.chromium.launch(headless=self.headless)
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Context manager exit"""
        if self.browser:
            await self.browser.close()
        await self.playwright.stop()

    async def scrape_page(
        self,
        url: str,
        wait_for: Optional[str] = None,
        screenshot: bool = False,
        execute_script: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Scrape a page with JavaScript rendering support

        Args:
            url: Target URL
            wait_for: CSS selector to wait for before scraping
            screenshot: Whether to take a screenshot
            execute_script: Optional JavaScript to execute on page

        Returns:
            Dictionary with scraped data
        """
        if not self.browser:
            raise RuntimeError("Browser not initialized. Use 'async with' context manager.")

        page = await self.browser.new_page()

        try:
            logger.info(f"Navigating to: {url}")
            await page.goto(url, timeout=self.timeout, wait_until='networkidle')

            # Wait for specific element if requested
            if wait_for:
                await page.wait_for_selector(wait_for, timeout=self.timeout)

            # Execute custom JavaScript if provided
            script_result = None
            if execute_script:
                script_result = await page.evaluate(execute_script)

            # Extract page data
            html = await page.content()
            title = await page.title()

            # Extract all text
            text_content = await page.evaluate("""
                () => document.body.innerText
            """)

            # Extract links
            links = await page.evaluate("""
                () => Array.from(document.querySelectorAll('a'))
                    .map(a => ({
                        href: a.href,
                        text: a.innerText.trim()
                    }))
            """)

            # Extract metadata
            metadata = await page.evaluate("""
                () => {
                    const getMeta = (name) => {
                        const meta = document.querySelector(`meta[name="${name}"]`) ||
                                     document.querySelector(`meta[property="${name}"]`);
                        return meta ? meta.content : '';
                    };

                    return {
                        title: document.title,
                        description: getMeta('description'),
                        keywords: getMeta('keywords'),
                        og_title: getMeta('og:title'),
                        og_description: getMeta('og:description'),
                        og_image: getMeta('og:image'),
                    };
                }
            """)

            result = {
                'url': url,
                'title': title,
                'html': html,
                'text_content': text_content,
                'links': links,
                'metadata': metadata,
                'script_result': script_result,
                'timestamp': datetime.now().isoformat(),
            }

            # Take screenshot if requested
            if screenshot:
                screenshot_path = f"screenshot_{datetime.now().timestamp()}.png"
                await page.screenshot(path=screenshot_path, full_page=True)
                result['screenshot'] = screenshot_path

            return result

        except Exception as e:
            logger.error(f"Error scraping {url}: {str(e)}")
            return {
                'url': url,
                'error': str(e),
                'timestamp': datetime.now().isoformat(),
            }

        finally:
            await page.close()

    async def scrape_spa(self, url: str, scroll_count: int = 3) -> Dict[str, Any]:
        """
        Scrape Single Page Applications with infinite scroll

        Args:
            url: Target URL
            scroll_count: Number of times to scroll down

        Returns:
            Dictionary with scraped data
        """
        if not self.browser:
            raise RuntimeError("Browser not initialized.")

        page = await self.browser.new_page()

        try:
            await page.goto(url, wait_until='networkidle')

            # Scroll to load more content
            for i in range(scroll_count):
                logger.info(f"Scrolling... {i+1}/{scroll_count}")
                await page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
                await asyncio.sleep(2)  # Wait for content to load

            html = await page.content()
            text = await page.evaluate("() => document.body.innerText")

            return {
                'url': url,
                'html': html,
                'text_content': text,
                'scroll_count': scroll_count,
                'timestamp': datetime.now().isoformat(),
            }

        finally:
            await page.close()

    async def extract_structured_data(self, url: str) -> Dict[str, Any]:
        """
        Extract structured data (JSON-LD, microdata, etc.)

        Args:
            url: Target URL

        Returns:
            Extracted structured data
        """
        if not self.browser:
            raise RuntimeError("Browser not initialized.")

        page = await self.browser.new_page()

        try:
            await page.goto(url, wait_until='networkidle')

            # Extract JSON-LD
            json_ld = await page.evaluate("""
                () => {
                    const scripts = Array.from(
                        document.querySelectorAll('script[type="application/ld+json"]')
                    );
                    return scripts.map(s => {
                        try {
                            return JSON.parse(s.innerText);
                        } catch {
                            return null;
                        }
                    }).filter(Boolean);
                }
            """)

            # Extract Open Graph data
            og_data = await page.evaluate("""
                () => {
                    const ogTags = Array.from(
                        document.querySelectorAll('meta[property^="og:"]')
                    );
                    const data = {};
                    ogTags.forEach(tag => {
                        const property = tag.getAttribute('property');
                        const content = tag.getAttribute('content');
                        if (property && content) {
                            data[property.replace('og:', '')] = content;
                        }
                    });
                    return data;
                }
            """)

            return {
                'url': url,
                'json_ld': json_ld,
                'open_graph': og_data,
                'timestamp': datetime.now().isoformat(),
            }

        finally:
            await page.close()


class SEOAnalyzer:
    """
    SEO-focused web scraping and analysis
    """

    def __init__(self):
        self.scraper = JavaScriptScraper()

    async def analyze_seo(self, url: str) -> Dict[str, Any]:
        """
        Comprehensive SEO analysis

        Args:
            url: Target URL

        Returns:
            SEO analysis results
        """
        async with self.scraper:
            # Get page data
            page_data = await self.scraper.scrape_page(url)

            if 'error' in page_data:
                return page_data

            # Get structured data
            structured_data = await self.scraper.extract_structured_data(url)

            # Analyze
            analysis = {
                'url': url,
                'title': {
                    'text': page_data['metadata']['title'],
                    'length': len(page_data['metadata']['title']),
                    'optimal': 30 <= len(page_data['metadata']['title']) <= 60,
                },
                'description': {
                    'text': page_data['metadata']['description'],
                    'length': len(page_data['metadata']['description']),
                    'optimal': 120 <= len(page_data['metadata']['description']) <= 160,
                },
                'headings': await self._analyze_headings(page_data['html']),
                'links': {
                    'total': len(page_data['links']),
                    'with_text': sum(1 for link in page_data['links'] if link['text']),
                },
                'structured_data': {
                    'has_json_ld': bool(structured_data.get('json_ld')),
                    'has_open_graph': bool(structured_data.get('open_graph')),
                },
                'content': {
                    'word_count': len(page_data['text_content'].split()),
                    'character_count': len(page_data['text_content']),
                },
                'timestamp': datetime.now().isoformat(),
            }

            return analysis

    async def _analyze_headings(self, html: str) -> Dict[str, int]:
        """Analyze heading structure from HTML"""
        from bs4 import BeautifulSoup

        soup = BeautifulSoup(html, 'lxml')

        return {
            'h1': len(soup.find_all('h1')),
            'h2': len(soup.find_all('h2')),
            'h3': len(soup.find_all('h3')),
            'h4': len(soup.find_all('h4')),
            'h5': len(soup.find_all('h5')),
            'h6': len(soup.find_all('h6')),
        }


# CLI Interface
async def main():
    """CLI interface for testing"""
    import sys

    if len(sys.argv) < 2:
        print("Usage: python advanced-scraper.py <url>")
        sys.exit(1)

    url = sys.argv[1]

    # Run SEO analysis
    analyzer = SEOAnalyzer()
    result = await analyzer.analyze_seo(url)

    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    asyncio.run(main())
