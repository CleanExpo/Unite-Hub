/**
 * Web Scraper Dashboard Page
 * URL: /scraper?workspaceId=...
 */

import { ScraperDashboard } from "@/components/scraper/ScraperDashboard";

export const metadata = {
  title: "Web Scraper | Unite-Hub",
  description: "Discover URLs, scrape content, extract data for article research",
};

export default function ScraperPage() {
  return (
    <main>
      <ScraperDashboard />
    </main>
  );
}
