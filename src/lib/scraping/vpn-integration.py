"""
VPN Integration for Web Scraping
Provides secure, anonymous scraping through VPN proxies
"""

import os
import json
import logging
import time
from typing import Dict, List, Optional, Any, Union
from dataclasses import dataclass
import requests
from requests.adapters import HTTPAdapter
from requests.packages.urllib3.util.retry import Retry
import socks
import socket
from python_socks.sync import Proxy as SocksProxy

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@dataclass
class VPNConfig:
    """VPN configuration data"""
    protocol: str  # 'http', 'https', 'socks4', 'socks5'
    host: str
    port: int
    username: Optional[str] = None
    password: Optional[str] = None
    enabled: bool = True
    name: Optional[str] = None


class VPNManager:
    """
    Manages VPN connections for web scraping
    Supports multiple VPN providers and protocols
    """

    def __init__(self, config_file: Optional[str] = None):
        """
        Initialize VPN manager

        Args:
            config_file: Path to VPN configuration file (JSON)
        """
        self.vpn_configs: List[VPNConfig] = []
        self.current_vpn_index = 0
        self.active_vpn: Optional[VPNConfig] = None

        if config_file and os.path.exists(config_file):
            self.load_config(config_file)

    def load_config(self, config_file: str) -> None:
        """Load VPN configurations from JSON file"""
        try:
            with open(config_file, 'r') as f:
                config_data = json.load(f)

            for vpn_data in config_data.get('vpns', []):
                vpn = VPNConfig(
                    protocol=vpn_data['protocol'],
                    host=vpn_data['host'],
                    port=vpn_data['port'],
                    username=vpn_data.get('username'),
                    password=vpn_data.get('password'),
                    enabled=vpn_data.get('enabled', True),
                    name=vpn_data.get('name', f"{vpn_data['host']}:{vpn_data['port']}")
                )

                if vpn.enabled:
                    self.vpn_configs.append(vpn)

            logger.info(f"Loaded {len(self.vpn_configs)} VPN configurations")

            # Set first VPN as active
            if self.vpn_configs:
                self.active_vpn = self.vpn_configs[0]
                logger.info(f"Active VPN: {self.active_vpn.name}")

        except Exception as e:
            logger.error(f"Error loading VPN config: {str(e)}")

    def add_vpn(self, vpn: VPNConfig) -> None:
        """Add a VPN configuration"""
        if vpn.enabled:
            self.vpn_configs.append(vpn)
            if not self.active_vpn:
                self.active_vpn = vpn
            logger.info(f"Added VPN: {vpn.name}")

    def get_proxy_dict(self, vpn: Optional[VPNConfig] = None) -> Dict[str, str]:
        """
        Get proxy dictionary for requests library

        Args:
            vpn: VPN config to use (uses active VPN if None)

        Returns:
            Proxy dictionary compatible with requests library
        """
        if vpn is None:
            vpn = self.active_vpn

        if not vpn:
            return {}

        # Build proxy URL
        if vpn.username and vpn.password:
            auth = f"{vpn.username}:{vpn.password}@"
        else:
            auth = ""

        proxy_url = f"{vpn.protocol}://{auth}{vpn.host}:{vpn.port}"

        return {
            'http': proxy_url,
            'https': proxy_url,
        }

    def get_socks_proxy(self, vpn: Optional[VPNConfig] = None) -> Optional[SocksProxy]:
        """
        Get SOCKS proxy for advanced use cases

        Args:
            vpn: VPN config to use (uses active VPN if None)

        Returns:
            SocksProxy instance or None
        """
        if vpn is None:
            vpn = self.active_vpn

        if not vpn or vpn.protocol not in ['socks4', 'socks5']:
            return None

        try:
            proxy_type = {
                'socks4': socks.SOCKS4,
                'socks5': socks.SOCKS5,
            }.get(vpn.protocol)

            return SocksProxy.create(
                proxy_type=proxy_type,
                host=vpn.host,
                port=vpn.port,
                username=vpn.username,
                password=vpn.password,
            )

        except Exception as e:
            logger.error(f"Error creating SOCKS proxy: {str(e)}")
            return None

    def rotate_vpn(self) -> Optional[VPNConfig]:
        """
        Rotate to next available VPN

        Returns:
            New active VPN config or None
        """
        if not self.vpn_configs:
            return None

        self.current_vpn_index = (self.current_vpn_index + 1) % len(self.vpn_configs)
        self.active_vpn = self.vpn_configs[self.current_vpn_index]

        logger.info(f"Rotated to VPN: {self.active_vpn.name}")

        return self.active_vpn

    def test_vpn(self, vpn: Optional[VPNConfig] = None) -> Dict[str, Any]:
        """
        Test VPN connection

        Args:
            vpn: VPN to test (uses active VPN if None)

        Returns:
            Test results dictionary
        """
        if vpn is None:
            vpn = self.active_vpn

        if not vpn:
            return {'success': False, 'error': 'No VPN configured'}

        try:
            proxies = self.get_proxy_dict(vpn)

            # Test connection with httpbin
            start_time = time.time()
            response = requests.get(
                'https://httpbin.org/ip',
                proxies=proxies,
                timeout=10
            )
            latency = (time.time() - start_time) * 1000  # ms

            if response.status_code == 200:
                ip_data = response.json()
                return {
                    'success': True,
                    'vpn_name': vpn.name,
                    'ip_address': ip_data.get('origin'),
                    'latency_ms': round(latency, 2),
                    'protocol': vpn.protocol,
                }
            else:
                return {
                    'success': False,
                    'error': f'HTTP {response.status_code}',
                }

        except Exception as e:
            return {
                'success': False,
                'error': str(e),
            }

    def test_all_vpns(self) -> List[Dict[str, Any]]:
        """
        Test all configured VPNs

        Returns:
            List of test results
        """
        results = []

        for vpn in self.vpn_configs:
            logger.info(f"Testing VPN: {vpn.name}")
            result = self.test_vpn(vpn)
            results.append(result)
            time.sleep(1)  # Rate limiting

        # Summary
        successful = sum(1 for r in results if r.get('success'))
        logger.info(f"VPN Test Results: {successful}/{len(results)} successful")

        return results


