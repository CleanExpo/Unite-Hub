"""
VPN-Enhanced Web Scraper
Extends web-scraper.py with VPN support
"""

import sys
import os
from pathlib import Path

# Add parent directory to path
sys.path.append(str(Path(__file__).parent))

from web_scraper import WebScraper, CompetitorAnalyzer
from vpn_integration import VPNManager, VPNSession
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class VPNWebScraper(WebScraper):
    """
    Web scraper with VPN support
    """

    def __init__(
        self,
        vpn_config_file: str = None,
        auto_rotate: bool = False,
        delay: float = 1.0,
        timeout: int = 30
    ):
        """
        Initialize VPN-enabled scraper

        Args:
            vpn_config_file: Path to VPN configuration file
            auto_rotate: Auto-rotate VPN on errors
            delay: Delay between requests
            timeout: Request timeout
        """
        super().__init__(delay=delay, timeout=timeout)

        # Initialize VPN manager
        self.vpn_manager = VPNManager(vpn_config_file) if vpn_config_file else None
        self.auto_rotate = auto_rotate

        # Replace session with VPN session if VPN configured
        if self.vpn_manager and self.vpn_manager.vpn_configs:
            self.session = VPNSession(self.vpn_manager, auto_rotate=auto_rotate).session
            logger.info(f"✅ VPN enabled: {self.vpn_manager.active_vpn.name}")

            # Update proxies
            proxies = self.vpn_manager.get_proxy_dict()
            self.session.proxies.update(proxies)
        else:
            logger.warning("⚠️ No VPN configured - using direct connection")

    def rotate_vpn(self) -> None:
        """Rotate to next VPN"""
        if self.vpn_manager:
            self.vpn_manager.rotate_vpn()
            proxies = self.vpn_manager.get_proxy_dict()
            self.session.proxies.update(proxies)
            logger.info(f"🔄 Rotated to VPN: {self.vpn_manager.active_vpn.name}")

    def get_current_ip(self) -> str:
        """Get current public IP address"""
        try:
            response = self.session.get('https://api.ipify.org?format=json', timeout=10)
            ip = response.json()['ip']
            logger.info(f"📍 Current IP: {ip}")
            return ip
        except Exception as e:
            logger.error(f"Failed to get IP: {str(e)}")
            return 'Unknown'


class VPNCompetitorAnalyzer(CompetitorAnalyzer):
    """
    Competitor analyzer with VPN support
    """

    def __init__(
        self,
        vpn_config_file: str = None,
        auto_rotate: bool = True
    ):
        """
        Initialize VPN-enabled competitor analyzer

        Args:
            vpn_config_file: Path to VPN configuration file
            auto_rotate: Auto-rotate VPN on errors
        """
        super().__init__()

        # Replace scraper with VPN-enabled version
        self.scraper = VPNWebScraper(
            vpn_config_file=vpn_config_file,
            auto_rotate=auto_rotate,
            delay=2.0  # Be respectful with 2s delay
        )

        logger.info("🛡️ VPN Competitor Analyzer initialized")

    def rotate_vpn(self) -> None:
        """Rotate to next VPN"""
        self.scraper.rotate_vpn()


# CLI Interface
if __name__ == "__main__":
    import json

    if len(sys.argv) < 2:
        print("""
VPN-Enhanced Web Scraper

Usage:
  python web-scraper-vpn.py <url> [--config vpn-config.json] [--rotate]

Arguments:
  url                Target URL to scrape

Options:
  --config <file>    VPN configuration file
  --rotate           Auto-rotate VPN on errors
  --competitor       Use competitor analysis mode

Examples:
  # Basic scraping with VPN
  python web-scraper-vpn.py https://example.com --config vpn-config.json

  # Competitor analysis with auto-rotation
  python web-scraper-vpn.py https://competitor.com --config vpn-config.json --rotate --competitor
        """)
        sys.exit(1)

    url = sys.argv[1]

    # Parse options
    config_file = None
    auto_rotate = '--rotate' in sys.argv
    use_competitor = '--competitor' in sys.argv

    if '--config' in sys.argv:
        config_index = sys.argv.index('--config')
        if config_index + 1 < len(sys.argv):
            config_file = sys.argv[config_index + 1]

    # Create scraper
    if use_competitor:
        analyzer = VPNCompetitorAnalyzer(
            vpn_config_file=config_file,
            auto_rotate=auto_rotate
        )

        print(f"\n🔍 Analyzing competitor: {url}\n")

        # Show current IP
        current_ip = analyzer.scraper.get_current_ip()
        print(f"📍 Scraping from IP: {current_ip}\n")

        # Analyze
        result = analyzer.analyze_website(url)

        # Display results
        print(json.dumps(result, indent=2))

    else:
        scraper = VPNWebScraper(
            vpn_config_file=config_file,
            auto_rotate=auto_rotate
        )

        print(f"\n🔍 Scraping: {url}\n")

        # Show current IP
        current_ip = scraper.get_current_ip()
        print(f"📍 Scraping from IP: {current_ip}\n")

        # Scrape
        result = scraper.scrape_page(url)

        # Display results
        print(json.dumps(result, indent=2))
