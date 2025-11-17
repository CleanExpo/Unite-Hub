# Unite-Group Agency Schema.org Implementation Guide

## Overview

This guide explains how to implement the Schema.org structured data for **Unite-Group Agency** (the website building/marketing services business), as distinct from **Unite-Hub** (the CRM/automation platform product).

---

## Two Separate Brands

### Unite-Hub (CRM Platform)
- **What**: SaaS product for CRM and marketing automation
- **Schema Location**: `src/components/StructuredData.tsx` + `src/app/layout.tsx`
- **Schema Types**: Organization, WebSite, SoftwareApplication, Service
- **Status**: ✅ Already implemented in this repository

### Unite-Group Agency (Marketing Services)
- **What**: AI-driven marketing agency offering website building and SEO services
- **Schema Template**: `docs/unite-group-agency-schema-template.json`
- **Schema Types**: Organization, WebSite, Service, HowTo, Person (Author)
- **Status**: 📄 Template ready, needs implementation in separate website

---

## Schema Template Breakdown

### 1. Organization Schema (E-E-A-T Foundation)

**Purpose**: Establishes your business identity for Google's "Experience, Expertise, Authoritativeness, Trustworthiness" ranking factors.

**Required Fields**:
```json
{
  "@type": "Organization",
  "name": "Unite-Group Agency",
  "url": "https://www.unite-group.in/",
  "logo": "https://www.unite-group.in/images/logo.png",
  "description": "The Autonomous AI-Driven Marketing Agency...",
  "sameAs": [
    "https://www.linkedin.com/company/unite-group-agency",
    "https://twitter.com/unitegroup",
    "https://facebook.com/unitegroup"
  ],
  "contactPoint": {
    "@type": "ContactPoint",
    "email": "contact@unite-group.in",
    "contactType": "Customer Support"
  }
}
```

**Action Items**:
- [ ] Upload logo to `/images/logo.png`
- [ ] Add LinkedIn company page URL
- [ ] Add Twitter/X profile URL
- [ ] Add Facebook page URL
- [ ] Verify contact email is monitored

---

### 2. WebSite Schema

**Purpose**: Defines your web property and enables site-wide search features.

**Optional Enhancement** (Search Action):
```json
{
  "@type": "WebSite",
  "potentialAction": {
    "@type": "SearchAction",
    "target": "https://www.unite-group.in/search?q={search_term_string}",
    "query-input": "required name=search_term_string"
  }
}
```

**Action Items**:
- [ ] Implement site search if not present
- [ ] Add search action markup if search exists

---

### 3. Service Schema (Pillar Pages)

**Purpose**: Defines your core offerings for service-based search results.

**Pillar Page Strategy**:
1. **Identify 3-5 core services** (e.g., "AI Website Building", "SEO Services", "Local Marketing")
2. **Create dedicated pillar pages** for each service
3. **Add Service schema** to each pillar page

**Example Implementation**:

**File**: `pages/services/ai-website-building.tsx` (or `.html`)

```tsx
export default function AIWebsiteBuilding() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Service",
            "@id": "https://www.unite-group.in/services/ai-website-building#service",
            "serviceType": "Autonomous AI-Driven Website Building",
            "name": "AI-Powered Website Building Platform",
            "description": "Self-service platform for building high-converting websites with AI assistance and full client control.",
            "provider": {
              "@id": "https://www.unite-group.in/#organization"
            },
            "areaServed": {
              "@type": "Place",
              "name": "India"
            },
            "hasOfferCatalog": {
              "@type": "OfferCatalog",
              "name": "Website Building Features",
              "itemListElement": [
                {
                  "@type": "Offer",
                  "itemOffered": {
                    "@type": "Service",
                    "name": "LLM-Augmented SEO Strategy Builder",
                    "description": "AI-powered tool for generating comprehensive SEO strategies"
                  }
                },
                {
                  "@type": "Offer",
                  "itemOffered": {
                    "@type": "Service",
                    "name": "Client-Controlled Website Local Categorization",
                    "description": "Self-service tool for optimizing local search visibility"
                  }
                }
              ]
            }
          })
        }}
      />
      {/* Your page content */}
    </>
  );
}
```

**Action Items**:
- [ ] List all core services
- [ ] Create pillar page for each service
- [ ] Customize Service schema for each page
- [ ] Update `serviceType`, `name`, `description`, `hasOfferCatalog`

---

### 4. HowTo Schema (Sub-Pillar Pages) ⭐ CRITICAL FOR SEO

