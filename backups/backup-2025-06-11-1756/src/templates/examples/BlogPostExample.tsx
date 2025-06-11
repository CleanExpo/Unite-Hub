/**
 * Example Usage of ModernBlogPostTemplate
 * 
 * This file demonstrates how to use the ModernBlogPostTemplate
 * with sample data and content.
 */

import React from 'react';
import ModernBlogPostTemplate, { Callout, CodeBlock, BlogChart } from '../ModernBlogPostTemplate';
import type { BlogPostMeta } from '../ModernBlogPostTemplate';

// Sample blog post metadata
const sampleMeta: BlogPostMeta = {
  title: "Building Modern React Applications: A Comprehensive Guide",
  description: "Learn how to build scalable, performant React applications using modern best practices, TypeScript, and cutting-edge tools.",
  author: {
    name: "Sarah Johnson",
    avatar: "/images/authors/sarah-johnson.jpg",
    bio: "Senior Frontend Developer and React enthusiast with 8+ years of experience building web applications. Passionate about clean code, performance optimization, and developer experience.",
    social: {
      twitter: "sarahj_dev",
      linkedin: "https://linkedin.com/in/sarah-johnson-dev",
      github: "sarah-johnson"
    }
  },
  publishDate: "2024-12-06T09:00:00Z",
  updatedDate: "2024-12-06T15:30:00Z",
  readingTime: 12,
  category: "Frontend Development",
  tags: ["React", "TypeScript", "Performance", "Best Practices", "Modern Web"],
  featuredImage: {
    url: "/images/blog/react-modern-guide.jpg",
    alt: "Modern React development workspace with code editor and terminal",
    caption: "Setting up a modern React development environment"
  },
  seo: {
    metaTitle: "Building Modern React Applications: Complete 2024 Guide",
    metaDescription: "Master modern React development with TypeScript, performance optimization, and best practices. Includes code examples, charts, and expert insights.",
    keywords: [
      "React development",
      "TypeScript React",
      "React performance",
      "modern frontend",
      "React best practices",
      "web development 2024",
      "JavaScript frameworks"
    ],
    canonicalUrl: "https://yourblog.com/building-modern-react-applications"
  },
  openGraph: {
    title: "Building Modern React Applications: A Developer's Guide",
    description: "Learn cutting-edge React development techniques with real-world examples and performance tips.",
    image: "/images/blog/react-modern-guide-og.jpg",
    type: "article"
  },
  jsonLd: {
    type: "BlogPosting",
    headline: "Building Modern React Applications: A Comprehensive Guide",
    description: "Complete guide to modern React development with TypeScript, performance optimization, and industry best practices.",
    author: "Sarah Johnson",
    datePublished: "2024-12-06T09:00:00Z",
    dateModified: "2024-12-06T15:30:00Z",
    image: [
      "/images/blog/react-modern-guide.jpg",
      "/images/blog/react-performance-chart.jpg",
      "/images/blog/typescript-integration.jpg"
    ]
  }
};

