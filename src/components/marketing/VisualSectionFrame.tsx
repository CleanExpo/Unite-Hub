"use client";

/**
 * Visual Section Frame Component
 * Phase 10: UX-02 Visual System Integration
 *
 * Reusable section wrapper with persona-adaptive styling and visual backgrounds
 */

import { useState, useEffect, ReactNode } from "react";
import Image from "next/image";
import { selectVisualProfile, VisualProfile } from "@/lib/visual/visualStyleMatrix";
import { getPersona } from "@/lib/visual/visualPersonas";

export interface VisualSectionFrameProps {
  // Content
  children: ReactNode;
  sectionId: string;

  // Persona & Style
  personaId?: string;
  variant?: "hero" | "feature" | "testimonial" | "cta" | "stats" | "pricing";

  // Visual options
  backgroundType?: "gradient" | "image" | "pattern" | "solid";
  backgroundImage?: string;
  backgroundImageAlt?: string;
  overlayOpacity?: number;

  // Layout
  padding?: "none" | "small" | "medium" | "large";
  maxWidth?: "sm" | "md" | "lg" | "xl" | "full";
  textAlign?: "left" | "center" | "right";

  // Animation
  animateOnScroll?: boolean;
  animationDelay?: number;

  // Test mode
  isTestMode?: boolean;

  // Custom class
  className?: string;
}

// Variant-specific default configurations
const VARIANT_CONFIGS: Record<string, Partial<VisualSectionFrameProps>> = {
  hero: {
    padding: "large",
    maxWidth: "xl",
    textAlign: "center",
    backgroundType: "gradient",
    overlayOpacity: 0.3,
  },
  feature: {
    padding: "large",
    maxWidth: "lg",
    textAlign: "left",
    backgroundType: "solid",
    overlayOpacity: 0,
  },
  testimonial: {
    padding: "medium",
    maxWidth: "lg",
    textAlign: "center",
    backgroundType: "pattern",
    overlayOpacity: 0.1,
  },
  cta: {
    padding: "large",
    maxWidth: "md",
    textAlign: "center",
    backgroundType: "gradient",
    overlayOpacity: 0.4,
  },
  stats: {
    padding: "medium",
    maxWidth: "xl",
    textAlign: "center",
    backgroundType: "solid",
    overlayOpacity: 0,
  },
  pricing: {
    padding: "large",
    maxWidth: "xl",
    textAlign: "center",
    backgroundType: "gradient",
    overlayOpacity: 0.2,
  },
};

// Padding configurations
const PADDING_CLASSES = {
  none: "py-0",
  small: "py-8 md:py-12",
  medium: "py-12 md:py-16",
  large: "py-16 md:py-24",
};

// Max width configurations
const MAX_WIDTH_CLASSES = {
  sm: "max-w-2xl",
  md: "max-w-4xl",
  lg: "max-w-5xl",
  xl: "max-w-7xl",
  full: "max-w-full",
};

// Text alignment configurations
const TEXT_ALIGN_CLASSES = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
};

