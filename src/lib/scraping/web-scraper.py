"""
Web Scraper Module for Unite-Hub
Provides robust web scraping capabilities for competitor analysis and marketing research
"""

import json
import time
import logging
from typing import Dict, List, Optional, Any
from urllib.parse import urljoin, urlparse
import requests
from bs4 import BeautifulSoup
from fake_useragent import UserAgent
from tenacity import retry, stop_after_attempt, wait_exponential
import validators

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class WebScraper:
    """
    Advanced web scraper with retry logic, rate limiting, and error handling
    """

    def __init__(self, delay: float = 1.0, timeout: int = 30):
        """
        Initialize the web scraper

        Args:
            delay: Delay between requests in seconds (default: 1.0)
            timeout: Request timeout in seconds (default: 30)
        """
        self.delay = delay
        self.timeout = timeout
        self.ua = UserAgent()
        self.session = requests.Session()

    def _get_headers(self, custom_headers: Optional[Dict] = None) -> Dict:
        """Generate request headers with random user agent"""
        headers = {
            'User-Agent': self.ua.random,
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1'
        }

        if custom_headers:
            headers.update(custom_headers)

        return headers

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=4, max=10))
    def fetch_page(self, url: str, custom_headers: Optional[Dict] = None) -> Optional[str]:
        """
        Fetch HTML content from a URL with retry logic

        Args:
            url: Target URL to scrape
            custom_headers: Optional custom headers

        Returns:
            HTML content as string or None if failed
        """
        if not validators.url(url):
            logger.error(f"Invalid URL: {url}")
            return None

        try:
            logger.info(f"Fetching: {url}")
            response = self.session.get(
                url,
                headers=self._get_headers(custom_headers),
                timeout=self.timeout,
                allow_redirects=True
            )
            response.raise_for_status()

            time.sleep(self.delay)  # Rate limiting

            return response.text

        except requests.exceptions.RequestException as e:
            logger.error(f"Error fetching {url}: {str(e)}")
            raise

    def parse_html(self, html: str, parser: str = 'lxml') -> BeautifulSoup:
        """
        Parse HTML content using BeautifulSoup

        Args:
            html: HTML content string
            parser: Parser to use (lxml, html.parser, html5lib)

        Returns:
            BeautifulSoup object
        """
        return BeautifulSoup(html, parser)

    def extract_metadata(self, soup: BeautifulSoup, url: str) -> Dict[str, Any]:
        """
        Extract common metadata from a webpage

        Args:
            soup: BeautifulSoup object
            url: Source URL

        Returns:
            Dictionary with extracted metadata
        """
        metadata = {
            'url': url,
            'title': '',
            'description': '',
            'keywords': [],
            'og_title': '',
            'og_description': '',
            'og_image': '',
            'canonical_url': '',
            'language': '',
            'author': '',
        }

        # Title
        title_tag = soup.find('title')
        if title_tag:
            metadata['title'] = title_tag.get_text(strip=True)

        # Meta description
        desc_tag = soup.find('meta', attrs={'name': 'description'})
        if desc_tag and desc_tag.get('content'):
            metadata['description'] = desc_tag['content']

        # Meta keywords
        keywords_tag = soup.find('meta', attrs={'name': 'keywords'})
        if keywords_tag and keywords_tag.get('content'):
            metadata['keywords'] = [k.strip() for k in keywords_tag['content'].split(',')]

        # Open Graph tags
        og_title = soup.find('meta', attrs={'property': 'og:title'})
        if og_title and og_title.get('content'):
            metadata['og_title'] = og_title['content']

        og_desc = soup.find('meta', attrs={'property': 'og:description'})
        if og_desc and og_desc.get('content'):
            metadata['og_description'] = og_desc['content']

        og_image = soup.find('meta', attrs={'property': 'og:image'})
        if og_image and og_image.get('content'):
            metadata['og_image'] = og_image['content']

        # Canonical URL
        canonical = soup.find('link', attrs={'rel': 'canonical'})
        if canonical and canonical.get('href'):
            metadata['canonical_url'] = canonical['href']

        # Language
        html_tag = soup.find('html')
        if html_tag and html_tag.get('lang'):
            metadata['language'] = html_tag['lang']

        # Author
        author_tag = soup.find('meta', attrs={'name': 'author'})
        if author_tag and author_tag.get('content'):
            metadata['author'] = author_tag['content']

        return metadata

    def extract_links(self, soup: BeautifulSoup, base_url: str, internal_only: bool = False) -> List[str]:
        """
        Extract all links from a page

        Args:
            soup: BeautifulSoup object
            base_url: Base URL for resolving relative links
            internal_only: If True, only return internal links

        Returns:
            List of URLs
        """
        links = []
        base_domain = urlparse(base_url).netloc

        for a_tag in soup.find_all('a', href=True):
            href = a_tag['href']
            absolute_url = urljoin(base_url, href)

            if internal_only:
                link_domain = urlparse(absolute_url).netloc
                if link_domain == base_domain:
                    links.append(absolute_url)
            else:
                links.append(absolute_url)

        return list(set(links))  # Remove duplicates

    def extract_images(self, soup: BeautifulSoup, base_url: str) -> List[Dict[str, str]]:
        """
        Extract all images from a page

        Args:
            soup: BeautifulSoup object
            base_url: Base URL for resolving relative URLs

        Returns:
            List of dictionaries with image data
        """
        images = []

        for img_tag in soup.find_all('img'):
            img_data = {
                'src': urljoin(base_url, img_tag.get('src', '')),
                'alt': img_tag.get('alt', ''),
                'title': img_tag.get('title', ''),
            }
            images.append(img_data)

        return images

    def extract_text_content(self, soup: BeautifulSoup, strip_tags: List[str] = None) -> str:
        """
        Extract clean text content from a page

        Args:
            soup: BeautifulSoup object
            strip_tags: List of tag names to remove before extraction

        Returns:
            Clean text content
        """
        # Remove unwanted tags
        if strip_tags is None:
            strip_tags = ['script', 'style', 'nav', 'footer', 'header', 'aside']

        for tag in strip_tags:
            for element in soup.find_all(tag):
                element.decompose()

        # Get text
        text = soup.get_text(separator=' ', strip=True)

        # Clean up whitespace
        lines = (line.strip() for line in text.splitlines())
        chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
        text = ' '.join(chunk for chunk in chunks if chunk)

        return text

    def scrape_page(self, url: str) -> Dict[str, Any]:
        """
        Complete page scraping with all data extraction

        Args:
            url: Target URL

        Returns:
            Dictionary with all extracted data
        """
        html = self.fetch_page(url)
        if not html:
            return {'error': 'Failed to fetch page', 'url': url}

        soup = self.parse_html(html)

        result = {
            'url': url,
            'metadata': self.extract_metadata(soup, url),
            'links': self.extract_links(soup, url),
            'internal_links': self.extract_links(soup, url, internal_only=True),
            'images': self.extract_images(soup, url),
            'text_content': self.extract_text_content(soup),
            'timestamp': time.time(),
        }

        return result


