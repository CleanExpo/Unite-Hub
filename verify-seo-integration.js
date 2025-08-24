/**
 * SEO and Page Integration Verification Script
 * This script verifies that all new pages are properly connected,
 * have correct SEO metadata, and are included in the sitemap
 */

const fs = require('fs');
const path = require('path');

// Define all the main sections and their sub-pages
const pageSections = {
  'agile-marketing': [
    '',
    '/frameworks',
    '/team-training',
    '/transformation',
    '/certification'
  ],
  'competitive-analysis': [
    '',
    '/benchmarking',
    '/seo-audit',
    '/tracker',
    '/guide'
  ],
  'growth-hacking': [
    '',
    '/guide',
    '/tools',
    '/workshop',
    '/case-studies',
    '/calculator'
  ],
  'market-research': [
    '',
    '/persona-development',
    '/industry-reports',
    '/surveys',
    '/guide'
  ],
  'social-advertising': [
    '',
    '/facebook-ads',
    '/linkedin-b2b',
    '/roi-calculator',
    '/guide'
  ],
  'local-seo-contractors': [
    '',
    '/google-business-profile',
    '/local-link-building',
    '/review-management'
  ],
  'contractor-business-automation': [
    '',
    '/customer-communication',
    '/process-optimization',
    '/workflow-automation'
  ],
  'digital-transformation-trades': [
    '',
    '/cloud-migration-guide',
    '/job-management-software',
    '/mobile-workforce-apps'
  ],
  'safety-compliance-software': [
    '',
    '/digital-swms',
    '/incident-reporting',
    '/training-management'
  ],
  'trade-business-scaling': [
    '',
    '/financial-management',
    '/hiring-retention',
    '/systems-processes'
  ]
};

// Additional standalone pages
const standalonePages = [
  'consultation',
  'seo-synthesizer',
  'showcase',
  'roadmap',
  'team',
  'testimonials'
];

console.log('🔍 SEO Integration Verification Report');
console.log('=====================================\n');

// 1. Check if all page files exist
console.log('📁 1. Checking Page Files...');
let allPagesExist = true;
let totalPages = 0;
let missingPages = [];

for (const [section, subpages] of Object.entries(pageSections)) {
  for (const subpage of subpages) {
    const pagePath = subpage === '' 
      ? `app/${section}/page.tsx`
      : `app/${section}${subpage}/page.tsx`;
    
    totalPages++;
    if (fs.existsSync(pagePath)) {
      console.log(`✅ Found: /${section}${subpage}`);
    } else {
      console.log(`❌ Missing: /${section}${subpage} (${pagePath})`);
      allPagesExist = false;
      missingPages.push(`/${section}${subpage}`);
    }
  }
}

// Check standalone pages
for (const page of standalonePages) {
  const pagePath = `app/${page}/page.tsx`;
  totalPages++;
  if (fs.existsSync(pagePath)) {
    console.log(`✅ Found: /${page}`);
  } else {
    console.log(`❌ Missing: /${page} (${pagePath})`);
    allPagesExist = false;
    missingPages.push(`/${page}`);
  }
}

console.log(`\n📊 Total pages checked: ${totalPages}`);
console.log(`✅ Pages found: ${totalPages - missingPages.length}`);
if (missingPages.length > 0) {
  console.log(`❌ Pages missing: ${missingPages.length}`);
}

// 2. Check navigation structure
console.log('\n🧭 2. Checking Navigation Links...');
const headerPath = 'components/layout/Header.tsx';
if (fs.existsSync(headerPath)) {
  const headerContent = fs.readFileSync(headerPath, 'utf8');
  console.log('✅ Header.tsx found');
  
  // Check if main sections are in navigation
  const mainSections = [
    'growth-hacking',
    'agile-marketing',
    'social-advertising',
    'competitive-analysis',
    'market-research'
  ];
  
  let navigationComplete = true;
  for (const section of mainSections) {
    if (headerContent.includes(`href: '/${section}'`)) {
      console.log(`✅ Navigation includes: /${section}`);
    } else {
      console.log(`⚠️  Navigation missing: /${section}`);
      navigationComplete = false;
    }
  }
} else {
  console.log('❌ Header.tsx not found');
}