**Purpose**: Targets "how to" queries and enables rich results (featured snippets, step-by-step guides).

**Why It's Critical**:
- **GEO (Generative Engine Optimization)**: HowTo content is prioritized by AI search engines (ChatGPT, Bard, Bing Chat)
- **Featured Snippets**: Google displays HowTo steps directly in search results
- **Answer-First Strategy**: Positions your content as the authoritative answer

**Sub-Pillar Page Strategy**:
1. **Identify 10-15 "how to" queries** related to each pillar service
2. **Create sub-pillar pages** answering each query
3. **Structure with HowTo schema** for rich results

**Example Queries for "AI Website Building" Pillar**:
- How to implement local categorization for SEO
- How to build a website with AI assistance
- How to optimize website speed using AI tools
- How to create content with LLM augmentation
- How to set up automated A/B testing

**Example Implementation**:

**File**: `pages/guides/how-to-implement-local-categorization.tsx`

```tsx
export default function LocalCategorizationGuide() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "HowTo",
            "@id": "https://www.unite-group.in/guides/local-categorization#howto",
            "name": "How to Implement Local Categorization for SEO",
            "description": "Step-by-step guide using Unite-Group's platform to dominate local search rankings with AI-powered categorization.",
            "estimatedCost": {
              "@type": "MonetaryAmount",
              "currency": "INR",
              "value": "0" // Free guide, or add subscription cost
            },
            "totalTime": "PT15M", // 15 minutes
            "tool": [
              {
                "@type": "HowToTool",
                "name": "Unite-Group Categorization Builder"
              },
              {
                "@type": "HowToTool",
                "name": "LLM Geo-Niche Generator"
              }
            ],
            "supply": [
              {
                "@type": "HowToSupply",
                "name": "Business Domain and Login"
              },
              {
                "@type": "HowToSupply",
                "name": "5 minutes of client's time"
              }
            ],
            "step": [
              {
                "@type": "HowToStep",
                "position": 1,
                "name": "Step 1: Define Target Area",
                "text": "Navigate to the Local Categorization module and enter your 5 most important service suburbs.",
                "url": "https://www.unite-group.in/guides/local-categorization#step-1",
                "image": "https://www.unite-group.in/images/guides/step-1-screenshot.png"
              },
              {
                "@type": "HowToStep",
                "position": 2,
                "name": "Step 2: Augment with LLM",
                "text": "Click 'Augment' to use our integrated LLM (GPT-4o/Claude) to identify the highest-intent keywords for those areas.",
                "url": "https://www.unite-group.in/guides/local-categorization#step-2",
                "image": "https://www.unite-group.in/images/guides/step-2-screenshot.png"
              },
              {
                "@type": "HowToStep",
                "position": 3,
                "name": "Step 3: Review and Approve Categories",
                "text": "The AI generates 20-30 geo-specific categories. Review the suggestions and approve the most relevant ones with a single click.",
                "url": "https://www.unite-group.in/guides/local-categorization#step-3",
                "image": "https://www.unite-group.in/images/guides/step-3-screenshot.png"
              },
              {
                "@type": "HowToStep",
                "position": 4,
                "name": "Step 4: Auto-Deploy to Website",
                "text": "Click 'Deploy' to automatically create optimized landing pages for each category, complete with schema markup and local SEO optimization.",
                "url": "https://www.unite-group.in/guides/local-categorization#step-4",
                "image": "https://www.unite-group.in/images/guides/step-4-screenshot.png"
              }
            ]
          })
        }}
      />
      {/* Your guide content */}
      <article>
        <h1>How to Implement Local Categorization for SEO</h1>
        <section id="step-1">
          <h2>Step 1: Define Target Area</h2>
          {/* Step content */}
        </section>
        {/* More steps... */}
      </article>
    </>
  );
}
```

