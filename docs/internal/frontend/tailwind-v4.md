# Tailwind CSS v4 Documentation

> Official documentation sourced from [tailwindcss.com](https://tailwindcss.com/docs/installation/using-vite) and [tailwindcss.com/blog/tailwindcss-v4-beta](https://tailwindcss.com/blog/tailwindcss-v4-beta)

## Overview

Tailwind CSS v4.0 is an all-new engine built for performance and designed for the modern web:

- **Built for performance** — Full builds are up to 5x faster, incremental builds are over 100x faster (measured in microseconds)
- **Unified toolchain** — Built-in import handling, vendor prefixing, and syntax transforms with no additional tooling required
- **CSS-first configuration** — Customize and extend the framework directly in CSS instead of JavaScript
- **Designed for the modern web** — Native cascade layers, wide-gamut colors, container queries, `@starting-style`, popovers, and more

## Installation with Vite

### Step 1: Create your project

```bash
npm create vite@latest my-project
cd my-project
```

### Step 2: Install Tailwind CSS

```bash
npm install tailwindcss @tailwindcss/vite
```

### Step 3: Configure the Vite plugin

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [tailwindcss()],
});
```

### Step 4: Import Tailwind CSS

```css
/* src/style.css */
@import 'tailwindcss';
```

### Step 5: Start your build process

```bash
npm run dev
```

### Step 6: Use in your HTML

```html
<!doctype html>
<html>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link href="/src/style.css" rel="stylesheet" />
  </head>
  <body>
    <h1 class="text-3xl font-bold underline">Hello world!</h1>
  </body>
</html>
```

## CSS-First Configuration

Tailwind v4 uses CSS-first configuration with the `@theme` directive:

```css
@import 'tailwindcss';

@theme {
  --font-display: 'Satoshi', 'sans-serif';
  --breakpoint-3xl: 120rem;

  --color-avocado-100: oklch(0.99 0 0);
  --color-avocado-200: oklch(0.98 0.04 113.22);
  --color-avocado-300: oklch(0.94 0.11 115.03);
  --color-avocado-400: oklch(0.92 0.19 114.08);
  --color-avocado-500: oklch(0.84 0.18 117.33);
  --color-avocado-600: oklch(0.53 0.12 118.34);

  --ease-fluid: cubic-bezier(0.3, 0, 0, 1);
  --ease-snappy: cubic-bezier(0.2, 0, 0, 1);
}
```

## Custom Colors

```css
@theme {
  --color-primary: #3b82f6;
  --color-secondary: #ef4444;
  --color-mint-500: oklch(0.72 0.11 178);
}
```

## CSS Theme Variables

```css
@theme {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-primary: var(--primary);
}
```

## Theming with CSS Variables

```css
:root,
.light {
  --color-primary-600: rgba(35, 100, 139, 1);
  --bg-primary: var(--color-primary-600);
}

.dark {
  --color-primary-400: rgba(25, 10, 139, 1);
  --bg-primary: var(--color-primary-400);
}
```

## Multi-Theme Strategy

```css
@theme {
  --color-primary: #aab9ff;
}

@layer base {
  [data-theme='ocean'] {
    --color-primary: #aab9ff;
  }

  [data-theme='rainforest'] {
    --color-primary: #56d0a0;
  }

  [data-theme='candy'] {
    --color-primary: #f9a8d4;
  }
}
```

## Reset Theme Variables

```css
@theme {
  --color-*: initial;
  --spacing-*: initial;
  --radius-*: initial;
  --text-*: initial;
  --z-*: initial;
}
```

## Spacing Utilities

```css
@layer theme {
  :root {
    --spacing: 0.25rem;
  }
}

@layer utilities {
  .mt-8 {
    margin-top: calc(var(--spacing) * 8);
  }
  .w-17 {
    width: calc(var(--spacing) * 17);
  }
  .pr-29 {
    padding-right: calc(var(--spacing) * 29);
  }
}
```

## JavaScript Configuration (Legacy Support)

For backwards compatibility, you can still use JavaScript config:

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6',
          600: '#2563eb',
          900: '#1e3a8a',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
    require('@tailwindcss/forms'),
    require('tailwindcss-animate'),
  ],
};
```

## Dark Mode Toggle

```typescript
const toggleDarkMode = () => {
  document.documentElement.classList.toggle('dark');
};
```

## Custom Utilities Plugin

```javascript
const plugin = require('tailwindcss/plugin');

module.exports = {
  plugins: [
    plugin(function ({ addUtilities }) {
      const newUtilities = {
        '.filter-none': {
          filter: 'none',
        },
        '.filter-grayscale': {
          filter: 'grayscale(100%)',
        },
      };
      addUtilities(newUtilities, ['responsive', 'hover']);
    }),
  ],
};
```

## shadcn/ui Color Variables

```css
@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 222.2 47.4% 11.2%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 222.2 84% 4.9%;
    --radius: 0.5rem;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    /* ... dark mode variables */
  }
}
```

## Official Resources

- **Documentation**: [tailwindcss.com/docs](https://tailwindcss.com/docs)
- **Installation**: [tailwindcss.com/docs/installation](https://tailwindcss.com/docs/installation/using-vite)
- **v4 Beta**: [tailwindcss.com/blog/tailwindcss-v4-beta](https://tailwindcss.com/blog/tailwindcss-v4-beta)
- **GitHub**: [github.com/tailwindlabs/tailwindcss](https://github.com/tailwindlabs/tailwindcss)
