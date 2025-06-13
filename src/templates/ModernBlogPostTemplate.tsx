import React from 'react';

export interface BlogPostMeta {
  title: string;
  description: string;
  author: {
    name: string;
    avatar: string;
    bio: string;
    social: {
      twitter: string;
      linkedin: string;
      github: string;
    };
  };
  publishDate: string;
  updatedDate: string;
  readingTime: number;
  category: string;
  tags: string[];
  featuredImage: {
    url: string;
    alt: string;
    caption: string;
  };
  seo: {
    metaTitle: string;
    metaDescription: string;
    keywords: string[];
    canonicalUrl: string;
  };
  openGraph: {
    title: string;
    description: string;
    image: string;
    type: string;
  };
  jsonLd: {
    type: string;
    headline: string;
    description: string;
    author: string;
    datePublished: string;
    dateModified: string;
    image: string[];
  };
}

interface CalloutProps {
  type: 'tip' | 'warning' | 'success' | 'error';
  title: string;
  children: React.ReactNode;
}

export const Callout: React.FC<CalloutProps> = ({ type, title, children }) => {
  return (
    <div className={`callout callout-${type}`}>
      <h4>{title}</h4>
      <div>{children}</div>
    </div>
  );
};

interface CodeBlockProps {
  language: string;
  title: string;
  children: React.ReactNode;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({ language, title, children }) => {
  return (
    <div className="code-block">
      <h5>{title}</h5>
      <pre className={`language-${language}`}>
        <code>{children}</code>
      </pre>
    </div>
  );
};

interface BlogChartProps {
  type: 'line' | 'bar' | 'pie';
  title: string;
  description: string;
  data: any;
  options?: any;
}

export const BlogChart: React.FC<BlogChartProps> = ({ type, title, description, data, options }) => {
  return (
    <div className="blog-chart">
      <h4>{title}</h4>
      <p>{description}</p>
      {/* Chart implementation would go here */}
    </div>
  );
};

interface ModernBlogPostTemplateProps {
  meta: BlogPostMeta;
  content: React.ReactNode;
}

const ModernBlogPostTemplate: React.FC<ModernBlogPostTemplateProps> = ({ meta, content }) => {
  return (
    <article className="blog-post">
      <header>
        <h1>{meta.title}</h1>
        <div className="meta">
          <img src={meta.author.avatar} alt={meta.author.name} />
          <div>
            <h2>{meta.author.name}</h2>
            <p>{meta.author.bio}</p>
          </div>
        </div>
      </header>
      <main>{content}</main>
    </article>
  );
};

export default ModernBlogPostTemplate;