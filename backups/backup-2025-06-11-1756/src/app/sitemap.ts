export default function Sitemap() {
  return (
    // This should be a proper sitemap XML
    // Here's a minimal example:
    `<?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.90">
      <url>
        <loc>https://unite-group.in</loc>
        <lastmod>2025-06-10</lastmod>
        <changefreq>yearly</changefreq>
        <priority>1.0</priority>
      </url>
      <url>
        <loc>https://unite-group.in/about</loc>
        <lastmod>2025-06-01</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.8</priority>
      </url>
      <url>
        <loc>https://unite-group.in/contact</loc>
        <lastmod>2025-05-25</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.8</priority>
      </url>
      <url>
        <loc>https://unite-group.in/services</loc>
        <lastmod>2025-05-20</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.8</priority>
      </url>
    </urlset>`
  )
}
