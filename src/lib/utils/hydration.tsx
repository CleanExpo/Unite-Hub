/**
 * Hydration Utilities
 *
 * Helper hooks and components for preventing SSR/CSR hydration mismatches.
 * Use these when components need client-only rendering or have dynamic data.
 */

'use client';

import { useEffect, useState, ReactNode } from 'react';

/**
 * useHasMounted Hook
 *
 * Returns false on server and initial client render, true after hydration.
 * Use this to conditionally render client-only content without hydration mismatches.
 *
 * @example
 * ```tsx
 * const hasMounted = useHasMounted();
 * if (!hasMounted) return <Skeleton />;
 * return <ClientOnlyComponent />;
 * ```
 */
export function useHasMounted(): boolean {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return mounted;
}

/**
 * ClientOnly Component
 *
 * Wrapper that only renders children on the client after hydration.
 * Prevents hydration mismatches for components that can't be server-rendered.
 *
 * @example
 * ```tsx
 * <ClientOnly fallback={<Skeleton />}>
 *   <ComponentThatUsesWindow />
 * </ClientOnly>
 * ```
 */
export function ClientOnly({
  children,
  fallback = null
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const mounted = useHasMounted();

  if (!mounted) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * useIsClient Hook
 *
 * Simple hook that returns true only on client-side.
 * Prefer useHasMounted for most cases as it's hydration-safe.
 *
 * @example
 * ```tsx
 * const isClient = useIsClient();
 * const data = isClient ? localStorage.getItem('key') : null;
 * ```
 */
export function useIsClient(): boolean {
  return useHasMounted();
}

/**
 * NoSSR Component
 *
 * Alias for ClientOnly with clearer name.
 * Use when you explicitly want to disable server-side rendering.
 */
export const NoSSR = ClientOnly;