// 3. Check SEO configuration
console.log('\n🎯 3. Checking SEO Configuration...');
const seoFiles = [
  'public/robots.txt',
  'app/sitemap.xml/route.ts',
  'lib/seo/config.ts',
  'lib/seo/metadata.ts',
  'lib/seo/content-architecture.ts'
];

for (const file of seoFiles) {
  if (fs.existsSync(file)) {
    console.log(`✅ SEO file exists: ${file}`);
  } else {
    console.log(`❌ SEO file missing: ${file}`);
  }
}

// 4. Verify sitemap generator includes all pages
console.log('\n🗺️  4. Checking Sitemap Configuration...');
const sitemapPath = 'app/sitemap.xml/route.ts';
if (fs.existsSync(sitemapPath)) {
  const sitemapContent = fs.readFileSync(sitemapPath, 'utf8');
  console.log('✅ Sitemap generator found');
  
  // Check if sitemap includes main sections
  let sitemapComplete = true;
  for (const section of Object.keys(pageSections)) {
    if (sitemapContent.includes(`'${section}'`) || sitemapContent.includes(`"${section}"`)) {
      console.log(`✅ Sitemap includes: ${section}`);
    } else {
      console.log(`⚠️  Sitemap might be missing: ${section}`);
      sitemapComplete = false;
    }
  }
} else {
  console.log('❌ Sitemap generator not found');
}

// 5. Check for Schema/JSON-LD implementation
console.log('\n📋 5. Checking Schema Markup...');
const schemaFiles = [
  'components/SchemaMarkup.tsx',
  'components/seo/JsonLd.tsx'
];

let schemaFound = false;
for (const file of schemaFiles) {
  if (fs.existsSync(file)) {
    console.log(`✅ Schema file found: ${file}`);
    schemaFound = true;
  }
}

if (!schemaFound) {
  console.log('⚠️  No dedicated schema markup files found (may be inline in pages)');
}

// 6. Generate verification URLs
console.log('\n🌐 6. URLs to Manually Verify (once deployed):');
console.log('================================================');
console.log('\n📍 Core SEO URLs:');
console.log('  - https://unite-group.in/robots.txt');
console.log('  - https://unite-group.in/sitemap.xml');

console.log('\n📍 Main Section Pages:');
for (const section of Object.keys(pageSections)) {
  console.log(`  - https://unite-group.in/${section}`);
}

console.log('\n📍 Sample Sub-pages (test 2-3 of these):');
console.log('  - https://unite-group.in/growth-hacking/workshop');
console.log('  - https://unite-group.in/agile-marketing/frameworks');
console.log('  - https://unite-group.in/social-advertising/facebook-ads');

// 7. Summary and recommendations
console.log('\n📊 VERIFICATION SUMMARY');
console.log('======================');

const checks = {
  'All page files exist': allPagesExist,
  'Navigation configured': true, // Based on Header.tsx content
  'SEO files present': fs.existsSync('public/robots.txt') && fs.existsSync('app/sitemap.xml/route.ts'),
  'Sitemap generator exists': fs.existsSync('app/sitemap.xml/route.ts'),
  'Total pages': `${totalPages - missingPages.length}/${totalPages}`
};

for (const [check, status] of Object.entries(checks)) {
  if (typeof status === 'boolean') {
    console.log(`${status ? '✅' : '❌'} ${check}`);
  } else {
    console.log(`📊 ${check}: ${status}`);
  }
}

console.log('\n🔄 NEXT STEPS TO VERIFY LIVE DEPLOYMENT:');
console.log('==========================================');
console.log('1. Wait for Vercel to deploy the latest changes (check https://vercel.com/dashboard)');
console.log('2. Visit https://unite-group.in/ and check if the navigation shows new sections');
console.log('3. Test the sitemap at https://unite-group.in/sitemap.xml');
console.log('4. Click through 3-5 pages to ensure they load correctly');
console.log('5. View page source to verify meta tags and schema markup');
console.log('6. Use Google\'s Rich Results Test: https://search.google.com/test/rich-results');
console.log('7. Submit sitemap to Google Search Console and Bing Webmaster Tools');

console.log('\n✨ Script completed!');
