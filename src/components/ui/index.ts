/**
 * UI Components - Primitive Components
 *
 * Barrel export for all primitive UI components.
 * Uses 100% design tokens - no hardcoded values.
 */

// Core Components
export { Button, type ButtonProps } from './Button';
export { Card, type CardProps } from './Card';
export { Input, type InputProps } from './Input';
export { Badge, type BadgeProps } from './Badge';
export { Icon, type IconProps } from './Icon';
export { Link, type LinkProps } from './Link';

// Week 4: Premium Radix UI Primitives
export { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from './accordion';
export { HoverCard, HoverCardTrigger, HoverCardContent } from './hover-card';
export { Toggle, toggleVariants } from './toggle';
export { ToggleGroup, ToggleGroupItem } from './toggle-group';
export {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuContent,
  NavigationMenuTrigger,
  NavigationMenuLink,
  NavigationMenuIndicator,
  NavigationMenuViewport,
  navigationMenuTriggerStyle,
} from './navigation-menu';
export {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuCheckboxItem,
  ContextMenuRadioItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuGroup,
  ContextMenuPortal,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuRadioGroup,
} from './context-menu';
export {
  Drawer,
  DrawerPortal,
  DrawerOverlay,
  DrawerTrigger,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
} from './drawer';

// Week 4: Premium Landing Page Components (StyleUI patterns)
export { HeroSection } from './hero-section';
export { FeatureGrid } from './feature-grid';
export { TestimonialCarousel } from './testimonial-carousel';
export { PricingSection } from './pricing-section';
export { CTASection } from './cta-section';

// Week 4: Dashboard Micro-Interactions (KokonutUI patterns)
export { AnimatedStats } from './animated-stats';