class CompetitorAnalyzer:
    """
    Specialized analyzer for competitor websites
    """

    def __init__(self):
        self.scraper = WebScraper(delay=2.0)  # Be respectful with 2s delay

    def analyze_website(self, url: str) -> Dict[str, Any]:
        """
        Perform comprehensive competitor website analysis

        Args:
            url: Competitor website URL

        Returns:
            Analysis results dictionary
        """
        logger.info(f"Analyzing competitor website: {url}")

        # Scrape main page
        page_data = self.scraper.scrape_page(url)

        if 'error' in page_data:
            return page_data

        soup = self.scraper.parse_html(self.scraper.fetch_page(url))

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
        }

        return analysis

    def _analyze_seo(self, soup: BeautifulSoup, page_data: Dict) -> Dict:
        """Analyze SEO factors"""
        metadata = page_data['metadata']

        return {
            'has_title': bool(metadata['title']),
            'title_length': len(metadata['title']),
            'has_description': bool(metadata['description']),
            'description_length': len(metadata['description']),
            'has_keywords': bool(metadata['keywords']),
            'keyword_count': len(metadata['keywords']),
            'has_canonical': bool(metadata['canonical_url']),
            'has_og_tags': bool(metadata['og_title'] or metadata['og_description']),
            'heading_structure': self._analyze_headings(soup),
            'image_alt_ratio': self._calculate_image_alt_ratio(page_data['images']),
        }

    def _analyze_content(self, soup: BeautifulSoup, page_data: Dict) -> Dict:
        """Analyze content quality and structure"""
        text = page_data['text_content']
        words = text.split()

        return {
            'word_count': len(words),
            'character_count': len(text),
            'paragraph_count': len(soup.find_all('p')),
            'link_count': len(page_data['links']),
            'internal_link_count': len(page_data['internal_links']),
            'external_link_count': len(page_data['links']) - len(page_data['internal_links']),
            'image_count': len(page_data['images']),
        }

    def _detect_technologies(self, soup: BeautifulSoup) -> List[str]:
        """Detect technologies used on the website"""
        technologies = []

        # Check for common frameworks and libraries
        scripts = soup.find_all('script', src=True)
        for script in scripts:
            src = script['src'].lower()
            if 'react' in src:
                technologies.append('React')
            elif 'vue' in src:
                technologies.append('Vue.js')
            elif 'angular' in src:
                technologies.append('Angular')
            elif 'jquery' in src:
                technologies.append('jQuery')
            elif 'bootstrap' in src:
                technologies.append('Bootstrap')

        # Check meta tags
        generator = soup.find('meta', attrs={'name': 'generator'})
        if generator and generator.get('content'):
            technologies.append(generator['content'])

        return list(set(technologies))

    def _extract_social_links(self, soup: BeautifulSoup) -> Dict[str, str]:
        """Extract social media profile links"""
        social_links = {
            'facebook': '',
            'twitter': '',
            'linkedin': '',
            'instagram': '',
            'youtube': '',
        }

        for a_tag in soup.find_all('a', href=True):
            href = a_tag['href'].lower()
            if 'facebook.com' in href:
                social_links['facebook'] = a_tag['href']
            elif 'twitter.com' in href or 'x.com' in href:
                social_links['twitter'] = a_tag['href']
            elif 'linkedin.com' in href:
                social_links['linkedin'] = a_tag['href']
            elif 'instagram.com' in href:
                social_links['instagram'] = a_tag['href']
            elif 'youtube.com' in href:
                social_links['youtube'] = a_tag['href']

        return {k: v for k, v in social_links.items() if v}

    def _extract_ctas(self, soup: BeautifulSoup) -> List[str]:
        """Extract call-to-action text"""
        ctas = []

        # Common CTA elements
        cta_selectors = [
            'button',
            'a.btn',
            'a.button',
            '[role="button"]',
            'input[type="submit"]',
        ]

        for selector in cta_selectors:
            elements = soup.select(selector)
            for elem in elements:
                text = elem.get_text(strip=True)
                if text:
                    ctas.append(text)

        return list(set(ctas))[:20]  # Limit to 20 unique CTAs

    def _extract_contact_info(self, soup: BeautifulSoup) -> Dict[str, Any]:
        """Extract contact information"""
        import re

        text = soup.get_text()

        # Email regex
        emails = re.findall(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', text)

        # Phone regex (simple US format)
        phones = re.findall(r'\b\d{3}[-.]?\d{3}[-.]?\d{4}\b', text)

        return {
            'emails': list(set(emails))[:5],
            'phones': list(set(phones))[:5],
        }

    def _analyze_headings(self, soup: BeautifulSoup) -> Dict:
        """Analyze heading structure"""
        return {
            'h1_count': len(soup.find_all('h1')),
            'h2_count': len(soup.find_all('h2')),
            'h3_count': len(soup.find_all('h3')),
            'h4_count': len(soup.find_all('h4')),
            'h5_count': len(soup.find_all('h5')),
            'h6_count': len(soup.find_all('h6')),
        }

    def _calculate_image_alt_ratio(self, images: List[Dict]) -> float:
        """Calculate percentage of images with alt text"""
        if not images:
            return 0.0

        with_alt = sum(1 for img in images if img.get('alt'))
        return round((with_alt / len(images)) * 100, 2)


if __name__ == "__main__":
    # Example usage
    analyzer = CompetitorAnalyzer()
    result = analyzer.analyze_website("https://example.com")
    print(json.dumps(result, indent=2))
