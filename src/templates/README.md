# Modern Blog Post Template

A comprehensive, SEO-optimized blog post template built with React, TypeScript, and TailwindCSS. Features advanced SEO capabilities, responsive design, and rich content components.

## 🚀 Features

### ✅ **SEO Optimization**
- **Meta Tags**: Complete meta tag implementation
- **Open Graph**: Social media sharing optimization
- **JSON-LD**: Structured data for search engines
- **LLM SEO Optimization**: AI-powered content analysis
- **Canonical URLs**: Duplicate content prevention
- **Twitter Cards**: Enhanced Twitter sharing

### ✅ **Responsive Design**
- **Mobile-First**: Optimized for all device sizes
- **Touch-Friendly**: Enhanced mobile interactions
- **Progressive Enhancement**: Graceful degradation
- **Accessibility**: WCAG 2.1 AA compliant

### ✅ **Rich Content Features**
- **Charts & Graphs**: Chart.js integration
- **Code Blocks**: Syntax highlighting with copy functionality
- **Callouts**: Info, warning, success, and tip boxes
- **Image Optimization**: Next.js Image component
- **Social Sharing**: Native Web Share API

### ✅ **Modern UX**
- **Dark Mode**: Automatic theme switching
- **Scroll to Top**: Smooth scrolling
- **Engagement**: Like and share buttons
- **Related Posts**: Content discovery
- **Author Bio**: Professional author sections

## 📁 File Structure

```
src/templates/
├── ModernBlogPostTemplate.tsx    # Main template component
├── examples/
│   └── BlogPostExample.tsx       # Complete usage example
└── README.md                     # This documentation
```

## 🛠 Installation

### 1. Copy Template Files

```bash
# Copy the template files to your project
cp src/templates/ModernBlogPostTemplate.tsx your-project/src/components/
cp src/templates/examples/BlogPostExample.tsx your-project/src/examples/
```

### 2. Install Dependencies

```bash
# Core dependencies
npm install react react-dom next typescript

# Chart.js for data visualization
npm install react-chartjs-2 chart.js

# Icons (Lucide React)
npm install lucide-react

# Styling (TailwindCSS)
npm install -D tailwindcss postcss autoprefixer
```

### 3. Configure TailwindCSS

Add to your `tailwind.config.js`:

```javascript
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      typography: {
        DEFAULT: {
          css: {
            maxWidth: 'none',
          },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
```

## 📝 Basic Usage

### Simple Blog Post

```tsx
import React from 'react';
import ModernBlogPostTemplate, { BlogPostMeta } from './ModernBlogPostTemplate';

const meta: BlogPostMeta = {
  title: "Your Blog Post Title",
  description: "Your blog post description",
  author: {
    name: "Author Name",
    avatar: "/path/to/avatar.jpg",
    bio: "Author biography",
    social: {
      twitter: "username",
      linkedin: "https://linkedin.com/in/username",
      github: "username"
    }
  },
  publishDate: "2024-12-06T09:00:00Z",
  readingTime: 10,
  category: "Technology",
  tags: ["React", "TypeScript", "Tutorial"],
  featuredImage: {
    url: "/path/to/featured-image.jpg",
    alt: "Featured image description"
  },
  seo: {
    keywords: ["react", "typescript", "tutorial"],
  },
  openGraph: {
    type: "article"
  },
  jsonLd: {
    type: "BlogPosting",
    headline: "Your Blog Post Title",
    description: "Your blog post description",
    author: "Author Name",
    datePublished: "2024-12-06T09:00:00Z",
    image: ["/path/to/featured-image.jpg"]
  }
};

const BlogContent = () => (
  <>
    <h2>Your Content Here</h2>
    <p>Write your blog content using standard HTML or JSX.</p>
  </>
);

export default function YourBlogPost() {
  return (
    <ModernBlogPostTemplate
      meta={meta}
      content={<BlogContent />}
    />
  );
}
```

### Advanced Usage with Charts

```tsx
import { Callout, CodeBlock, BlogChart } from './ModernBlogPostTemplate';

const charts = [
  {
    type: 'line' as const,
    title: 'Performance Metrics',
    data: {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
      datasets: [{
        label: 'Page Views',
        data: [1200, 1900, 3000, 5000, 2300],
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
      }]
    }
  }
];

const BlogContent = () => (
  <>
    <h2>Introduction</h2>
    <p>Your introduction content...</p>

    <Callout type="tip" title="Pro Tip">
      This is a helpful tip for your readers.
    </Callout>

    <h3>Code Example</h3>
    <CodeBlock language="typescript" title="Example Component">
{`function ExampleComponent() {
  return <div>Hello World!</div>;
}`}
    </CodeBlock>

    <h3>Data Analysis</h3>
    <p>Here's our performance data:</p>
  </>
);

export default function AdvancedBlogPost() {
  return (
    <ModernBlogPostTemplate
      meta={meta}
      content={<BlogContent />}
      charts={charts}
      relatedPosts={relatedPosts}
    />
  );
}
```

## 🎨 Component Reference

### Callout Component

Creates highlighted information boxes:

```tsx
<Callout type="info" title="Information">
  This is an informational callout.
</Callout>

<Callout type="warning" title="Warning">
  This is a warning callout.
</Callout>

<Callout type="success" title="Success">
  This is a success callout.
</Callout>

<Callout type="tip" title="Pro Tip">
  This is a tip callout.
</Callout>
```

### CodeBlock Component

Displays syntax-highlighted code with copy functionality:

