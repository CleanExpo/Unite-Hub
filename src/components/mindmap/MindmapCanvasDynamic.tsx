/**
 * Dynamic wrapper for MindmapCanvas
 *
 * Loads ReactFlow dynamically to reduce initial bundle size by ~300KB
 * Shows loading skeleton while the component is being loaded
 *
 * @see MindmapCanvas for the actual implementation
 * @see MindmapSkeleton for the loading state
 */

import dynamic from 'next/dynamic';
import { MindmapSkeleton } from './MindmapSkeleton';

/**
 * Dynamically imported MindmapCanvas component
 *
 * Benefits:
 * - Reduces initial bundle size by ~300KB (ReactFlow + dependencies)
 * - Improves page load performance
 * - SSR disabled as ReactFlow doesn't need server-side rendering
 *
 * @example
 * ```tsx
 * import MindmapCanvas from '@/components/mindmap/MindmapCanvasDynamic';
 *
 * <MindmapCanvas
 *   projectId={projectId}
 *   workspaceId={workspaceId}
 *   mindmapId={mindmapId}
 * />
 * ```
 */
const MindmapCanvas = dynamic(
  () => import('./MindmapCanvas'),
  {
    loading: () => <MindmapSkeleton />,
    ssr: false, // ReactFlow doesn't need SSR
  }
);

export default MindmapCanvas;