// Sample chart data
const sampleCharts = [
  {
    type: 'line' as const,
    title: 'React Performance Metrics Over Time',
    description: 'Comparing bundle size and load times across different optimization techniques',
    data: {
      labels: ['Initial', 'Code Splitting', 'Tree Shaking', 'Compression', 'Lazy Loading'],
      datasets: [
        {
          label: 'Bundle Size (KB)',
          data: [850, 620, 580, 420, 380],
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.4
        },
        {
          label: 'Load Time (ms)',
          data: [3200, 2400, 2100, 1800, 1500],
          borderColor: 'rgb(16, 185, 129)',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          tension: 0.4
        }
      ]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  },
  {
    type: 'bar' as const,
    title: 'Framework Popularity in 2024',
    description: 'Developer survey results showing framework adoption rates',
    data: {
      labels: ['React', 'Vue.js', 'Angular', 'Svelte', 'Next.js'],
      datasets: [
        {
          label: 'Usage Percentage',
          data: [68.9, 18.8, 17.3, 9.7, 13.4],
          backgroundColor: [
            'rgba(59, 130, 246, 0.8)',
            'rgba(16, 185, 129, 0.8)',
            'rgba(239, 68, 68, 0.8)',
            'rgba(245, 158, 11, 0.8)',
            'rgba(139, 92, 246, 0.8)'
          ],
          borderColor: [
            'rgb(59, 130, 246)',
            'rgb(16, 185, 129)',
            'rgb(239, 68, 68)',
            'rgb(245, 158, 11)',
            'rgb(139, 92, 246)'
          ],
          borderWidth: 1
        }
      ]
    }
  }
];

// Sample related posts
const sampleRelatedPosts = [
  {
    title: "TypeScript Best Practices for React Developers",
    slug: "/blog/typescript-react-best-practices",
    excerpt: "Discover advanced TypeScript patterns and techniques that will make your React code more maintainable and type-safe.",
    image: "/images/blog/typescript-react.jpg",
    readingTime: 8
  },
  {
    title: "Optimizing React Performance: Beyond the Basics",
    slug: "/blog/react-performance-optimization",
    excerpt: "Deep dive into advanced React optimization techniques including virtualization, memoization, and bundle analysis.",
    image: "/images/blog/react-performance.jpg",
    readingTime: 15
  },
  {
    title: "State Management in 2024: Redux vs Context vs Zustand",
    slug: "/blog/react-state-management-2024",
    excerpt: "Compare modern state management solutions and learn when to use each approach in your React applications.",
    image: "/images/blog/state-management.jpg",
    readingTime: 10
  }
];

// Sample blog content using the utility components
const SampleBlogContent = () => {
  return (
    <>
      <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 font-medium">
        React has evolved significantly since its introduction, and building modern applications 
        requires understanding the latest patterns, tools, and best practices. This comprehensive 
        guide will walk you through everything you need to know to build production-ready React 
        applications in 2024.
      </p>

      <h2>Getting Started with Modern React</h2>
      
      <p>
        The React ecosystem has matured tremendously, offering developers powerful tools and 
        patterns for building scalable applications. Let's explore the essential concepts and 
        setup required for modern React development.
      </p>

      <Callout type="tip" title="Pro Tip">
        Always start with Create React App or Vite for new projects. These tools provide 
        optimized configurations and save hours of setup time.
      </Callout>

      <h3>Setting Up Your Development Environment</h3>

      <p>
        A well-configured development environment is crucial for productivity. Here's the 
        recommended setup for modern React development:
      </p>

      <CodeBlock language="bash" title="Project Setup">
{`# Create a new React project with TypeScript
npx create-react-app my-app --template typescript

# Or use Vite for faster development
npm create vite@latest my-app -- --template react-ts

# Install essential dependencies
npm install @types/react @types/react-dom
npm install -D tailwindcss postcss autoprefixer
npm install react-router-dom react-query zustand`}
      </CodeBlock>

      <h2>TypeScript Integration</h2>

      <p>
        TypeScript has become the standard for React development, providing type safety and 
        improved developer experience. Here's how to leverage TypeScript effectively in your 
        React components:
      </p>

      <CodeBlock language="typescript" title="React Component with TypeScript">
{`interface UserProps {
  user: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  onUserUpdate: (userId: string, data: Partial<User>) => Promise<void>;
  className?: string;
}

const UserProfile: React.FC<UserProps> = ({ 
  user, 
  onUserUpdate, 
  className = "" 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(user);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await onUserUpdate(user.id, formData);
      setIsEditing(false);
    } catch (error) {
      console.error('Update failed:', error);
    }
  };

  return (
    <div className={\`user-profile \${className}\`}>
      {/* Component content */}
    </div>
  );
};

export default UserProfile;`}
      </CodeBlock>

      <Callout type="info" title="TypeScript Benefits">
        Using TypeScript with React provides compile-time error checking, better IDE support, 
        and self-documenting code through type definitions.
      </Callout>

      <h2>Performance Optimization Strategies</h2>

      <p>
        Performance is crucial for user experience. Modern React provides several optimization 
        techniques that can significantly improve your application's performance:
      </p>

      <h3>1. Code Splitting and Lazy Loading</h3>

      <CodeBlock language="typescript" title="Lazy Loading Components">
{`import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Lazy load components
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Profile = lazy(() => import('./pages/Profile'));
const Settings = lazy(() => import('./pages/Settings'));

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<div>Loading...</div>}>
        <Routes>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}`}
      </CodeBlock>

      <h3>2. Memoization with React.memo and useMemo</h3>

      <CodeBlock language="typescript" title="Optimizing with Memoization">
{`import { memo, useMemo, useCallback } from 'react';

interface ExpensiveComponentProps {
  data: ComplexData[];
  filter: string;
  onItemClick: (id: string) => void;
}

const ExpensiveComponent = memo<ExpensiveComponentProps>(({ 
  data, 
  filter, 
  onItemClick 
}) => {
  // Memoize expensive calculations
  const filteredData = useMemo(() => {
    return data.filter(item => 
      item.name.toLowerCase().includes(filter.toLowerCase())
    ).sort((a, b) => a.priority - b.priority);
  }, [data, filter]);

  // Memoize callback functions
  const handleClick = useCallback((id: string) => {
    onItemClick(id);
  }, [onItemClick]);

  return (
    <div>
      {filteredData.map(item => (
        <div key={item.id} onClick={() => handleClick(item.id)}>
          {item.name}
        </div>
      ))}
    </div>
  );
});`}
      </CodeBlock>

      <Callout type="warning" title="Optimization Warning">
        Don't over-optimize! Use React Developer Tools Profiler to identify actual performance 
        bottlenecks before applying optimizations.
      </Callout>

      <h2>State Management in Modern React</h2>

      <p>
        State management has evolved beyond Redux. Here are the modern approaches to handling 
        state in React applications:
      </p>

      <h3>Context API for Global State</h3>

      <CodeBlock language="typescript" title="Context API Implementation">
{`import { createContext, useContext, useReducer, ReactNode } from 'react';

interface AppState {
  user: User | null;
  theme: 'light' | 'dark';
  notifications: Notification[];
}

type AppAction = 
  | { type: 'SET_USER'; payload: User }
  | { type: 'TOGGLE_THEME' }
  | { type: 'ADD_NOTIFICATION'; payload: Notification };

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
} | null>(null);

const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.payload };
    case 'TOGGLE_THEME':
      return { ...state, theme: state.theme === 'light' ? 'dark' : 'light' };
    case 'ADD_NOTIFICATION':
      return { ...state, notifications: [...state.notifications, action.payload] };
    default:
      return state;
  }
};

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};`}
      </CodeBlock>

      <h2>Testing Modern React Applications</h2>

      <p>
        Testing is crucial for maintaining code quality and preventing regressions. Here's a 
        modern approach to testing React components:
      </p>

      <CodeBlock language="typescript" title="Component Testing with React Testing Library">
{`import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UserProfile } from './UserProfile';

const mockUser = {
  id: '1',
  name: 'Unite Group Team',
  email: 'john@unite-group.in'
};

const mockOnUserUpdate = jest.fn();

describe('UserProfile', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('displays user information correctly', () => {
    render(
      <UserProfile user={mockUser} onUserUpdate={mockOnUserUpdate} />
    );

    expect(screen.getByText('Unite Group Team')).toBeInTheDocument();
    expect(screen.getByText('john@unite-group.in')).toBeInTheDocument();
  });

  it('allows editing user information', async () => {
    const user = userEvent.setup();
    
    render(
      <UserProfile user={mockUser} onUserUpdate={mockOnUserUpdate} />
    );

    // Click edit button
    await user.click(screen.getByRole('button', { name: /edit/i }));

    // Update name field
    const nameInput = screen.getByDisplayValue('Unite Group Team');
    await user.clear(nameInput);
    await user.type(nameInput, 'Unite Group Representative');

    // Submit form
    await user.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => {
      expect(mockOnUserUpdate).toHaveBeenCalledWith('1', {
        name: 'Unite Group Representative'
      });
    });
  });
});`}
      </CodeBlock>

      <Callout type="success" title="Testing Best Practices">
        Focus on testing behavior rather than implementation details. Use React Testing Library's 
        philosophy of testing components the way users interact with them.
      </Callout>

      <h2>Deployment and Production Optimization</h2>

      <p>
        Getting your React application production-ready involves several optimization steps. 
        Here's a checklist for deployment:
      </p>

      <ul>
        <li><strong>Bundle Analysis:</strong> Use webpack-bundle-analyzer to identify large dependencies</li>
        <li><strong>Code Splitting:</strong> Implement route-based and component-based splitting</li>
        <li><strong>Compression:</strong> Enable gzip/brotli compression on your server</li>
        <li><strong>Caching:</strong> Implement proper caching strategies for static assets</li>
        <li><strong>CDN:</strong> Use a CDN for faster global content delivery</li>
        <li><strong>Monitoring:</strong> Set up performance monitoring and error tracking</li>
      </ul>

      <h2>Conclusion</h2>

      <p>
        Building modern React applications requires a solid understanding of current best practices, 
        performance optimization techniques, and the evolving ecosystem. By following the patterns 
        and techniques outlined in this guide, you'll be well-equipped to build scalable, 
        maintainable React applications that provide excellent user experiences.
      </p>

      <Callout type="tip" title="Keep Learning">
        The React ecosystem evolves rapidly. Stay updated with the official React blog, follow 
        React team members on Twitter, and participate in the community to keep your skills current.
      </Callout>
    </>
  );
};

// Export the complete example
const BlogPostExample = () => {
  return (
    <ModernBlogPostTemplate
      meta={sampleMeta}
      content={<SampleBlogContent />}
      charts={sampleCharts}
      relatedPosts={sampleRelatedPosts}
    />
  );
};

export default BlogPostExample;
