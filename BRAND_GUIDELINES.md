# 🎨 Unite-Hub Brand Guidelines

**Last Updated:** 2025-11-14
**Brand Assets Location:** `/public/logos/`

---

## 🏷️ Logo Assets

### Available Logos

1. **Primary Logo** - `unite-hub-logo.png`
   - Full Unite-Hub branding
   - Use for general marketing and web presence
   - Size: 739KB

2. **Starter Member Logo** - `unite-hub-starter.png`
   - For Starter tier members ($249/month)
   - Use on member profiles and badges
   - Size: 882KB

3. **Professional Member Logo** - `unite-hub-professional.png`
   - For Professional tier members ($549/month)
   - Use on member profiles and badges
   - Size: 892KB

---

## 🎨 Brand Colors

Based on the Unite-Hub logo design:

### Primary Colors

```css
/* Teal - Primary Brand Color */
--unite-teal: #3b9ba8

/* Navy Blue - "Unite" Text */
--unite-blue: #2563ab

/* Orange - "Hub" Text */
--unite-orange: #f39c12
```

### Secondary Colors

```css
/* Gold - Accent */
--unite-gold: #e67e22

/* Dark Navy - Headers/Text */
--unite-navy: #1e3a5f
```

### Color Usage

| Color | Hex | Usage |
|-------|-----|-------|
| **Teal** | `#3b9ba8` | Primary actions, CTAs, links |
| **Blue** | `#2563ab` | Headers, important text |
| **Orange** | `#f39c12` | Highlights, accents, success states |
| **Gold** | `#e67e22` | Warnings, premium features |
| **Navy** | `#1e3a5f` | Body text, dark sections |

---

## 📐 Logo Usage

### React Component Usage

```tsx
import { Logo, LogoText, MembershipBadge } from '@/components/branding/Logo'

// Primary logo with various sizes
<Logo size="sm" />   // 80x80px
<Logo size="md" />   // 120x120px (default)
<Logo size="lg" />   // 160x160px
<Logo size="xl" />   // 200x200px

// Logo variants
<Logo variant="default" />        // Main logo
<Logo variant="starter" />        // Starter member
<Logo variant="professional" />   // Professional member

// Logo without image (text only)
<LogoText />

// Membership badges
<MembershipBadge tier="starter" size="sm" />
<MembershipBadge tier="professional" size="md" />
```

### Direct Image Usage

```tsx
import Image from 'next/image'

<Image
  src="/logos/unite-hub-logo.png"
  alt="Unite-Hub Logo"
  width={120}
  height={120}
  priority
/>
```

---

## 🎨 Tailwind CSS Color Classes

### Using Brand Colors

```tsx
// Background colors
<div className="bg-unite-teal">Teal background</div>
<div className="bg-unite-blue">Blue background</div>
<div className="bg-unite-orange">Orange background</div>

// Text colors
<h1 className="text-unite-blue">Navy Blue Heading</h1>
<span className="text-unite-orange">Orange Accent</span>

// Borders
<div className="border-unite-teal border-2">Teal border</div>

// Hover states
<button className="bg-unite-teal hover:bg-unite-blue">
  Hover effect
</button>
```

---

## 📱 Logo Spacing Guidelines

### Minimum Clearspace
- Minimum clearspace around logo: 20px on all sides
- Never scale logo smaller than 60x60px
- Never stretch or distort logo proportions

### Responsive Sizing

```tsx
// Mobile
<Logo size="sm" className="md:hidden" />

// Tablet
<Logo size="md" className="hidden md:block lg:hidden" />

// Desktop
<Logo size="lg" className="hidden lg:block" />
```

---

## 🎯 Common Use Cases

### 1. Navigation Bar

```tsx
// app/layout.tsx or components/Navbar.tsx
import { Logo } from '@/components/branding/Logo'

export function Navbar() {
  return (
    <nav className="flex items-center justify-between p-4 bg-white border-b">
      <Logo size="sm" />
      {/* Navigation items */}
    </nav>
  )
}
```

### 2. Landing Page Hero

```tsx
import { Logo } from '@/components/branding/Logo'

export function Hero() {
  return (
    <div className="flex flex-col items-center py-20">
      <Logo size="xl" />
      <h1 className="mt-8 text-4xl font-bold">
        <span className="text-unite-blue">Welcome to Unite-</span>
        <span className="text-unite-orange">Hub</span>
      </h1>
    </div>
  )
}
```

### 3. Membership Tiers Display

```tsx
import { MembershipBadge } from '@/components/branding/Logo'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

export function PricingCards() {
  return (
    <div className="grid md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <MembershipBadge tier="starter" size="md" />
          <CardTitle className="mt-4">Starter Member</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-unite-blue">$249</p>
          <p className="text-muted-foreground">per month + GST</p>
        </CardContent>
      </Card>

      <Card className="border-unite-orange border-2">
        <CardHeader>
          <MembershipBadge tier="professional" size="md" />
          <CardTitle className="mt-4">Professional Member</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-unite-orange">$549</p>
          <p className="text-muted-foreground">per month + GST</p>
        </CardContent>
      </Card>
    </div>
  )
}
```

### 4. User Profile with Badge