export function VisualSectionFrame({
  children,
  sectionId,
  personaId,
  variant = "feature",
  backgroundType,
  backgroundImage,
  backgroundImageAlt = "Section background",
  overlayOpacity,
  padding,
  maxWidth,
  textAlign,
  animateOnScroll = true,
  animationDelay = 0,
  isTestMode = false,
  className = "",
}: VisualSectionFrameProps) {
  const [profile, setProfile] = useState<VisualProfile | null>(null);
  const [isVisible, setIsVisible] = useState(!animateOnScroll);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Get variant defaults
  const variantConfig = VARIANT_CONFIGS[variant] || VARIANT_CONFIGS.feature;

  // Merge props with variant defaults
  const finalBackgroundType = backgroundType ?? variantConfig.backgroundType;
  const finalOverlayOpacity = overlayOpacity ?? variantConfig.overlayOpacity ?? 0;
  const finalPadding = padding ?? variantConfig.padding ?? "medium";
  const finalMaxWidth = maxWidth ?? variantConfig.maxWidth ?? "lg";
  const finalTextAlign = textAlign ?? variantConfig.textAlign ?? "left";

  useEffect(() => {
    // Select visual profile based on persona
    const selectedProfile = selectVisualProfile(personaId || null, {
      preferDarkMode: variant === "hero" || variant === "cta",
    });
    setProfile(selectedProfile);
  }, [personaId, variant]);

  // Intersection observer for scroll animations
  useEffect(() => {
    if (!animateOnScroll) {
return;
}

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setIsVisible(true), animationDelay);
        }
      },
      { threshold: 0.1 }
    );

    const element = document.getElementById(sectionId);
    if (element) {
observer.observe(element);
}

    return () => observer.disconnect();
  }, [sectionId, animateOnScroll, animationDelay]);

  const persona = getPersona(personaId);

  // Generate background styles based on profile and type
  const getBackgroundStyles = (): React.CSSProperties => {
    if (!profile) {
      return { backgroundColor: "#f8f9fa" };
    }

    const primary = profile.cssVariables["--primary"] || "#347bf7";
    const background = profile.cssVariables["--background"] || "#ffffff";
    const muted = profile.cssVariables["--muted"] || "#f4f7fa";

    switch (finalBackgroundType) {
      case "gradient":
        if (variant === "hero" || variant === "cta") {
          return {
            background: `linear-gradient(135deg, ${background} 0%, ${muted} 50%, ${background} 100%)`,
          };
        }
        return {
          background: `linear-gradient(180deg, ${muted} 0%, ${background} 100%)`,
        };

      case "pattern":
        return {
          backgroundColor: muted,
          backgroundImage: `
            radial-gradient(circle at 25% 25%, ${primary}08 0%, transparent 50%),
            radial-gradient(circle at 75% 75%, ${primary}08 0%, transparent 50%)
          `,
        };

      case "solid":
        return {
          backgroundColor: background,
        };

      case "image":
        return {}; // Handled by Image component

      default:
        return { backgroundColor: background };
    }
  };

  // Get text color based on background type and profile
  const getTextColorClass = (): string => {
    if (!profile) {
return "text-gray-900";
}

    const background = profile.cssVariables["--background"] || "#ffffff";
    const isDark = isColorDark(background);

    return isDark ? "text-white" : "text-gray-900";
  };

  // Helper to determine if color is dark
  const isColorDark = (color: string): boolean => {
    if (color.startsWith("#")) {
      const hex = color.slice(1);
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      return luminance < 0.5;
    }
    return false;
  };

  return (
    <section
      id={sectionId}
      className={`
        relative overflow-hidden
        ${PADDING_CLASSES[finalPadding]}
        ${getTextColorClass()}
        ${className}
        ${animateOnScroll ? "transition-all duration-700" : ""}
        ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}
      `}
      style={getBackgroundStyles()}
      data-persona={persona.id}
      data-variant={variant}
    >
      {/* Background Image (if provided) */}
      {finalBackgroundType === "image" && backgroundImage && (
        <div className="absolute inset-0">
          <Image
            src={backgroundImage}
            alt={backgroundImageAlt}
            fill
            className={`object-cover transition-opacity duration-500 ${
              imageLoaded ? "opacity-100" : "opacity-0"
            }`}
            onLoad={() => setImageLoaded(true)}
            priority={variant === "hero"}
          />
          {/* Overlay */}
          <div
            className="absolute inset-0"
            style={{ backgroundColor: `rgba(0,0,0,${finalOverlayOpacity})` }}
          />
        </div>
      )}

      {/* Gradient overlay for non-image backgrounds */}
      {finalBackgroundType !== "image" && finalOverlayOpacity > 0 && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `linear-gradient(180deg, transparent 0%, rgba(0,0,0,${finalOverlayOpacity}) 100%)`,
          }}
        />
      )}

      {/* Pattern overlay */}
      {finalBackgroundType === "pattern" && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              "repeating-linear-gradient(45deg, rgba(0,0,0,0.02) 0px, transparent 2px, transparent 40px)",
          }}
        />
      )}

      {/* Content Container */}
      <div
        className={`
          relative z-10
          ${MAX_WIDTH_CLASSES[finalMaxWidth]}
          mx-auto px-4 sm:px-6 lg:px-8
          ${TEXT_ALIGN_CLASSES[finalTextAlign]}
        `}
      >
        {children}
      </div>

      {/* Test mode watermark */}
      {isTestMode && (
        <div className="absolute top-2 left-2 text-xs text-gray-400 bg-gray-100/50 px-2 py-1 rounded">
          TEST: {sectionId}
        </div>
      )}
    </section>
  );
}

export default VisualSectionFrame;
