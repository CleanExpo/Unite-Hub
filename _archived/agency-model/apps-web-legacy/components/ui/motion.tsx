"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/* ----------------------------------------
   Animation Types
   ---------------------------------------- */
type AnimationVariant =
  | "fade-in"
  | "fade-out"
  | "slide-up"
  | "slide-down"
  | "slide-left"
  | "slide-right"
  | "scale-in"
  | "scale-out"
  | "bounce-in";

type AnimationDuration = "fast" | "normal" | "slow";
type AnimationEasing = "spring" | "smooth" | "bounce" | "out-expo";

/* ----------------------------------------
   Base Motion Props
   ---------------------------------------- */
interface MotionProps {
  animation?: AnimationVariant;
  duration?: AnimationDuration;
  easing?: AnimationEasing;
  delay?: number;
  once?: boolean;
}

/* ----------------------------------------
   FadeIn Component
   ---------------------------------------- */
interface FadeInProps
  extends React.HTMLAttributes<HTMLDivElement>,
    Omit<MotionProps, "animation"> {
  as?: React.ElementType;
}

const FadeIn = React.forwardRef<HTMLDivElement, FadeInProps>(
  (
    {
      className,
      as: Component = "div",
      duration = "normal",
      easing = "smooth",
      delay = 0,
      style,
      ...props
    },
    ref
  ) => (
    <Component
      ref={ref}
      className={cn("animate-fade-in", className)}
      style={{
        animationDuration: `var(--duration-${duration})`,
        animationTimingFunction: `var(--ease-${easing})`,
        animationDelay: delay ? `${delay}ms` : undefined,
        animationFillMode: "both",
        ...style,
      }}
      {...props}
    />
  )
);
FadeIn.displayName = "FadeIn";

/* ----------------------------------------
   SlideUp Component
   ---------------------------------------- */
interface SlideUpProps
  extends React.HTMLAttributes<HTMLDivElement>,
    Omit<MotionProps, "animation"> {
  as?: React.ElementType;
}

const SlideUp = React.forwardRef<HTMLDivElement, SlideUpProps>(
  (
    {
      className,
      as: Component = "div",
      duration = "normal",
      easing = "out-expo",
      delay = 0,
      style,
      ...props
    },
    ref
  ) => (
    <Component
      ref={ref}
      className={cn("animate-slide-up", className)}
      style={{
        animationDuration: `var(--duration-${duration})`,
        animationTimingFunction: `var(--ease-${easing})`,
        animationDelay: delay ? `${delay}ms` : undefined,
        animationFillMode: "both",
        ...style,
      }}
      {...props}
    />
  )
);
SlideUp.displayName = "SlideUp";

/* ----------------------------------------
   SlideDown Component
   ---------------------------------------- */
interface SlideDownProps
  extends React.HTMLAttributes<HTMLDivElement>,
    Omit<MotionProps, "animation"> {
  as?: React.ElementType;
}

const SlideDown = React.forwardRef<HTMLDivElement, SlideDownProps>(
  (
    {
      className,
      as: Component = "div",
      duration = "normal",
      easing = "out-expo",
      delay = 0,
      style,
      ...props
    },
    ref
  ) => (
    <Component
      ref={ref}
      className={cn("animate-slide-down", className)}
      style={{
        animationDuration: `var(--duration-${duration})`,
        animationTimingFunction: `var(--ease-${easing})`,
        animationDelay: delay ? `${delay}ms` : undefined,
        animationFillMode: "both",
        ...style,
      }}
      {...props}
    />
  )
);
SlideDown.displayName = "SlideDown";

/* ----------------------------------------
   ScaleIn Component
   ---------------------------------------- */
interface ScaleInProps
  extends React.HTMLAttributes<HTMLDivElement>,
    Omit<MotionProps, "animation"> {
  as?: React.ElementType;
}

const ScaleIn = React.forwardRef<HTMLDivElement, ScaleInProps>(
  (
    {
      className,
      as: Component = "div",
      duration = "fast",
      easing = "spring",
      delay = 0,
      style,
      ...props
    },
    ref
  ) => (
    <Component
      ref={ref}
      className={cn("animate-scale-in", className)}
      style={{
        animationDuration: `var(--duration-${duration})`,
        animationTimingFunction: `var(--ease-${easing})`,
        animationDelay: delay ? `${delay}ms` : undefined,
        animationFillMode: "both",
        ...style,
      }}
      {...props}
    />
  )
);
ScaleIn.displayName = "ScaleIn";

/* ----------------------------------------
   BounceIn Component
   ---------------------------------------- */
interface BounceInProps
  extends React.HTMLAttributes<HTMLDivElement>,
    Omit<MotionProps, "animation"> {
  as?: React.ElementType;
}

