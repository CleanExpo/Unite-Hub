# Component Library Documentation

Complete guide for using the Phase 2 component library with examples and best practices.

**Last Updated**: November 30, 2025
**Version**: 1.0.0
**Status**: Production Ready

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Primitives](#primitives)
3. [Sections](#sections)
4. [Layout](#layout)
5. [Patterns](#patterns)
6. [Best Practices](#best-practices)
7. [Accessibility](#accessibility)
8. [Responsive Design](#responsive-design)
9. [Design Tokens](#design-tokens)
10. [Examples](#examples)

---

## Getting Started

### Installation

All components are available in the codebase under `src/components/`:

```typescript
// Import from barrel exports
import { Button, Card, Input, Badge, Icon, Link } from '@/components/ui';
import { SectionHeader, HeroSection, BenefitsGrid } from '@/components/sections';
import { Container, Navigation, Sidebar, DashboardLayout } from '@/components/layout';
import { Table, StatsCard, ActivityFeed, Modal } from '@/components/patterns';
```

### Component Structure

All components follow this pattern:
- Use `forwardRef` for ref forwarding
- Extend `HTMLAttributes<HTMLElement>` for proper typing
- Use Tailwind utilities from design tokens (NO hardcoded values)
- Include JSDoc comments
- Set `displayName` for debugging

---

## Primitives

### Button

Core interactive button component with multiple variants and states.

**Props:**
```typescript
interface ButtonProps extends HTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md';
  isLoading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  icon?: ReactNode;
  iconRight?: ReactNode;
  children?: ReactNode;
}
```

**Usage Examples:**

```typescript
// Primary button
<Button variant="primary" size="md">
  Get Started
</Button>

// With icon
<Button variant="primary" icon={<CheckIcon />}>
  Confirm
</Button>

// Loading state
<Button isLoading>Processing...</Button>

// Full width
<Button fullWidth variant="secondary">
  Cancel
</Button>

// Small secondary
<Button variant="secondary" size="sm">
  Learn More
</Button>
```

**Features:**
- ✅ Keyboard support (Enter, Space)
- ✅ Focus ring visible
- ✅ Loading spinner animation
- ✅ Icon support (left/right)
- ✅ Full-width option
- ✅ Disabled state handling

**Design Tokens Used:**
- Colors: `bg-accent-500`, `text-white`, `hover:bg-accent-400`
- Spacing: `px-7 py-3` (md), `px-5 py-2.5` (sm)
- Shadow: `shadow-button-primary`
- Transitions: `duration-normal ease-out`

---

### Card

Container component for grouped content with optional visual enhancements.

**Props:**
```typescript
interface CardProps extends HTMLAttributes<HTMLDivElement> {
  accentBar?: boolean;
  interactive?: boolean;
  padding?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'raised';
  children?: ReactNode;
}
```

**Usage Examples:**

```typescript
// Basic card
<Card padding="md">
  <h3>Card Title</h3>
  <p>Card content goes here</p>
</Card>

// With accent bar (for benefits/features)
<Card accentBar interactive padding="lg">
  <Icon size="lg" />
  <h3>Feature Title</h3>
  <p>Feature description</p>
</Card>

// Raised variant
<Card variant="raised" padding="md">
  <p>Highlighted content</p>
</Card>
```

**Features:**
- ✅ Accent bar option (3px top border)
- ✅ Interactive mode (hover animation)
- ✅ Hover elevation
- ✅ Padding variants
- ✅ Smooth transitions

**Design Tokens Used:**
- Background: `bg-bg-card`
- Border: `border-border-subtle`
- Shadow: `shadow-card`, `hover:shadow-lg`
- Animation: `hover:-translate-y-1`

---

### Input

Text input component with error handling and optional icons.

**Props:**
```typescript
interface InputProps extends HTMLAttributes<HTMLInputElement | HTMLTextAreaElement> {
  label?: string;
  error?: boolean;
  errorMessage?: string;
  helperText?: string;
  as?: 'input' | 'textarea';
  type?: string;
  rows?: number;
  icon?: ReactNode;
  iconRight?: ReactNode;
  size?: 'sm' | 'md';
  fullWidth?: boolean;
  disabled?: boolean;
}
```

**Usage Examples:**

```typescript
// Basic input
<Input
  label="Email"
  type="email"
  placeholder="your@email.com"
/>

// With error
<Input
  label="Password"
  type="password"
  error
  errorMessage="Password must be at least 8 characters"
/>

// Textarea
<Input
  label="Message"
  as="textarea"
  rows={4}
  placeholder="Tell us about your project..."
/>

// With icons
<Input
  label="Username"
  icon={<UserIcon />}
  iconRight={<CheckIcon />}
/>

// Helper text
<Input
  label="Phone"
  type="tel"
  helperText="Format: +1 (555) 123-4567"
/>
```

**Features:**
- ✅ Label association
- ✅ Error state with message
- ✅ Helper text support
- ✅ Icon support (left/right)
- ✅ Textarea variant
- ✅ Focus ring visible
- ✅ Disabled state

**Design Tokens Used:**
- Background: `bg-input`
- Border: `border-border-subtle`, `focus:border-accent-500`
- Focus: `ring-2 ring-accent-500 ring-offset-2`
- Padding: `px-4 py-3` (md), `px-3 py-2` (sm)

---

### Badge

Small label component with semantic color variants.

**Props:**
```typescript
interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'success' | 'warning' | 'accent' | 'neutral';
  size?: 'sm' | 'md';
  dismissible?: boolean;
  onDismiss?: () => void;
  children?: ReactNode;
}
```

**Usage Examples:**

```typescript
// Status badges
<Badge variant="success">Active</Badge>
<Badge variant="warning">Pending</Badge>
<Badge variant="error">Failed</Badge>
<Badge variant="accent">Premium</Badge>

// Dismissible badge
<Badge
  variant="success"
  dismissible
  onDismiss={() => setShowBadge(false)}
>
  Confirmed
</Badge>

// Different sizes
<Badge size="sm">New</Badge>
<Badge size="md">Featured</Badge>
```

**Features:**
- ✅ 4 semantic color variants
- ✅ Size options (sm, md)
- ✅ Dismissible option with callback
- ✅ WCAG AA+ contrast on all variants

**Design Tokens Used:**
- Colors: `bg-success-50 text-success-500`, `bg-warning-50 text-warning-500`
- Padding: `px-3 py-1.5` (md), `px-2 py-1` (sm)
- Border radius: `rounded-full`

---

### Icon

SVG icon wrapper with sizing and accessibility support.

**Props:**
```typescript
interface IconProps extends HTMLAttributes<SVGSVGElement> {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  color?: string;
  strokeWidth?: number;
  decorative?: boolean;
  ariaLabel?: string;
  children?: ReactNode;
}
```

**Usage Examples:**

```typescript
// Basic icon
<Icon size="md">
  <path d="..." />
</Icon>

// Decorative icon (aria-hidden)
<Icon size="lg" decorative>
  <CheckCircleIcon />
</Icon>

// Icon with label (semantic)
<Icon size="md" ariaLabel="Delete">
  <TrashIcon />
</Icon>

// Custom color
<Icon size="lg" color="currentColor">
  <AlertIcon />
</Icon>

// Sizes
<Icon size="xs" /> {/* 12px */}
<Icon size="sm" /> {/* 16px */}
<Icon size="md" /> {/* 24px */}
<Icon size="lg" /> {/* 32px */}
<Icon size="xl" /> {/* 40px */}
```

**Features:**
- ✅ 5 size variants
- ✅ Custom color support
- ✅ Stroke width control (1.5 default)
- ✅ Decorative flag for a11y
- ✅ Semantic ARIA labels

**Design Tokens Used:**
- Sizes: `w-3 h-3` (xs) to `w-10 h-10` (xl)
- Stroke: `strokeWidth={1.5}`
- Flex shrink: `flex-shrink-0` (prevents distortion)

---

### Link

Anchor component with smooth underline animation and external link support.

**Props:**
```typescript
interface LinkProps extends HTMLAttributes<HTMLAnchorElement> {
  href: string;
  external?: boolean;
  newTab?: boolean;
  variant?: 'default' | 'primary' | 'secondary';
  size?: 'sm' | 'md';
  underline?: boolean;
  children?: ReactNode;
}
```

**Usage Examples:**

```typescript
// Basic link
<Link href="/about">About Us</Link>

// External link (opens new tab with icon)
<Link href="https://example.com" external>
  External Resource
</Link>

// Primary variant
<Link href="/pricing" variant="primary">
  View Pricing
</Link>

// Secondary variant
<Link href="/docs" variant="secondary">
  Documentation
</Link>

// Without underline
<Link href="/help" underline={false}>
  Need Help?
</Link>

// Small size
<Link href="/privacy" size="sm">
  Privacy Policy
</Link>
```

**Features:**
- ✅ Smooth underline animation on hover
- ✅ 3 color variants
- ✅ 2 sizes (sm, md)
- ✅ External link indicator
- ✅ New tab support
- ✅ Focus ring visible
- ✅ Underline toggle

**Design Tokens Used:**
- Colors: `text-text-primary`, `hover:text-accent-500`
- Underline: `after:bg-accent-500`, `hover:after:w-full`
- Animation: `duration-normal ease-out`
- Focus: `ring-2 ring-accent-500 ring-offset-2`

---

## Sections

### SectionHeader

Pattern component for section headers with tag, title, and optional description.

**Props:**
```typescript
interface SectionHeaderProps extends HTMLAttributes<HTMLDivElement> {
  tag?: string;
  title: string;
  description?: string;
  align?: 'left' | 'center' | 'right';
  size?: 'sm' | 'md' | 'lg';
  children?: ReactNode;
}
```

**Usage Examples:**

```typescript
// Basic section header
<SectionHeader
  title="Our Features"
  description="Everything you need to succeed"
/>

// With tag
<SectionHeader
  tag="Why Us"
  title="Built for Growth"
  description="Powerful tools designed for your success"
  align="center"
/>

// Large centered
<SectionHeader
  tag="Welcome"
  title="Transform Your Business"
  align="center"
  size="lg"
/>

// With children instead of description
<SectionHeader title="Our Team">
  <TeamCarousel />
</SectionHeader>
```

**Features:**
- ✅ Semantic tag support
- ✅ 3 text sizes
- ✅ Alignment options (left, center, right)
- ✅ Optional description
- ✅ Children slot for custom content

**Design Tokens Used:**
- Tag: `text-accent-500`, `text-xs`, `uppercase`, `tracking-widest`
- Title: `font-display`, `font-bold`, `letter-spacing-tight`
- Description: `text-text-secondary`, `leading-relaxed`

---

### HeroSection

Large hero section for landing pages with headline, description, and CTAs.

**Props:**
```typescript
interface HeroSectionProps extends HTMLAttributes<HTMLDivElement> {
  tag?: string;
  title: string;
  description?: string;
  primaryCTA: { label: string; href: string };
  secondaryCTA?: { label: string; href: string };
  stats?: Array<{ label: string; value: string }>;
  align?: 'left' | 'center';
  heroLayout?: 'default' | 'split';
  children?: ReactNode;
}
```

**Usage Examples:**

```typescript
// Basic hero
<HeroSection
  title="AI-Powered CRM for Local Businesses"
  description="Automate customer relationships and grow revenue faster"
  primaryCTA={{ label: "Start Free Trial", href: "/signup" }}
/>

// With stats
<HeroSection
  tag="Welcome to Synthex"
  title="Transform Your Business"
  description="Join 500+ businesses growing with us"
  primaryCTA={{ label: "Get Started", href: "/signup" }}
  secondaryCTA={{ label: "Watch Demo", href: "/demo" }}
  stats={[
    { label: "Businesses Transformed", value: "500+" },
    { label: "Revenue Growth", value: "3.5x" },
    { label: "User Satisfaction", value: "98%" }
  ]}
/>

// Split layout with image
<HeroSection
  title="Beautiful Design System"
  heroLayout="split"
  primaryCTA={{ label: "Explore", href: "/components" }}
>
  <HeroImage />
</HeroSection>
```

**Features:**
- ✅ Large responsive headline
- ✅ Primary and secondary CTAs
- ✅ Optional stats display
- ✅ Alignment options
- ✅ Split layout for images
- ✅ Full responsiveness

**Design Tokens Used:**
- Title: `text-6xl md:text-7xl`, `font-display`, `font-bold`
- Description: `text-lg md:text-xl`, `text-text-secondary`
- Padding: `py-20 md:py-32 lg:py-40`

---

### BenefitsGrid

2x2 grid component for displaying benefit cards with icons.

**Props:**
```typescript
interface BenefitsGridProps extends HTMLAttributes<HTMLDivElement> {
  tag?: string;
  title: string;
  description?: string;
  benefits: Array<{
    title: string;
    description: string;
    icon?: ReactNode;
    accentBar?: boolean;
  }>;
  columns?: 2 | 3 | 4;
  align?: 'left' | 'center';
}
```

**Usage Examples:**

```typescript
// 2x2 benefits grid
<BenefitsGrid
  tag="Why Choose Us"
  title="Built for Modern Businesses"
  description="Everything you need to grow"
  benefits={[
    {
      title: "AI-Powered Automation",
      description: "Automate repetitive tasks",
      icon: <ZapIcon />
    },
    {
      title: "Real-Time Analytics",
      description: "Track what matters",
      icon: <ChartIcon />
    },
    {
      title: "24/7 Support",
      description: "Always there when you need us",
      icon: <HeartIcon />
    },
    {
      title: "Secure & Reliable",
      description: "Enterprise-grade security",
      icon: <ShieldIcon />
    }
  ]}
/>

// 3-column variant
<BenefitsGrid
  title="Features"
  benefits={benefits}
  columns={3}
/>
```

**Features:**
- ✅ Flexible grid layout
- ✅ Icon support
- ✅ Accent bars
- ✅ Hover effects
- ✅ Responsive columns

---

### HowItWorksSteps

Timeline component for displaying step-by-step processes.

**Props:**
```typescript
interface HowItWorksStepsProps extends HTMLAttributes<HTMLDivElement> {
  tag?: string;
  title: string;
  description?: string;
  steps: Array<{
    title: string;
    description: string;
    icon?: ReactNode;
    number?: number;
  }>;
  align?: 'left' | 'center';
  showConnectors?: boolean;
}
```

**Usage Examples:**

```typescript
<HowItWorksSteps
  tag="Our Process"
  title="Get Started in 4 Steps"
  description="Simple workflow to start growing"
  steps={[
    {
      title: "Connect Your Email",
      description: "Link your Gmail account securely",
      icon: <MailIcon />
    },
    {
      title: "Sync Contacts",
      description: "Automatically import your contacts",
      icon: <UsersIcon />
    },
    {
      title: "Build Campaigns",
      description: "Create automated drip campaigns",
      icon: <RocketIcon />
    },
    {
      title: "Watch Growth",
      description: "Monitor results in real-time",
      icon: <TrendingUpIcon />
    }
  ]}
/>
```

**Features:**
- ✅ Numbered circles with icons
- ✅ Connecting lines between steps
- ✅ Mobile/desktop responsive layout
- ✅ Fully flexible step count

---

### IndustriesGrid

3x2 grid component for displaying industry/vertical cards.

**Props:**
```typescript
interface IndustriesGridProps extends HTMLAttributes<HTMLDivElement> {
  tag?: string;
  title: string;
  description?: string;
  industries: Array<{
    title: string;
    description: string;
    icon?: ReactNode;
    accentBar?: boolean;
  }>;
  columns?: 2 | 3 | 4;
}
```

**Usage Examples:**

```typescript
<IndustriesGrid
  tag="Who We Serve"
  title="Trusted by Various Industries"
  industries={[
    {
      title: "Real Estate",
      description: "For agents and brokers",
      icon: <BuildingIcon />
    },
    {
      title: "Healthcare",
      description: "For clinics and practices",
      icon: <HeartIcon />
    },
    // ... more industries
  ]}
/>
```

---

### PricingCards

3-tier pricing component with featured tier highlighting.

**Props:**
```typescript
interface PricingCardsProps extends HTMLAttributes<HTMLDivElement> {
  tag?: string;
  title: string;
  description?: string;
  tiers: Array<{
    name: string;
    price: string;
    period?: string;
    description?: string;
    features: Array<{ name: string; included?: boolean }>;
    cta: { label: string; href: string };
    featured?: boolean;
  }>;
  align?: 'left' | 'center';
}
```

**Usage Examples:**

```typescript
<PricingCards
  tag="Simple Pricing"
  title="Plans for Every Business"
  tiers={[
    {
      name: "Starter",
      price: "49",
      period: "/month",
      description: "Perfect for getting started",
      features: [
        { name: "Up to 100 contacts", included: true },
        { name: "Email campaigns", included: true },
        { name: "Basic automation", included: true }
      ],
      cta: { label: "Start Free Trial", href: "/signup" }
    },
    {
      name: "Professional",
      price: "149",
      description: "For growing businesses",
      features: [
        { name: "Unlimited contacts", included: true },
        { name: "Advanced automation", included: true },
        { name: "AI scoring", included: true }
      ],
      cta: { label: "Start Free Trial", href: "/signup" },
      featured: true
    }
    // ... more tiers
  ]}
/>
```

**Features:**
- ✅ Featured tier highlighting
- ✅ Feature checklist with included/excluded states
- ✅ Flexible tier count
- ✅ Per-tier CTAs

---

### CTASection

Full-width call-to-action footer section for landing pages.

**Props:**
```typescript
interface CTASectionProps extends HTMLAttributes<HTMLDivElement> {
  tag?: string;
  title: string;
  description?: string;
  primaryCTA: { label: string; href: string };
  secondaryCTA?: { label: string; href: string };
  backgroundGradient?: boolean;
  align?: 'left' | 'center';
}
```

**Usage Examples:**

```typescript
<CTASection
  tag="Ready to Transform?"
  title="Start Growing Your Business Today"
  description="Join hundreds of businesses automating their customer relationships"
  primaryCTA={{ label: "Start Your Free Trial", href: "/signup" }}
  secondaryCTA={{ label: "Schedule Demo", href: "/demo" }}
  backgroundGradient
/>
```

**Features:**
- ✅ Gradient background option
- ✅ Decorative circles
- ✅ Full-width design
- ✅ Trust statement included

---

## Layout

### Container

Max-width wrapper with semantic elements and responsive padding.

**Props:**
```typescript
interface ContainerProps extends HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  padding?: 'sm' | 'md' | 'lg';
  as?: 'div' | 'section' | 'article' | 'main';
}
```

**Usage Examples:**

```typescript
// Basic container
<Container padding="md">
  <h1>Page Title</h1>
  <p>Page content</p>
</Container>

// As semantic element
<Container as="main" size="lg">
  <MainContent />
</Container>

// Large padding
<Container padding="lg" size="xl">
  <Hero />
</Container>

// Full width
<Container size="full" padding="sm">
  <FullWidthContent />
</Container>
```

**Features:**
- ✅ 5 size options (sm-full)
- ✅ 3 padding options
- ✅ Semantic HTML elements
- ✅ Responsive padding

---

### Navigation

Sticky header with mobile hamburger menu and blur effect.

**Props:**
```typescript
interface NavigationProps extends HTMLAttributes<HTMLElement> {
  logo?: ReactNode;
  items: Array<{ label: string; href: string; icon?: ReactNode }>;
  cta?: { label: string; href: string };
  secondaryCTA?: { label: string; href: string };
  sticky?: boolean;
  blur?: boolean;
  border?: boolean;
}
```

**Usage Examples:**

```typescript
<Navigation
  logo={<SynthexLogo />}
  items={[
    { label: "Features", href: "#features" },
    { label: "Pricing", href: "#pricing" },
    { label: "Docs", href: "/docs" }
  ]}
  cta={{ label: "Get Started", href: "/signup" }}
  sticky
  blur
/>
```

**Features:**
- ✅ Sticky positioning
- ✅ Blur background effect
- ✅ Mobile hamburger menu
- ✅ Multiple CTA buttons
- ✅ Icon support

---

### Sidebar

Collapsible navigation sidebar with desktop/mobile variants.

**Props:**
```typescript
interface SidebarProps extends HTMLAttributes<HTMLDivElement> {
  logo?: ReactNode;
  items: Array<{
    label: string;
    href: string;
    icon?: ReactNode;
    badge?: string;
    divider?: boolean;
  }>;
  currentPath?: string;
  footer?: ReactNode;
  collapsible?: boolean;
  showToggle?: boolean;
}
```

**Usage Examples:**

```typescript
<Sidebar
  logo={<LogoIcon />}
  items={[
    { label: "Dashboard", href: "/dashboard", icon: <DashIcon /> },
    { label: "Contacts", href: "/contacts", icon: <UsersIcon />, badge: "12" },
    { label: "Campaigns", href: "/campaigns", icon: <RocketIcon /> },
    { divider: true },
    { label: "Settings", href: "/settings", icon: <GearIcon /> }
  ]}
  currentPath="/contacts"
  footer={<UserProfile />}
  collapsible
/>
```

**Features:**
- ✅ Collapsible on desktop
- ✅ Mobile overlay
- ✅ Active path highlighting
- ✅ Badge support
- ✅ Dividers
- ✅ Footer slot

---

### DashboardLayout

Complete layout combining Navigation, Sidebar, and main content area.

**Props:**
```typescript
interface DashboardLayoutProps extends HTMLAttributes<HTMLDivElement> {
  navigationLogo?: ReactNode;
  navigationItems?: Array<{ label: string; href: string }>;
  navigationCTA?: { label: string; href: string };
  sidebarLogo?: ReactNode;
  sidebarItems?: Array<{ label: string; href: string; icon?: ReactNode }>;
  currentPath?: string;
  sidebarFooter?: ReactNode;
  children?: ReactNode;
  showSidebar?: boolean;
  showNavigation?: boolean;
}
```

**Usage Examples:**

```typescript
<DashboardLayout
  navigationLogo={<SynthexIcon />}
  navigationCTA={{ label: "Upgrade", href: "/upgrade" }}
  sidebarLogo={<LogoIcon />}
  sidebarItems={[
    { label: "Dashboard", href: "/dashboard", icon: <DashIcon /> },
    { label: "Contacts", href: "/contacts", icon: <UsersIcon /> },
    { label: "Campaigns", href: "/campaigns", icon: <RocketIcon /> }
  ]}
  currentPath="/dashboard"
>
  <YourPageContent />
</DashboardLayout>
```

**Features:**
- ✅ Integrated navigation
- ✅ Integrated sidebar
- ✅ Responsive grid layout
- ✅ Sticky header
- ✅ Scrollable main content

---

## Patterns

### Table

Data table with sorting and keyboard navigation.

**Props:**
```typescript
interface TableProps extends HTMLAttributes<HTMLDivElement> {
  columns: Array<{
    id: string;
    label: string;
    sortable?: boolean;
    render?: (value: any, row: any) => ReactNode;
    width?: string;
  }>;
  data: any[];
  onRowClick?: (row: any, index: number) => void;
  striped?: boolean;
  border?: boolean;
  hover?: boolean;
  compact?: boolean;
  loading?: boolean;
  emptyMessage?: string;
}
```

**Usage Examples:**

```typescript
<Table
  columns={[
    { id: 'name', label: 'Name', sortable: true },
    { id: 'email', label: 'Email', sortable: true },
    {
      id: 'status',
      label: 'Status',
      render: (value) => <Badge variant={value === 'Active' ? 'success' : 'warning'}>{value}</Badge>
    }
  ]}
  data={contacts}
  onRowClick={(row) => navigateToContact(row.id)}
  striped
  hover
/>
```

**Features:**
- ✅ Column sorting
- ✅ Keyboard navigation
- ✅ Row clicking
- ✅ Striped rows
- ✅ Custom rendering
- ✅ Loading state
- ✅ Empty state

---

### StatsCard

Metric display component with trend indicators.

**Props:**
```typescript
interface StatsCardProps extends HTMLAttributes<HTMLDivElement> {
  label: string;
  value: string | number;
  secondaryValue?: string | number;
  trend?: {
    direction: 'up' | 'down' | 'neutral';
    percent: number;
    label?: string;
  };
  icon?: ReactNode;
  color?: 'accent' | 'success' | 'warning' | 'error' | 'neutral';
  variant?: 'default' | 'minimal';
  clickable?: boolean;
  onClick?: () => void;
}
```

**Usage Examples:**

```typescript
// Basic stat
<StatsCard
  label="Total Contacts"
  value="1,234"
/>

// With trend
<StatsCard
  label="Revenue"
  value="$45,230"
  trend={{ direction: 'up', percent: 12, label: 'vs last month' }}
  color="success"
/>

// With icon
<StatsCard
  label="Campaigns"
  value="24"
  icon={<RocketIcon />}
  color="accent"
/>

// Clickable
<StatsCard
  label="Open Rate"
  value="32%"
  clickable
  onClick={() => navigateToAnalytics()}
/>
```

**Features:**
- ✅ Trend indicators
- ✅ Color variants
- ✅ Icon support
- ✅ Click handlers
- ✅ Secondary values

---

### ActivityFeed

Timeline component for displaying activities or events.

**Props:**
```typescript
interface ActivityFeedProps extends HTMLAttributes<HTMLDivElement> {
  items: Array<{
    title: string;
    description?: string;
    timestamp: string;
    icon?: ReactNode;
    color?: 'accent' | 'success' | 'warning' | 'error' | 'neutral';
    metadata?: ReactNode;
    action?: { label: string; onClick: () => void };
  }>;
  showConnectors?: boolean;
  maxItems?: number;
  loading?: boolean;
  emptyMessage?: string;
}
```

**Usage Examples:**

```typescript
<ActivityFeed
  items={[
    {
      title: "Contact Added",
      description: "John Doe was added to your contacts",
      timestamp: "2 hours ago",
      icon: <PlusIcon />,
      color: "success",
      action: { label: "View", onClick: () => {} }
    },
    {
      title: "Campaign Sent",
      description: "Q4 Promotion campaign sent to 500 contacts",
      timestamp: "5 hours ago",
      icon: <SendIcon />,
      color: "accent"
    }
  ]}
  showConnectors
/>
```

**Features:**
- ✅ Timeline connectors
- ✅ Color-coded activities
- ✅ Timestamps
- ✅ Action buttons
- ✅ Metadata display
- ✅ Load more support

---

### Modal

Accessible dialog component with focus trap and keyboard support.

**Props:**
```typescript
interface ModalProps extends HTMLAttributes<HTMLDivElement> {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showCloseButton?: boolean;
  closeOnBackdropClick?: boolean;
  closeOnEscape?: boolean;
  children?: ReactNode;
}
```

**Usage Examples:**

```typescript
// Basic modal
const [isOpen, setIsOpen] = useState(false);

<>
  <Button onClick={() => setIsOpen(true)}>
    Open Modal
  </Button>

  <Modal
    isOpen={isOpen}
    onClose={() => setIsOpen(false)}
    title="Confirm Action"
    size="md"
  >
    <p>Are you sure you want to proceed?</p>
    <Modal.Footer>
      <Button variant="secondary" onClick={() => setIsOpen(false)}>
        Cancel
      </Button>
      <Button variant="primary" onClick={handleConfirm}>
        Confirm
      </Button>
    </Modal.Footer>
  </Modal>
</>
```

**Features:**
- ✅ Focus trap (Tab loops within modal)
- ✅ Escape key to close
- ✅ Backdrop click to close
- ✅ 4 size options
- ✅ Footer slot for actions
- ✅ Smooth animations

---

## Best Practices

### 1. Design Token Compliance

Always use design tokens, NEVER hardcode values:

```typescript
// ❌ WRONG - Hardcoded color
<div className="bg-#ff6b35 text-white">Content</div>

// ✅ CORRECT - Design token
<div className="bg-accent-500 text-white">Content</div>
```

### 2. Responsive Approach

Use mobile-first CSS with Tailwind breakpoints:

```typescript
// ✅ CORRECT - Mobile-first
className="px-4 md:px-6 lg:px-8 py-2 md:py-3 lg:py-4"

// ❌ AVOID - Desktop-first or no responsive
className="px-8 py-4"
```

### 3. Accessibility

Always include ARIA labels and semantic HTML:

```typescript
// ✅ CORRECT - Semantic with ARIA
<button aria-label="Close menu" onClick={onClose}>
  <CloseIcon />
</button>

// ❌ AVOID - No semantics or labels
<div onClick={onClose}><CloseIcon /></div>
```

### 4. Type Safety

Always use proper TypeScript types:

```typescript
// ✅ CORRECT
interface MyComponentProps extends HTMLAttributes<HTMLDivElement> {
  title: string;
  onClick?: () => void;
}

const MyComponent = forwardRef<HTMLDivElement, MyComponentProps>(...)

// ❌ AVOID
const MyComponent = (props: any) => ...
```

### 5. Composition Over Copying

Reuse components instead of duplicating code:

```typescript
// ✅ CORRECT - Compose components
<Container padding="md">
  <SectionHeader title="Features" />
  <BenefitsGrid benefits={data} />
</Container>

// ❌ AVOID - Duplicating component code
<div className="px-6 py-4">
  <h2>Features</h2>
  <div className="grid grid-cols-2 gap-6">
    {/* Duplicate card code */}
  </div>
</div>
```

---

## Accessibility

All components are built with WCAG 2.1 AA+ compliance:

- **Semantic HTML** - Using proper elements
- **Focus Management** - Visible focus rings on all interactive elements
- **ARIA Labels** - For icon-only buttons and complex widgets
- **Color Contrast** - 4.5:1 for text, 3:1 for UI elements
- **Keyboard Navigation** - Full keyboard support (Tab, Enter, Escape)
- **Screen Readers** - Proper heading hierarchy and structure

---

## Responsive Design

All components use mobile-first design:

- **Mobile** (375px) - Single column, hamburger menus, stacked layouts
- **Tablet** (768px) - Two columns where applicable
- **Desktop** (1200px+) - Full features, hover effects, animations

Use Tailwind's responsive prefixes:
- Default = mobile styles
- `md:` = 768px and up (tablets)
- `lg:` = 1200px and up (desktops)

---

## Design Tokens

All components use the design system tokens:

### Colors
```
bg-base, bg-raised, bg-card, bg-hover, bg-input
text-primary, text-secondary, text-muted
accent-500, accent-400, accent-600
success-500, warning-500, error-500
border-subtle, border-medium
```

### Spacing Scale
```
px-4, px-6, px-8, px-10
py-2, py-3, py-4, py-6
gap-2, gap-4, gap-6, gap-8
```

### Typography
```
font-display, font-body
text-xs, text-sm, text-base, text-lg, text-xl, text-2xl...
font-bold, font-semibold, font-medium
```

### Effects
```
shadow-card, shadow-button-primary
duration-fast, duration-normal
ease-in, ease-out
rounded-md, rounded-lg, rounded-full
```

---

## Examples

### Complete Landing Page

```typescript
import { HeroSection, BenefitsGrid, HowItWorksSteps, PricingCards, CTASection, Container } from '@/components';

export function LandingPage() {
  return (
    <>
      <HeroSection
        tag="Welcome"
        title="AI-Powered CRM Platform"
        description="Automate customer relationships and grow revenue"
        primaryCTA={{ label: "Start Free Trial", href: "/signup" }}
        stats={[
          { label: "Businesses", value: "500+" },
          { label: "Growth", value: "3.5x" }
        ]}
      />

      <Container>
        <BenefitsGrid
          tag="Features"
          title="Everything You Need"
          benefits={benefitData}
        />
      </Container>

      <Container>
        <HowItWorksSteps
          tag="Process"
          title="Get Started in 4 Steps"
          steps={stepsData}
        />
      </Container>

      <Container>
        <PricingCards
          tag="Pricing"
          title="Simple, Transparent Pricing"
          tiers={pricingData}
        />
      </Container>

      <CTASection
        title="Start Your Free Trial Today"
        primaryCTA={{ label: "Get Started", href: "/signup" }}
      />
    </>
  );
}
```

### Dashboard Page

```typescript
import { DashboardLayout, StatsCard, Table, ActivityFeed, Container } from '@/components';

export function DashboardPage() {
  return (
    <DashboardLayout
      navigationLogo={<Logo />}
      sidebarItems={sidebarItems}
      currentPath="/dashboard"
    >
      <Container padding="md">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatsCard label="Contacts" value="1,234" color="accent" />
          <StatsCard label="Revenue" value="$45,230" color="success" />
          <StatsCard label="Campaigns" value="12" color="accent" />
          <StatsCard label="Open Rate" value="32%" color="warning" />
        </div>

        {/* Data Table */}
        <Table
          columns={tableColumns}
          data={contacts}
          onRowClick={handleRowClick}
        />

        {/* Activity Feed */}
        <ActivityFeed items={activities} />
      </Container>
    </DashboardLayout>
  );
}
```

---

## Support

For questions or issues with components:

1. Check the component JSDoc comments in the source code
2. Review the examples in this documentation
3. Check design tokens in `src/styles/design-tokens.ts`
4. Review Tailwind configuration in `tailwind.config.cjs`

---

**Last Updated**: November 30, 2025
**Version**: 1.0.0
**Status**: Production Ready ✅
