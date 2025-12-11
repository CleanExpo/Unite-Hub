import Script from 'next/script';

export function SynthexVideoJsonLd() {
  // NOTE: This generates the current date. For production, you might want to set a static date.
  const uploadDate = new Date().toISOString();

  const videoSchema = {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    'name': 'Synthex Autonomous Marketing Platform Demo',
    'description': 'A brief demonstration of the Synthex platform enabling autonomous mode for SEO, GBP, and social media tasks for a small business.',
    'thumbnailUrl': 'https://www.synthex.social/videos/synthex-hero.jpg',
    'uploadDate': uploadDate,
    'contentUrl': 'https://www.synthex.social/videos/synthex-hero.mp4',
    'contentLocation': 'Australia',
    'publisher': {
      '@type': 'Organization',
      'name': 'Synthex',
      'logo': {
        '@type': 'ImageObject',
        'url': 'https://www.synthex.social/logo.png' // IMPORTANT: Make sure this path is correct
      }
    }
  };

  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    'url': 'https://www.synthex.social',
    'logo': 'https://www.synthex.social/logo.png' // IMPORTANT: Make sure this path is correct
  };

  return (
    <>
      <Script
        id="synthex-video-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(videoSchema) }}
      />
      <Script
        id="synthex-organization-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
    </>
  );
}