const BounceIn = React.forwardRef<HTMLDivElement, BounceInProps>(
  (
    {
      className,
      as: Component = "div",
      duration = "slow",
      easing = "spring",
      delay = 0,
      style,
      ...props
    },
    ref
  ) => (
    <Component
      ref={ref}
      className={cn("animate-bounce-in", className)}
      style={{
        animationDuration: `var(--duration-${duration})`,
        animationTimingFunction: `var(--ease-${easing})`,
        animationDelay: delay ? `${delay}ms` : undefined,
        animationFillMode: "both",
        ...style,
      }}
      {...props}
    />
  )
);
BounceIn.displayName = "BounceIn";

/* ----------------------------------------
   Stagger Container Component
   ---------------------------------------- */
interface StaggerProps extends React.HTMLAttributes<HTMLDivElement> {
  staggerDelay?: number;
  as?: React.ElementType;
}

const Stagger = React.forwardRef<HTMLDivElement, StaggerProps>(
  (
    { className, as: Component = "div", staggerDelay = 100, children, ...props },
    ref
  ) => {
    const staggeredChildren = React.Children.map(children, (child, index) => {
      if (React.isValidElement(child)) {
        return React.cloneElement(child as React.ReactElement<{ style?: React.CSSProperties }>, {
          style: {
            ...(child.props as { style?: React.CSSProperties }).style,
            animationDelay: `${index * staggerDelay}ms`,
            animationFillMode: "both",
          },
        });
      }
      return child;
    });

    return (
      <Component ref={ref} className={className} {...props}>
        {staggeredChildren}
      </Component>
    );
  }
);
Stagger.displayName = "Stagger";

/* ----------------------------------------
   Motion Wrapper Component (Generic)
   ---------------------------------------- */
interface MotionDivProps
  extends React.HTMLAttributes<HTMLDivElement>,
    MotionProps {
  as?: React.ElementType;
}

const Motion = React.forwardRef<HTMLDivElement, MotionDivProps>(
  (
    {
      className,
      as: Component = "div",
      animation = "fade-in",
      duration = "normal",
      easing = "smooth",
      delay = 0,
      style,
      ...props
    },
    ref
  ) => (
    <Component
      ref={ref}
      className={cn(`animate-${animation}`, className)}
      style={{
        animationDuration: `var(--duration-${duration})`,
        animationTimingFunction: `var(--ease-${easing})`,
        animationDelay: delay ? `${delay}ms` : undefined,
        animationFillMode: "both",
        ...style,
      }}
      {...props}
    />
  )
);
Motion.displayName = "Motion";

/* ----------------------------------------
   Hover Scale Component
   ---------------------------------------- */
interface HoverScaleProps extends React.HTMLAttributes<HTMLDivElement> {
  scale?: number;
  as?: React.ElementType;
}

const HoverScale = React.forwardRef<HTMLDivElement, HoverScaleProps>(
  ({ className, as: Component = "div", scale = 1.02, style, ...props }, ref) => (
    <Component
      ref={ref}
      className={cn(
        "transition-transform duration-normal ease-smooth",
        className
      )}
      style={{
        ...style,
        // CSS custom property for hover scale
        "--hover-scale": scale,
      } as React.CSSProperties}
      onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => {
        (e.currentTarget as HTMLElement).style.transform = `scale(${scale})`;
      }}
      onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => {
        (e.currentTarget as HTMLElement).style.transform = "scale(1)";
      }}
      {...props}
    />
  )
);
HoverScale.displayName = "HoverScale";

/* ----------------------------------------
   Hover Lift Component
   ---------------------------------------- */
interface HoverLiftProps extends React.HTMLAttributes<HTMLDivElement> {
  lift?: number;
  as?: React.ElementType;
}

const HoverLift = React.forwardRef<HTMLDivElement, HoverLiftProps>(
  ({ className, as: Component = "div", lift = 4, ...props }, ref) => (
    <Component
      ref={ref}
      className={cn(
        "transition-all duration-normal ease-smooth hover:shadow-lg",
        className
      )}
      style={{
        // Using CSS for the hover effect
        transform: "translateY(0)",
      }}
      onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => {
        (e.currentTarget as HTMLElement).style.transform = `translateY(-${lift}px)`;
      }}
      onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => {
        (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
      }}
      {...props}
    />
  )
);
HoverLift.displayName = "HoverLift";

/* ----------------------------------------
   Pulse Component
   ---------------------------------------- */
const Pulse = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("animate-pulse-soft", className)}
    {...props}
  />
));
Pulse.displayName = "Pulse";

/* ----------------------------------------
   Float Component
   ---------------------------------------- */
const Float = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("animate-float", className)} {...props} />
));
Float.displayName = "Float";

export {
  FadeIn,
  SlideUp,
  SlideDown,
  ScaleIn,
  BounceIn,
  Stagger,
  Motion,
  HoverScale,
  HoverLift,
  Pulse,
  Float,
  type MotionProps,
  type AnimationVariant,
  type AnimationDuration,
  type AnimationEasing,
};