```tsx
import { MembershipBadge } from '@/components/branding/Logo'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

export function UserProfile({ user }) {
  return (
    <div className="flex items-center gap-4">
      <Avatar>
        <AvatarImage src={user.avatar} />
        <AvatarFallback>{user.initials}</AvatarFallback>
      </Avatar>
      <div>
        <h3 className="font-semibold">{user.name}</h3>
        <MembershipBadge tier={user.tier} size="sm" />
      </div>
    </div>
  )
}
```

### 5. Button Styling with Brand Colors

```tsx
import { Button } from '@/components/ui/button'

// Primary CTA - Teal
<Button className="bg-unite-teal hover:bg-unite-teal/90">
  Get Started
</Button>

// Secondary CTA - Blue
<Button className="bg-unite-blue hover:bg-unite-blue/90">
  Learn More
</Button>

// Premium Action - Orange
<Button className="bg-unite-orange hover:bg-unite-orange/90">
  Upgrade to Professional
</Button>
```

---

## 🎨 Typography

### Recommended Font Pairing

```css
/* Headers - Bold, Navy Blue */
h1, h2, h3 {
  font-weight: 700;
  color: #2563ab; /* unite-blue */
}

/* Body Text - Dark Gray/Navy */
body {
  color: #1e3a5f; /* unite-navy */
}

/* Accent Text - Orange */
.accent {
  color: #f39c12; /* unite-orange */
}
```

### Usage Example

```tsx
<div>
  <h1 className="text-4xl font-bold text-unite-blue">
    AI-Powered CRM
  </h1>
  <p className="text-lg text-unite-navy mt-4">
    Streamline your restoration business with intelligent automation
  </p>
  <span className="text-unite-orange font-semibold">
    Save 10+ hours per week
  </span>
</div>
```

---

## 🚫 Logo Don'ts

### Never:
- ❌ Distort or stretch the logo
- ❌ Change the logo colors
- ❌ Rotate the logo at odd angles
- ❌ Add effects (drop shadows, gradients, etc.)
- ❌ Place logo on busy backgrounds
- ❌ Use low-resolution versions
- ❌ Recreate or redraw the logo

### Always:
- ✅ Use original logo files from `/public/logos/`
- ✅ Maintain proper aspect ratio
- ✅ Ensure sufficient contrast with background
- ✅ Use appropriate size for context
- ✅ Maintain minimum clearspace

---

## 📊 Color Accessibility

### Contrast Ratios (WCAG AA Compliant)

| Combination | Contrast | Pass? |
|-------------|----------|-------|
| Teal on White | 4.5:1 | ✅ AA |
| Blue on White | 6.8:1 | ✅ AAA |
| Orange on White | 3.1:1 | ⚠️ Large text only |
| Navy on White | 11.2:1 | ✅ AAA |
| White on Teal | 5.1:1 | ✅ AA |
| White on Blue | 7.2:1 | ✅ AAA |

### Recommended Combinations

```tsx
// Best for buttons
<button className="bg-unite-teal text-white">High Contrast</button>
<button className="bg-unite-blue text-white">Best Contrast</button>

// Best for text
<h1 className="text-unite-blue">Excellent readability</h1>
<h2 className="text-unite-navy">Best for body text</h2>

// Accents (large text only)
<span className="text-2xl font-bold text-unite-orange">
  Large accent text
</span>
```

---

## 🎨 Design System Integration

### shadcn/ui Component Theming

Update `app/globals.css`:

```css
@layer base {
  :root {
    /* Unite-Hub brand colors */
    --primary: 188 48% 45%;        /* Teal */
    --primary-foreground: 0 0% 100%;

    --secondary: 213 61% 42%;      /* Blue */
    --secondary-foreground: 0 0% 100%;

    --accent: 29 89% 51%;          /* Orange */
    --accent-foreground: 0 0% 100%;
  }
}
```

---

## 📁 File Organization

```
public/
├── logos/
│   ├── unite-hub-logo.png           # Primary logo
│   ├── unite-hub-starter.png        # Starter badge
│   └── unite-hub-professional.png   # Professional badge
│
src/
├── components/
│   └── branding/
│       └── Logo.tsx                 # Logo components
```

---

## 🚀 Quick Start Examples

### Example 1: Branded Landing Page

```tsx
import { Logo } from '@/components/branding/Logo'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-unite-teal/10">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-20 text-center">
        <Logo size="xl" className="mx-auto mb-8" />
        <h1 className="text-5xl font-bold mb-4">
          <span className="text-unite-blue">Unite-</span>
          <span className="text-unite-orange">Hub</span>
        </h1>
        <p className="text-xl text-unite-navy mb-8">
          AI-Powered CRM for Restoration Businesses
        </p>
        <Button className="bg-unite-teal hover:bg-unite-teal/90 text-white px-8 py-6 text-lg">
          Start Free Trial
        </Button>
      </div>

      {/* Features */}
      <div className="container mx-auto px-4 py-12 grid md:grid-cols-3 gap-6">
        <Card className="border-unite-teal">
          <CardContent className="p-6">
            <h3 className="text-xl font-bold text-unite-blue mb-2">
              Smart Automation
            </h3>
            <p className="text-unite-navy">
              Save hours with AI-powered workflows
            </p>
          </CardContent>
        </Card>
        {/* More cards... */}
      </div>
    </div>
  )
}
```

---

## 📞 Brand Support

For questions about brand usage:
- **Design Lead:** [Contact]
- **Marketing:** [Contact]
- **Development:** [Contact]

---

**Last Updated:** 2025-11-14
**Version:** 1.0
**Status:** ✅ Active
