export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        disallow: ['/dashboard', '/api'],
      },
    ],
    sitemap: 'https://unite-group.in/sitemap.xml',
  }
}
