import '@testing-library/jest-dom';
import { vi } from 'vitest';

// ============================================
// REDIS MOCKING
// Mock ioredis to prevent connection attempts during tests
// ============================================

// In-memory storage for mock Redis
const mockRedisData = new Map<string, { value: string; expiry: number }>();

// Create a mock Redis client that mimics ioredis
const createMockRedis = () => ({
  get: vi.fn(async (key: string) => {
    const item = mockRedisData.get(key);
    if (!item) return null;
    if (Date.now() > item.expiry) {
      mockRedisData.delete(key);
      return null;
    }
    return item.value;
  }),
  set: vi.fn(async (key: string, value: string, mode?: string, duration?: number, nx?: string) => {
    // Handle NX flag (set only if not exists)
    if (nx === 'NX' && mockRedisData.has(key)) {
      return null;
    }
    const expiry = duration ? Date.now() + duration * 1000 : Date.now() + 86400000;
    mockRedisData.set(key, { value, expiry });
    return 'OK';
  }),
  exists: vi.fn(async (...keys: string[]) => {
    return keys.filter(key => mockRedisData.has(key)).length;
  }),
  del: vi.fn(async (...keys: string[]) => {
    let deleted = 0;
    for (const key of keys) {
      if (mockRedisData.delete(key)) deleted++;
    }
    return deleted;
  }),
  keys: vi.fn(async (pattern: string) => {
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    return Array.from(mockRedisData.keys()).filter(key => regex.test(key));
  }),
  ttl: vi.fn(async (key: string) => {
    const item = mockRedisData.get(key);
    if (!item) return -2;
    const remaining = Math.floor((item.expiry - Date.now()) / 1000);
    return remaining > 0 ? remaining : -2;
  }),
  ping: vi.fn(async () => 'PONG'),
  quit: vi.fn(async () => {
    mockRedisData.clear();
    return 'OK';
  }),
  disconnect: vi.fn(() => {
    mockRedisData.clear();
  }),
  on: vi.fn(),
});

// Mock the redis module
vi.mock('@/lib/redis', () => {
  const mockClient = createMockRedis();
  return {
    getRedisClient: vi.fn(() => mockClient),
    disconnectRedis: vi.fn(async () => {}),
  };
});

// Mock ioredis directly as well
vi.mock('ioredis', () => {
  return {
    default: vi.fn(() => createMockRedis()),
  };
});

// ============================================
// NEXT.JS APP ROUTER MOCKING
// Required for all page/component tests that use next/navigation
// ============================================

// Mock next/navigation (App Router)
vi.mock('next/navigation', () => {
  const push = vi.fn();
  const replace = vi.fn();
  const back = vi.fn();
  const forward = vi.fn();
  const refresh = vi.fn();
  const prefetch = vi.fn();

  return {
    useRouter: vi.fn(() => ({
      push,
      replace,
      back,
      forward,
      refresh,
      prefetch,
      pathname: '/',
    })),
    usePathname: vi.fn(() => '/'),
    useSearchParams: vi.fn(() => new URLSearchParams()),
    useParams: vi.fn(() => ({})),
    useSelectedLayoutSegment: vi.fn(() => null),
    useSelectedLayoutSegments: vi.fn(() => []),
    redirect: vi.fn(),
    notFound: vi.fn(),
    permanentRedirect: vi.fn(),
  };
});

// Mock next/headers (for server components if needed)
vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({
    get: vi.fn(),
    getAll: vi.fn(() => []),
    has: vi.fn(() => false),
    set: vi.fn(),
    delete: vi.fn(),
  })),
  headers: vi.fn(() => ({
    get: vi.fn(),
    getAll: vi.fn(() => []),
    has: vi.fn(() => false),
    entries: vi.fn(() => [][Symbol.iterator]()),
    keys: vi.fn(() => [][Symbol.iterator]()),
    values: vi.fn(() => [][Symbol.iterator]()),
    forEach: vi.fn(),
  })),
}));

// Mock next/image
vi.mock('next/image', () => ({
  default: vi.fn(({ src, alt, ...props }) => {
    // eslint-disable-next-line @next/next/no-img-element
    return `<img src="${src}" alt="${alt || ''}" />`;
  }),
}));

// Mock next/link
vi.mock('next/link', () => ({
  default: vi.fn(({ children, href, ...props }) => {
    return `<a href="${href}">${children}</a>`;
  }),
}));

// ============================================
// ENVIRONMENT & GLOBALS
// ============================================

// Mock environment variables for testing
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
process.env.NEXTAUTH_URL = 'http://localhost:3008';
process.env.NEXTAUTH_SECRET = 'test-secret';

// Mock window.matchMedia (for responsive tests)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock ResizeObserver (for UI components)
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock IntersectionObserver (for lazy loading)
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
  root: null,
  rootMargin: '',
  thresholds: [],
}));

// Mock scrollTo (for scroll-related tests)
window.scrollTo = vi.fn();

// Mock console.error to reduce test noise (optional - comment out if you want to see errors)
// vi.spyOn(console, 'error').mockImplementation(() => {});