class VPNSession:
    """
    Enhanced requests.Session with VPN support
    """

    def __init__(self, vpn_manager: VPNManager, auto_rotate: bool = False):
        """
        Initialize VPN session

        Args:
            vpn_manager: VPNManager instance
            auto_rotate: Auto-rotate VPN on errors
        """
        self.vpn_manager = vpn_manager
        self.auto_rotate = auto_rotate
        self.session = requests.Session()

        # Configure retries
        retry_strategy = Retry(
            total=3,
            backoff_factor=1,
            status_forcelist=[429, 500, 502, 503, 504],
        )

        adapter = HTTPAdapter(max_retries=retry_strategy)
        self.session.mount("http://", adapter)
        self.session.mount("https://", adapter)

        # Set initial proxy
        self._update_proxies()

    def _update_proxies(self) -> None:
        """Update session proxies from active VPN"""
        proxies = self.vpn_manager.get_proxy_dict()
        self.session.proxies.update(proxies)

        if proxies:
            logger.info(f"Using VPN: {self.vpn_manager.active_vpn.name}")
        else:
            logger.warning("No VPN active - using direct connection")

    def rotate_vpn(self) -> None:
        """Rotate to next VPN"""
        self.vpn_manager.rotate_vpn()
        self._update_proxies()

    def get(self, url: str, **kwargs) -> requests.Response:
        """
        GET request with VPN support and auto-rotation

        Args:
            url: Target URL
            **kwargs: Additional arguments for requests.get

        Returns:
            Response object
        """
        try:
            response = self.session.get(url, **kwargs)
            response.raise_for_status()
            return response

        except Exception as e:
            logger.error(f"Request failed: {str(e)}")

            if self.auto_rotate and self.vpn_manager.vpn_configs:
                logger.info("Auto-rotating VPN and retrying...")
                self.rotate_vpn()
                return self.session.get(url, **kwargs)

            raise

    def post(self, url: str, **kwargs) -> requests.Response:
        """
        POST request with VPN support

        Args:
            url: Target URL
            **kwargs: Additional arguments for requests.post

        Returns:
            Response object
        """
        try:
            response = self.session.post(url, **kwargs)
            response.raise_for_status()
            return response

        except Exception as e:
            logger.error(f"Request failed: {str(e)}")

            if self.auto_rotate and self.vpn_manager.vpn_configs:
                logger.info("Auto-rotating VPN and retrying...")
                self.rotate_vpn()
                return self.session.post(url, **kwargs)

            raise

    def get_current_ip(self) -> str:
        """
        Get current public IP address

        Returns:
            IP address string
        """
        try:
            response = self.session.get('https://api.ipify.org?format=json', timeout=10)
            return response.json()['ip']

        except Exception as e:
            logger.error(f"Failed to get IP: {str(e)}")
            return 'Unknown'


