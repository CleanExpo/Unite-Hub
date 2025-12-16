/**
 * Industrial UI Theme Package
 *
 * This package provides a complete industrial design system for Unite-Hub and Synthex.
 * It is designed as an opt-in, parallel system that does not break existing designs.
 *
 * Usage:
 * 1. Import components: import { IndustrialCard } from '@unite-hub/ui-industrial/components'
 * 2. Add Tailwind preset: import preset from '@unite-hub/ui-industrial/tailwind'
 * 3. Import globals: import '@unite-hub/ui-industrial/styles'
 * 4. Enable on layout: document.documentElement.dataset.theme = 'industrial'
 *
 * Design Philosophy:
 * - Heavy metal aesthetic with rust accents
 * - Explicit opt-in (data-theme="industrial" on root)
 * - No implicit overrides
 * - Coexists with existing Synthex theme
 * - Production-safe, non-breaking deployment
 */

export * from './components/index';
