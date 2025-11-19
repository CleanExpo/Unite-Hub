"""
Competitor Intelligence Service
Comprehensive competitor analysis and monitoring
"""

import json
import asyncio
import logging
from typing import Dict, List, Optional, Any
from datetime import datetime
from pathlib import Path
import sys

# Add current directory to path for imports
sys.path.insert(0, str(Path(__file__).parent))

# Import using importlib to handle hyphenated module names
import importlib.util

# Load web-scraper module
spec = importlib.util.spec_from_file_location("web_scraper", Path(__file__).parent / "web-scraper.py")
web_scraper_module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(web_scraper_module)
CompetitorAnalyzer = web_scraper_module.CompetitorAnalyzer

# Try to load advanced-scraper module
try:
    spec = importlib.util.spec_from_file_location("advanced_scraper", Path(__file__).parent / "advanced-scraper.py")
    advanced_scraper_module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(advanced_scraper_module)
    SEOAnalyzer = advanced_scraper_module.SEOAnalyzer
    JavaScriptScraper = advanced_scraper_module.JavaScriptScraper
except Exception as e:
    logger.warning(f"Could not load advanced scraper: {e}")
    SEOAnalyzer = None
    JavaScriptScraper = None

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class CompetitorIntelligence:
    """
    Comprehensive competitor intelligence gathering and analysis
    """

    def __init__(self):
        self.basic_analyzer = CompetitorAnalyzer()
        self.seo_analyzer = SEOAnalyzer() if SEOAnalyzer else None

    async def full_analysis(self, url: str) -> Dict[str, Any]:
        """
        Perform complete competitor analysis

        Args:
            url: Competitor website URL

        Returns:
            Comprehensive analysis results
        """
        logger.info(f"Starting full analysis for: {url}")

        results = {
            'url': url,
            'timestamp': datetime.now().isoformat(),
            'basic_analysis': None,
            'seo_analysis': None,
            'pricing_info': None,
            'features': None,
            'technologies': None,
        }

        try:
            # Basic website analysis
            logger.info("Running basic analysis...")
            results['basic_analysis'] = self.basic_analyzer.analyze_website(url)

            # SEO analysis
            logger.info("Running SEO analysis...")
            results['seo_analysis'] = await self.seo_analyzer.analyze_seo(url)

            # Detect pricing pages
            logger.info("Analyzing pricing information...")
            results['pricing_info'] = await self._analyze_pricing(url)

            # Extract features
            logger.info("Extracting features...")
            results['features'] = await self._extract_features(url)

            # Technology detection
            logger.info("Detecting technologies...")
            results['technologies'] = self._detect_technologies(results['basic_analysis'])

            # Generate competitive insights
            logger.info("Generating competitive insights...")
            results['insights'] = self._generate_insights(results)

            logger.info(f"Analysis complete for: {url}")

        except Exception as e:
            logger.error(f"Error during analysis: {str(e)}")
            results['error'] = str(e)

        return results

    async def _analyze_pricing(self, base_url: str) -> Dict[str, Any]:
        """
        Detect and analyze pricing information

        Args:
            base_url: Base website URL

        Returns:
            Pricing analysis
        """
        pricing_keywords = ['pricing', 'plans', 'price', 'buy', 'purchase']
        pricing_data = {
            'has_pricing_page': False,
            'pricing_url': None,
            'detected_plans': [],
            'price_points': [],
        }

        try:
            # Check common pricing page URLs
            common_paths = ['/pricing', '/plans', '/pricing-plans', '/buy']

            async with JavaScriptScraper() as scraper:
                for path in common_paths:
                    try:
                        test_url = base_url.rstrip('/') + path
                        logger.info(f"Checking pricing page: {test_url}")

                        result = await scraper.scrape_page(test_url)

                        if 'error' not in result:
                            pricing_data['has_pricing_page'] = True
                            pricing_data['pricing_url'] = test_url

                            # Extract pricing information
                            pricing_data['detected_plans'] = await self._extract_pricing_plans(result)
                            break

                    except Exception as e:
                        logger.debug(f"Pricing page not found at {path}: {str(e)}")
                        continue

        except Exception as e:
            logger.error(f"Error analyzing pricing: {str(e)}")

        return pricing_data

    async def _extract_pricing_plans(self, page_data: Dict) -> List[Dict]:
        """Extract pricing plan information from page data"""
        import re

        plans = []
        text = page_data.get('text_content', '')

        # Look for price patterns ($XX, $XX/month, etc.)
        price_pattern = r'\$\d+(?:\.\d{2})?(?:/(?:mo|month|yr|year|user))?'
        prices = re.findall(price_pattern, text)

        # Look for plan names (common patterns)
        plan_pattern = r'(Free|Starter|Basic|Pro|Professional|Business|Enterprise|Premium|Plus)'
        plan_names = re.findall(plan_pattern, text, re.IGNORECASE)

        for i, name in enumerate(set(plan_names)):
            plan = {
                'name': name,
                'price': prices[i] if i < len(prices) else None,
            }
            plans.append(plan)

        return plans

    async def _extract_features(self, url: str) -> List[str]:
        """
        Extract product features from website

        Args:
            url: Website URL

        Returns:
            List of detected features
        """
        features = []

        try:
            async with JavaScriptScraper() as scraper:
                # Check common feature page URLs
                feature_paths = ['/features', '/product', '/solutions']

                for path in feature_paths:
                    try:
                        test_url = url.rstrip('/') + path
                        result = await scraper.scrape_page(test_url)

                        if 'error' not in result:
                            # Extract feature list items
                            from bs4 import BeautifulSoup
                            soup = BeautifulSoup(result['html'], 'lxml')

                            # Look for list items in feature sections
                            for ul in soup.find_all(['ul', 'ol']):
                                for li in ul.find_all('li'):
                                    feature_text = li.get_text(strip=True)
                                    if feature_text and len(feature_text) > 10:
                                        features.append(feature_text)

                            break

                    except Exception:
                        continue

        except Exception as e:
            logger.error(f"Error extracting features: {str(e)}")

        return features[:20]  # Limit to 20 features

    def _detect_technologies(self, basic_analysis: Dict) -> Dict[str, Any]:
        """
        Detect technologies used by competitor

        Args:
            basic_analysis: Basic analysis results

        Returns:
            Technology detection results
        """
        technologies = {
            'frontend': [],
            'analytics': [],
            'marketing': [],
            'frameworks': [],
        }

        if not basic_analysis or 'error' in basic_analysis:
            return technologies

        detected = basic_analysis.get('technology_stack', [])

        # Categorize technologies
        frontend_tech = ['React', 'Vue.js', 'Angular', 'jQuery', 'Next.js']
        analytics_tech = ['Google Analytics', 'Mixpanel', 'Segment', 'Hotjar']
        marketing_tech = ['HubSpot', 'Mailchimp', 'Intercom', 'Drift']

        for tech in detected:
            if any(ft in tech for ft in frontend_tech):
                technologies['frontend'].append(tech)
            elif any(at in tech for at in analytics_tech):
                technologies['analytics'].append(tech)
            elif any(mt in tech for mt in marketing_tech):
                technologies['marketing'].append(tech)
            else:
                technologies['frameworks'].append(tech)

        return technologies

    def _generate_insights(self, analysis: Dict) -> Dict[str, Any]:
        """
        Generate competitive insights from analysis

        Args:
            analysis: Complete analysis results

        Returns:
            Competitive insights
        """
        insights = {
            'strengths': [],
            'weaknesses': [],
            'opportunities': [],
            'recommendations': [],
        }

        basic = analysis.get('basic_analysis', {})
        seo = analysis.get('seo_analysis', {})

        # SEO strengths/weaknesses
        if seo and 'error' not in seo:
            title = seo.get('title', {})
            description = seo.get('description', {})

            if title.get('optimal'):
                insights['strengths'].append("Well-optimized title tag")
            else:
                insights['weaknesses'].append("Title tag needs optimization")
                insights['recommendations'].append("Optimize title tag to 30-60 characters")

            if description.get('optimal'):
                insights['strengths'].append("Well-optimized meta description")
            else:
                insights['weaknesses'].append("Meta description needs optimization")
                insights['recommendations'].append("Optimize meta description to 120-160 characters")

        # Content analysis
        if basic and 'error' not in basic:
            content = basic.get('content_analysis', {})
            word_count = content.get('word_count', 0)

            if word_count > 1000:
                insights['strengths'].append("Rich content with good depth")
            elif word_count < 300:
                insights['weaknesses'].append("Thin content, lacks depth")
                insights['recommendations'].append("Add more comprehensive content (aim for 1000+ words)")

            # Social presence
            social = basic.get('social_presence', {})
            if len(social) >= 3:
                insights['strengths'].append("Strong social media presence")
            elif len(social) < 2:
                insights['weaknesses'].append("Limited social media presence")
                insights['recommendations'].append("Expand social media presence across more platforms")

        # Pricing insights
        pricing = analysis.get('pricing_info', {})
        if pricing and pricing.get('has_pricing_page'):
            insights['strengths'].append("Clear pricing page available")
            insights['opportunities'].append("Analyze pricing strategy for competitive positioning")
        else:
            insights['weaknesses'].append("No clear pricing information")

        return insights

    async def monitor_changes(self, url: str, previous_data: Optional[Dict] = None) -> Dict[str, Any]:
        """
        Monitor website changes over time

        Args:
            url: Website URL
            previous_data: Previous analysis data for comparison

        Returns:
            Change detection results
        """
        current_data = await self.full_analysis(url)

        if not previous_data:
            return {
                'url': url,
                'message': 'No previous data for comparison',
                'current_data': current_data,
            }

        changes = {
            'url': url,
            'timestamp': datetime.now().isoformat(),
            'changes_detected': False,
            'changes': [],
        }

        # Compare title
        old_title = previous_data.get('seo_analysis', {}).get('title', {}).get('text', '')
        new_title = current_data.get('seo_analysis', {}).get('title', {}).get('text', '')

        if old_title != new_title:
            changes['changes_detected'] = True
            changes['changes'].append({
                'field': 'title',
                'old_value': old_title,
                'new_value': new_title,
            })

        # Compare pricing
        old_pricing = previous_data.get('pricing_info', {}).get('has_pricing_page', False)
        new_pricing = current_data.get('pricing_info', {}).get('has_pricing_page', False)

        if old_pricing != new_pricing:
            changes['changes_detected'] = True
            changes['changes'].append({
                'field': 'pricing_page',
                'old_value': old_pricing,
                'new_value': new_pricing,
            })

        return changes


# CLI Interface
async def main():
    """CLI interface for testing"""
    if len(sys.argv) < 2:
        print("Usage: python competitor-intelligence.py <url>")
        sys.exit(1)

    url = sys.argv[1]

    intelligence = CompetitorIntelligence()
    result = await intelligence.full_analysis(url)

    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    asyncio.run(main())
