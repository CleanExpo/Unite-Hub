"""
Playwright with VPN/Proxy Support
JavaScript rendering with VPN for better security and anonymity
"""

import asyncio
import json
import logging
from typing import Dict, List, Optional, Any
from datetime import datetime
from playwright.async_api import async_playwright, Page, Browser, BrowserContext
from vpn_integration import VPNManager, VPNConfig

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class VPNPlaywrightScraper:
    """
    Playwright scraper with VPN/proxy support
    """

    def __init__(
        self,
        vpn_config_file: Optional[str] = None,
        headless: bool = True,
        timeout: int = 30000
    ):
        """
        Initialize VPN-enabled Playwright scraper

        Args:
            vpn_config_file: Path to VPN configuration file
            headless: Run browser in headless mode
            timeout: Page load timeout in milliseconds
        """
        self.headless = headless
        self.timeout = timeout
        self.vpn_manager = VPNManager(vpn_config_file) if vpn_config_file else None
        self.browser: Optional[Browser] = None
        self.context: Optional[BrowserContext] = None
        self.playwright = None

    async def __aenter__(self):
        """Context manager entry"""
        self.playwright = await async_playwright().start()

        # Get proxy configuration from VPN
        proxy_config = None

        if self.vpn_manager and self.vpn_manager.active_vpn:
            vpn = self.vpn_manager.active_vpn
            proxy_config = {
                'server': f"{vpn.protocol}://{vpn.host}:{vpn.port}",
            }

            if vpn.username and vpn.password:
                proxy_config['username'] = vpn.username
                proxy_config['password'] = vpn.password

            logger.info(f"✅ Using VPN proxy: {vpn.name}")
        else:
            logger.warning("⚠️ No VPN configured - using direct connection")

        # Launch browser with proxy
        self.browser = await self.playwright.chromium.launch(
            headless=self.headless,
            proxy=proxy_config
        )

        # Create context with additional security headers
        self.context = await self.browser.new_context(
            user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            viewport={'width': 1920, 'height': 1080},
            locale='en-US',
            timezone_id='America/New_York',
        )

        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Context manager exit"""
        if self.context:
            await self.context.close()
        if self.browser:
            await self.browser.close()
        if self.playwright:
            await self.playwright.stop()

    async def get_current_ip(self) -> str:
        """
        Get current IP address as seen by external services

        Returns:
            IP address string
        """
        try:
            page = await self.context.new_page()
            await page.goto('https://api.ipify.org?format=json', timeout=self.timeout)

            content = await page.content()
            await page.close()

            # Parse JSON response
            import re
            ip_match = re.search(r'"ip":"([^"]+)"', content)
            if ip_match:
                ip = ip_match.group(1)
                logger.info(f"📍 Current IP: {ip}")
                return ip

            return 'Unknown'

        except Exception as e:
            logger.error(f"Failed to get IP: {str(e)}")
            return 'Unknown'

    async def scrape_page(
        self,
        url: str,
        wait_for: Optional[str] = None,
        screenshot: bool = False,
        execute_script: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Scrape a page with VPN and JavaScript rendering support

        Args:
            url: Target URL
            wait_for: CSS selector to wait for before scraping
            screenshot: Whether to take a screenshot
            execute_script: Optional JavaScript to execute on page

        Returns:
            Dictionary with scraped data
        """
        page = await self.context.new_page()

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
            text_content = await page.evaluate("() => document.body.innerText")

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
                'vpn_used': self.vpn_manager.active_vpn.name if self.vpn_manager and self.vpn_manager.active_vpn else None,
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
                'vpn_used': self.vpn_manager.active_vpn.name if self.vpn_manager and self.vpn_manager.active_vpn else None,
                'timestamp': datetime.now().isoformat(),
            }

        finally:
            await page.close()

    async def scrape_multiple(
        self,
        urls: List[str],
        rotate_vpn_between: bool = False
    ) -> List[Dict[str, Any]]:
        """
        Scrape multiple URLs with optional VPN rotation

        Args:
            urls: List of URLs to scrape
            rotate_vpn_between: Rotate VPN between each URL

        Returns:
            List of scraping results
        """
        results = []

        for i, url in enumerate(urls):
            logger.info(f"Scraping {i+1}/{len(urls)}: {url}")

            # Rotate VPN if requested and possible
            if rotate_vpn_between and self.vpn_manager and i > 0:
                await self.__aexit__(None, None, None)
                self.vpn_manager.rotate_vpn()
                await self.__aenter__()
                logger.info(f"🔄 Rotated to VPN: {self.vpn_manager.active_vpn.name}")

            result = await self.scrape_page(url)
            results.append(result)

            # Small delay between requests
            await asyncio.sleep(2)

        return results


# CLI Interface
async def main():
    """CLI interface for testing"""
    import sys

    if len(sys.argv) < 2:
        print("""
VPN-Enhanced Playwright Scraper

Usage:
  python playwright-vpn.py <url> [--config vpn-config.json] [--show-ip]

Arguments:
  url                Target URL to scrape

Options:
  --config <file>    VPN configuration file
  --show-ip          Display current IP address
  --screenshot       Take full page screenshot

Examples:
  python playwright-vpn.py https://example.com --config vpn-config.json --show-ip
        """)
        sys.exit(1)

    url = sys.argv[1]

    # Parse options
    config_file = None
    show_ip = '--show-ip' in sys.argv
    take_screenshot = '--screenshot' in sys.argv

    if '--config' in sys.argv:
        config_index = sys.argv.index('--config')
        if config_index + 1 < len(sys.argv):
            config_file = sys.argv[config_index + 1]

    # Create scraper
    async with VPNPlaywrightScraper(vpn_config_file=config_file) as scraper:
        # Show IP if requested
        if show_ip:
            ip = await scraper.get_current_ip()
            print(f"\n📍 Scraping from IP: {ip}\n")

        # Scrape
        print(f"🔍 Scraping: {url}\n")
        result = await scraper.scrape_page(url, screenshot=take_screenshot)

        # Display results
        print(json.dumps(result, indent=2))


if __name__ == "__main__":
    asyncio.run(main())