```tsx
<CodeBlock language="javascript" title="Example Function">
{`function greet(name) {
  return \`Hello, \${name}!\`;
}`}
</CodeBlock>
```

**Supported languages**: javascript, typescript, html, css, bash, python, and more.

### BlogChart Component

Renders interactive charts:

```tsx
const chartData = {
  type: 'bar' as const,
  title: 'Monthly Sales',
  description: 'Sales data for the past 6 months',
  data: {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [{
      label: 'Sales ($)',
      data: [12000, 19000, 15000, 25000, 22000, 30000],
      backgroundColor: 'rgba(59, 130, 246, 0.8)'
    }]
  }
};

<BlogChart {...chartData} />
```

**Chart types**: `line`, `bar`, `pie`

## 🔧 Configuration

### SEO Optimization

#### Meta Tags
```tsx
seo: {
  metaTitle: "Custom SEO title (optional)",
  metaDescription: "Custom SEO description (optional)",
  keywords: ["keyword1", "keyword2", "keyword3"],
  canonicalUrl: "https://yourdomain.com/blog/post-slug"
}
```

#### Open Graph
```tsx
openGraph: {
  title: "Social media title",
  description: "Social media description",
  image: "/path/to/og-image.jpg",
  type: "article" // or "website"
}
```

#### JSON-LD Structured Data
```tsx
jsonLd: {
  type: "BlogPosting", // or "Article"
  headline: "Main headline",
  description: "Article description",
  author: "Author Name",
  datePublished: "2024-12-06T09:00:00Z",
  dateModified: "2024-12-06T15:30:00Z", // optional
  image: [
    "/path/to/image1.jpg",
    "/path/to/image2.jpg"
  ]
}
```

### Author Configuration
```tsx
author: {
  name: "Author Name",
  avatar: "/path/to/avatar.jpg",
  bio: "Short author biography",
  social: {
    twitter: "username", // without @
    linkedin: "https://linkedin.com/in/username",
    github: "username"
  }
}
```

### Related Posts
```tsx
const relatedPosts = [
  {
    title: "Related Post Title",
    slug: "/blog/related-post-slug",
    excerpt: "Brief description of the related post",
    image: "/path/to/thumbnail.jpg",
    readingTime: 5
  }
];
```

## 🎯 LLM SEO Optimization

The template includes AI-powered SEO optimization tools:

```tsx
import { optimizeContentForSEO } from './ModernBlogPostTemplate';

const contentAnalysis = optimizeContentForSEO(
  "Your blog content as a string",
  ["target", "keywords", "list"]
);

console.log(contentAnalysis);
// Returns:
// {
//   keywordDensity: [...],
//   readabilityScore: 85,
//   headingStructure: {...},
//   recommendations: [...]
// }
```

### SEO Features:
- **Keyword Density Analysis**: Optimal 1.5% density tracking
- **Readability Score**: Flesch Reading Ease calculation
- **Heading Structure**: H1-H6 hierarchy analysis
- **Content Recommendations**: AI-generated improvement suggestions

## 🎨 Styling & Theming

### Dark Mode
The template automatically supports dark mode through Tailwind's `dark:` classes.

### Custom Styling
Override styles by modifying Tailwind classes or adding custom CSS:

```css
/* Custom blog styles */
.blog-custom {
  @apply your-custom-classes;
}
```

### Typography
Uses Tailwind Typography plugin for consistent text styling:

```tsx
<div className="prose prose-lg dark:prose-invert max-w-none">
  {content}
</div>
```

## 📱 Responsive Breakpoints

- **Mobile**: `< 768px` - Single column, large touch targets
- **Tablet**: `768px - 1024px` - Optimized for touch interaction
- **Desktop**: `> 1024px` - Full feature set with hover states

## ♿ Accessibility Features

- **ARIA Labels**: Comprehensive screen reader support
- **Keyboard Navigation**: Full keyboard accessibility
- **Focus Management**: Visible focus indicators
- **Color Contrast**: WCAG 2.1 AA compliant
- **Alternative Text**: Image alt text requirements

## 🚀 Performance Optimizations

- **Image Optimization**: Next.js Image component with lazy loading
- **Code Splitting**: Dynamic imports for charts
- **Minimal Bundle**: Tree-shaking optimized
- **Caching**: Browser caching headers
- **Compression**: Gzip/Brotli ready

## 🔍 SEO Best Practices

### Content Structure
1. **H1**: Use only one H1 per page (title)
2. **H2-H6**: Logical heading hierarchy
3. **Meta Description**: 150-160 characters
4. **Title Tag**: 50-60 characters
5. **Alt Text**: Descriptive image alternatives

### Schema Markup
- **BlogPosting**: Complete article schema
- **Author**: Person schema for author
- **Organization**: Publisher information
- **WebPage**: Page-level schema

### Social Sharing
- **Open Graph**: Facebook/LinkedIn optimization
- **Twitter Cards**: Enhanced Twitter previews
- **Structured Data**: Rich search results

## 🐛 Troubleshooting

### Common Issues

**Chart.js not rendering:**
```bash
npm install --save-dev @types/chart.js
```

**TypeScript errors:**
Ensure all peer dependencies are installed:
```bash
npm install @types/react @types/react-dom
```

**Styling issues:**
Verify TailwindCSS configuration includes the template paths:
```javascript
content: ['./src/**/*.{js,ts,jsx,tsx}']
```

**Image optimization errors:**
Configure Next.js for external images:
```javascript
// next.config.js
module.exports = {
  images: {
    domains: ['yourdomain.com'],
  },
}
```

## 📄 License

This template is provided under the MIT License. Feel free to use, modify, and distribute in your projects.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues and enhancement requests.

---

**Built with ❤️ using React, TypeScript, and TailwindCSS**
