# Next.js 15 App Router Documentation

> Official documentation sourced from [nextjs.org/docs/15](https://nextjs.org/docs/15/app)

## Overview

The **App Router** is a file-system based router that uses React's latest features such as Server Components, Suspense, and Server Functions.

## Installation

```bash
npx create-next-app@latest my-project
cd my-project
npm run dev
```

## Server and Client Components

```typescript
// Server Component (default) - runs on the server
import 'server-only';

export async function getData() {
  const res = await fetch('https://external-service.com/data', {
    headers: {
      authorization: process.env.API_KEY,
    },
  });
  return res.json();
}

// Client Component - add 'use client' directive
('use client');
import { useRouter, usePathname, useSearchParams } from 'next/navigation';

export default function ExampleClientComponent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  // ...
}
```

## Composition Patterns

```tsx
// Pass Server Components as children to Client Components
import ClientComponent from './client-component';
import ServerComponent from './server-component';

export default function Page() {
  return (
    <ClientComponent>
      <ServerComponent />
    </ClientComponent>
  );
}
```

## Route Handlers

```typescript
// app/api/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('query');
  return NextResponse.json({ query });
}

export async function POST(request: Request) {
  const data = await request.json();
  return Response.json({ received: data });
}
```

## Route Segment Config

```typescript
export const dynamic = 'auto';
export const dynamicParams = true;
export const revalidate = false;
export const fetchCache = 'auto';
export const runtime = 'nodejs';
export const preferredRegion = 'auto';
```

## Data Fetching & Caching

```typescript
// Cached by default (GET with Response object)
export async function GET() {
  const res = await fetch('https://data.mongodb-api.com/...', {
    headers: {
      'Content-Type': 'application/json',
      'API-Key': process.env.DATA_API_KEY,
    },
  });
  const data = await res.json();
  return Response.json({ data });
}

// Revalidating cached data
export async function GET() {
  const res = await fetch('https://data.mongodb-api.com/...', {
    next: { revalidate: 60 }, // Revalidate every 60 seconds
  });
  const data = await res.json();
  return Response.json(data);
}

// Opt out of caching
export async function GET() {
  const res = await fetch('https://data.mongodb-api.com/...', {
    cache: 'no-store',
  });
  const data = await res.json();
  return Response.json(data);
}
```

## Cookies and Headers

```typescript
import { cookies, headers } from 'next/headers';

export async function GET(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get('token');

  const headersList = await headers();
  const referer = headersList.get('referer');

  return new Response('Hello!', {
    status: 200,
    headers: { 'Set-Cookie': `token=${token?.value}` },
  });
}
```

## Dynamic Routes

```typescript
// app/items/[slug]/route.ts
export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return Response.json({ slug });
}
```

## Middleware

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Check authentication
  const token = request.cookies.get('token');

  if (!token && request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
};
```

## Server Actions

```typescript
// app/actions.ts
'use server'

export async function createUser(formData: FormData) {
  const name = formData.get('name')
  // Insert into database
  return { success: true }
}

// app/page.tsx
import { createUser } from './actions'

export default function Page() {
  return (
    <form action={createUser}>
      <input name="name" />
      <button type="submit">Submit</button>
    </form>
  )
}
```

## Layouts and Pages

```typescript
// app/layout.tsx - Root layout (required)
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

// app/dashboard/layout.tsx - Nested layout
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <section>
      <nav>Dashboard Navigation</nav>
      {children}
    </section>
  )
}
```

## Loading and Error States

```typescript
// app/dashboard/loading.tsx
export default function Loading() {
  return <div>Loading...</div>
}

// app/dashboard/error.tsx
'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div>
      <h2>Something went wrong!</h2>
      <button onClick={() => reset()}>Try again</button>
    </div>
  )
}
```

## Linking and Navigation

```typescript
import Link from 'next/link'

export default function Navigation() {
  return (
    <nav>
      <Link href="/">Home</Link>
      <Link href="/dashboard">Dashboard</Link>
      <Link href="/blog/hello-world">Blog Post</Link>
    </nav>
  )
}

// Programmatic navigation
'use client'
import { useRouter } from 'next/navigation'

export function NavigateButton() {
  const router = useRouter()

  return (
    <button onClick={() => router.push('/dashboard')}>
      Go to Dashboard
    </button>
  )
}
```

## Project Structure

```
app/
├── globals.css
├── layout.tsx
├── loading.tsx
├── error.tsx
├── page.tsx
├── api/
│   └── route.ts
├── dashboard/
│   ├── layout.tsx
│   ├── page.tsx
│   └── [id]/
│       └── page.tsx
└── (marketing)/
    ├── about/
    │   └── page.tsx
    └── contact/
        └── page.tsx
```

## Dynamic Client-Only Component

```typescript
'use client'
import dynamic from 'next/dynamic'

const App = dynamic(() => import('../../App'), { ssr: false })

export function ClientOnly() {
  return <App />
}
```

## Parallel Routes

```typescript
// app/layout.tsx with parallel routes
export default function Layout({
  children,
  team,
  analytics,
}: {
  children: React.ReactNode
  team: React.ReactNode
  analytics: React.ReactNode
}) {
  return (
    <>
      {children}
      {team}
      {analytics}
    </>
  )
}

// app/@team/page.tsx
// app/@analytics/page.tsx
```

## Intercepting Routes

```typescript
// app/feed/(..)photo/[id]/page.tsx
// Intercepts /photo/[id] when navigating from /feed
export default function PhotoModal({ params }: { params: { id: string } }) {
  return <div>Photo {params.id} in modal</div>
}
```

## Official Resources

- **Documentation**: [nextjs.org/docs](https://nextjs.org/docs/15)
- **App Router**: [nextjs.org/docs/app](https://nextjs.org/docs/15/app)
- **Learn**: [nextjs.org/learn](https://nextjs.org/learn)
- **GitHub**: [github.com/vercel/next.js](https://github.com/vercel/next.js)