**HowTo Best Practices**:
1. ✅ **Include 3-7 steps** (Google's sweet spot for featured snippets)
2. ✅ **Add images/screenshots** for each step (improves rich result eligibility)
3. ✅ **Use clear, actionable language** (starts with verbs: Navigate, Click, Enter, Review)
4. ✅ **Add `totalTime` duration** (helps users decide if they can complete it now)
5. ✅ **Specify tools and supplies** (shows users what they need upfront)
6. ✅ **Link to step anchors** (`url: "#step-1"`) for deep linking

**Action Items**:
- [ ] Brainstorm 10+ "how to" queries per pillar service
- [ ] Create sub-pillar pages for each query
- [ ] Write 3-7 clear, actionable steps
- [ ] Take screenshots for each step
- [ ] Implement HowTo schema on each page

---

### 5. Person Schema (Author Markup) - E-E-A-T

**Purpose**: Establishes author expertise and credentials for content.

**When to Use**:
- Blog posts
- How-to guides
- Case studies
- Thought leadership content

**Example Implementation**:

**File**: Create author profile pages first: `pages/authors/john-doe.tsx`

```tsx
export default function AuthorProfile() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Person",
            "@id": "https://www.unite-group.in/authors/john-doe#person",
            "name": "John Doe",
            "jobTitle": "LLM Workflow Architect",
            "worksFor": {
              "@id": "https://www.unite-group.in/#organization"
            },
            "url": "https://www.unite-group.in/authors/john-doe",
            "image": "https://www.unite-group.in/images/authors/john-doe.jpg",
            "sameAs": [
              "https://www.linkedin.com/in/johndoe",
              "https://twitter.com/johndoe"
            ],
            "knowsAbout": [
              "AI Marketing",
              "SEO Optimization",
              "Local Search",
              "LLM Integration",
              "Website Development"
            ],
            "alumniOf": {
              "@type": "Organization",
              "name": "Stanford University"
            }
          })
        }}
      />
      {/* Author bio, portfolio, articles */}
    </>
  );
}
```

**Then reference in articles**:

```json
{
  "@type": "Article",
  "author": {
    "@id": "https://www.unite-group.in/authors/john-doe#person"
  }
}
```

**Action Items**:
- [ ] List all content authors
- [ ] Create author profile pages
- [ ] Add author photos (professional headshots)
- [ ] Link to LinkedIn/Twitter profiles
- [ ] Add `knowsAbout` expertise areas
- [ ] Reference authors in all content

---

## Implementation Checklist

### Phase 1: Foundation (Week 1)
- [ ] Add Organization schema to homepage
- [ ] Add WebSite schema to homepage
- [ ] Upload logo and brand assets
- [ ] Set up social media profiles
- [ ] Verify contact email

### Phase 2: Service Pages (Week 2-3)
- [ ] Identify 3-5 core services
- [ ] Create pillar pages for each service
- [ ] Implement Service schema on each pillar page
- [ ] Define OfferCatalog for each service
- [ ] Optimize page content for target keywords

### Phase 3: HowTo Guides (Week 4-6) ⭐ PRIORITY
- [ ] Brainstorm 10-15 "how to" queries per service (30-75 total)
- [ ] Prioritize top 20 highest-value queries
- [ ] Create sub-pillar pages for top 20
- [ ] Write step-by-step guides (3-7 steps each)
- [ ] Take screenshots/create images for each step
- [ ] Implement HowTo schema on each guide
- [ ] Internal link guides to relevant pillar pages

### Phase 4: Author Authority (Week 7)
- [ ] Create author profile pages
- [ ] Implement Person schema for each author
- [ ] Add author bylines to all content
- [ ] Link to social proof (LinkedIn, Twitter)
- [ ] Add expertise areas (`knowsAbout`)

### Phase 5: Validation & Optimization (Week 8)
- [ ] Test all pages with Google Rich Results Test
- [ ] Fix any schema validation errors
- [ ] Submit pages to Google Search Console
- [ ] Monitor for featured snippets
- [ ] Track rankings for target keywords

---

## Testing Your Schema

### 1. Google Rich Results Test
**URL**: https://search.google.com/test/rich-results

**Steps**:
1. Enter your page URL
2. Click "Test URL"
3. Review detected schema types
4. Fix any errors or warnings

**What to Look For**:
- ✅ All schema types detected (Organization, Service, HowTo, etc.)
- ✅ No errors (red indicators)
- ⚠️ Resolve warnings (yellow indicators) if possible
- ✅ Preview how your page appears in search results

### 2. Schema Markup Validator
**URL**: https://validator.schema.org/

**Steps**:
1. Paste your JSON-LD code
2. Click "Run Test"
3. Review validation results

**What to Look For**:
- ✅ Valid JSON syntax
- ✅ All required properties present
- ✅ Correct data types (string, number, URL, etc.)

### 3. Google Search Console
**URL**: https://search.google.com/search-console

**Steps**:
1. Add your website property
2. Go to "Enhancements" section
3. Check "Unparsable structured data"
4. Monitor "Valid items" count

---

## SEO Impact Expectations

### Short-Term (1-3 Months)
- **Rich Results**: Service and HowTo pages eligible for rich snippets
- **CTR Improvement**: 20-30% increase in click-through rate from rich results
- **Indexing Speed**: Faster crawling and indexing by Google

### Mid-Term (3-6 Months)
- **Featured Snippets**: HowTo guides appear in position 0
- **Knowledge Graph**: Organization appears in branded searches
- **GEO Visibility**: Content appears in AI search engines (ChatGPT, Bard)

### Long-Term (6-12 Months)
- **Authority Boost**: E-E-A-T signals improve domain authority
- **Local Rankings**: Service pages rank for geo-modified queries
- **Topical Authority**: HowTo guides establish expertise clusters

---

## GEO (Generative Engine Optimization) Strategy

### Why HowTo Schema is Critical for GEO

**AI Search Engines Prioritize**:
1. **Structured data** (HowTo schema is machine-readable)
2. **Answer-first content** (HowTo steps provide direct answers)
3. **Authoritative sources** (Person schema establishes expertise)

**GEO Best Practices**:
1. ✅ **Use HowTo schema** on all guides
2. ✅ **Start with the answer** (don't bury the lede)
3. ✅ **Use clear, simple language** (AI models extract plain text better)
4. ✅ **Include step images** (multimodal AI models process images)
5. ✅ **Add tool/supply lists** (helps AI understand prerequisites)
6. ✅ **Link to related content** (builds topical clusters)

**Example Answer-First Structure**:

❌ **Bad** (buries the answer):
> "Local categorization is a complex topic that many businesses struggle with. In this guide, we'll explore the history of local SEO, discuss why it matters, and eventually show you how to implement it."

✅ **Good** (answer-first):
> "To implement local categorization: (1) Define your target suburbs, (2) Use an LLM to generate geo-specific keywords, (3) Create optimized landing pages. This takes 15 minutes with Unite-Group's platform. Here's exactly how..."

---

## Advanced Schema Types (Future Enhancements)

### FAQPage Schema
**When**: Add to service pages with common questions

```json
{
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "How long does it take to build a website with Unite-Group?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Most clients complete their website in 2-3 days using our self-service platform."
      }
    }
  ]
}
```

### BreadcrumbList Schema
**When**: Add to all pages for breadcrumb navigation

```json
{
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Home",
      "item": "https://www.unite-group.in/"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "Services",
      "item": "https://www.unite-group.in/services"
    },
    {
      "@type": "ListItem",
      "position": 3,
      "name": "AI Website Building",
      "item": "https://www.unite-group.in/services/ai-website-building"
    }
  ]
}
```

### VideoObject Schema
**When**: Add to pages with tutorial videos

```json
{
  "@type": "VideoObject",
  "name": "How to Use the Local Categorization Tool",
  "description": "Video tutorial showing step-by-step local categorization setup",
  "thumbnailUrl": "https://www.unite-group.in/videos/thumbnails/local-cat.jpg",
  "uploadDate": "2025-01-15T08:00:00Z",
  "duration": "PT5M30S",
  "contentUrl": "https://www.unite-group.in/videos/local-categorization.mp4"
}
```

---

## Resources

### Official Documentation
- **Schema.org**: https://schema.org/
- **Google Search Central**: https://developers.google.com/search/docs/appearance/structured-data
- **JSON-LD Playground**: https://json-ld.org/playground/

### Validation Tools
- **Google Rich Results Test**: https://search.google.com/test/rich-results
- **Schema Markup Validator**: https://validator.schema.org/
- **Google Search Console**: https://search.google.com/search-console

### Learning Resources
- **E-E-A-T Guidelines**: https://static.googleusercontent.com/media/guidelines.raterhub.com/en//searchqualityevaluatorguidelines.pdf
- **HowTo Schema Guide**: https://developers.google.com/search/docs/appearance/structured-data/how-to
- **Service Schema Guide**: https://developers.google.com/search/docs/appearance/structured-data/local-business

---

## Support

For questions about implementing this schema:
1. Review the template: `docs/unite-group-agency-schema-template.json`
2. Check the examples in this guide
3. Test with Google Rich Results Test
4. Validate with Schema.org validator

**This guide is maintained alongside the Unite-Hub repository but is intended for the separate Unite-Group Agency website.**

---

**Last Updated**: 2025-01-17
**Version**: 1.0.0