def create_vpn_config_template(output_file: str = 'vpn-config.json') -> None:
    """
    Create a template VPN configuration file

    Args:
        output_file: Output file path
    """
    template = {
        "vpns": [
            {
                "name": "Primary VPN (HTTP)",
                "protocol": "http",
                "host": "proxy.example.com",
                "port": 8080,
                "username": "your_username",
                "password": "your_password",
                "enabled": True
            },
            {
                "name": "Backup VPN (SOCKS5)",
                "protocol": "socks5",
                "host": "socks.example.com",
                "port": 1080,
                "username": "your_username",
                "password": "your_password",
                "enabled": True
            },
            {
                "name": "NordVPN Example",
                "protocol": "socks5",
                "host": "us1234.nordvpn.com",
                "port": 1080,
                "username": "your_nordvpn_email",
                "password": "your_nordvpn_password",
                "enabled": False
            },
            {
                "name": "ExpressVPN Example",
                "protocol": "https",
                "host": "us-server.expressvpn.com",
                "port": 443,
                "username": "your_expressvpn_username",
                "password": "your_expressvpn_password",
                "enabled": False
            }
        ],
        "settings": {
            "auto_rotate": True,
            "rotation_interval_seconds": 300,
            "test_on_startup": True
        }
    }

    with open(output_file, 'w') as f:
        json.dump(template, f, indent=2)

    logger.info(f"Created VPN config template: {output_file}")


# CLI Interface
if __name__ == "__main__":
    import sys

    if len(sys.argv) > 1 and sys.argv[1] == 'create-config':
        output_file = sys.argv[2] if len(sys.argv) > 2 else 'vpn-config.json'
        create_vpn_config_template(output_file)
        print(f"✅ Created VPN config template: {output_file}")
        print("\nEdit this file with your VPN credentials and run:")
        print(f"  python vpn-integration.py test {output_file}")
        sys.exit(0)

    if len(sys.argv) > 1 and sys.argv[1] == 'test':
        config_file = sys.argv[2] if len(sys.argv) > 2 else 'vpn-config.json'

        if not os.path.exists(config_file):
            print(f"❌ Config file not found: {config_file}")
            print("\nCreate a config file first:")
            print("  python vpn-integration.py create-config")
            sys.exit(1)

        print(f"\n🔍 Testing VPNs from: {config_file}\n")

        manager = VPNManager(config_file)
        results = manager.test_all_vpns()

        print("\n📊 Test Results:\n")
        for result in results:
            if result.get('success'):
                print(f"✅ {result['vpn_name']}")
                print(f"   IP: {result['ip_address']}")
                print(f"   Latency: {result['latency_ms']}ms")
                print(f"   Protocol: {result['protocol']}\n")
            else:
                print(f"❌ Failed: {result.get('error')}\n")

        sys.exit(0)

    # Default: Show usage
    print("""
VPN Integration for Web Scraping

Usage:
  python vpn-integration.py create-config [output_file]
    Create a template VPN configuration file

  python vpn-integration.py test [config_file]
    Test all VPNs in configuration file

Examples:
  python vpn-integration.py create-config
  python vpn-integration.py test vpn-config.json
    """)
