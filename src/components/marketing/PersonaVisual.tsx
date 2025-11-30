"use client";

/**
 * Persona Visual Component
 * Phase 10: UX-02 Visual System Integration
 *
 * Unified wrapper that pulls persona → style mix → visual prompt → generated or pre-selected asset
 * This component replaces placeholder images with persona-adaptive visuals.
 */

// Fallback placeholder as SVG data URL - teal gradient with Unite-Hub branding
const FALLBACK_PLACEHOLDER = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='450' viewBox='0 0 800 450'%3E%3Cdefs%3E%3ClinearGradient id='grad' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%2314b8a6'/%3E%3Cstop offset='100%25' style='stop-color:%230d9488'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect fill='url(%23grad)' width='800' height='450'/%3E%3Ctext x='400' y='225' text-anchor='middle' fill='white' font-family='system-ui' font-size='24' font-weight='500'%3EImage Loading...%3C/text%3E%3C/svg%3E";

import { useState, useEffect } from "react";
import Image from "next/image";
import { selectVisualProfile, VisualProfile, generateImagePrompt } from "@/lib/visual/visualStyleMatrix";
import { getPersona, detectPersonaFromContext } from "@/lib/visual/visualPersonas";
import { getSectionConfigForPersona, getSectionFallbackImage, generateSectionImagePrompt } from "@/lib/visual/visualSectionRegistry";

export interface PersonaVisualProps {
  // Section identification
  sectionId: string;

  // Persona context (auto-detected if not provided)
  personaId?: string;
  autoDetectPersona?: boolean;

  // Image overrides
  src?: string;
  alt?: string;

  // Display options
  width?: number;
  height?: number;
  fill?: boolean;
  priority?: boolean;
  quality?: number;

  // Styling
  className?: string;
  objectFit?: "contain" | "cover" | "fill" | "none" | "scale-down";
  rounded?: "none" | "sm" | "md" | "lg" | "xl" | "full";

  // Loading
  placeholder?: "blur" | "empty";
  blurDataURL?: string;

  // Overlay
  overlay?: boolean;
  overlayColor?: string;
  overlayOpacity?: number;

  // Test mode
  isTestMode?: boolean;

  // Callback when image loads
  onLoad?: () => void;
}

// Rounded corner classes
const ROUNDED_CLASSES = {
  none: "",
  sm: "rounded-sm",
  md: "rounded-md",
  lg: "rounded-lg",
  xl: "rounded-xl",
  full: "rounded-full",
};

// Low-quality image placeholder generator
function generateBlurPlaceholder(color: string = "#f0f0f0"): string {
  // Simple 10x10 solid color SVG as base64
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><rect width="10" height="10" fill="${color}"/></svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

export function PersonaVisual({
  sectionId,
  personaId,
  autoDetectPersona = true,
  src,
  alt,
  width,
  height,
  fill = false,
  priority = false,
  quality = 85,
  className = "",
  objectFit = "cover",
  rounded = "lg",
  placeholder = "empty",
  blurDataURL,
  overlay = false,
  overlayColor = "#000000",
  overlayOpacity = 0.3,
  isTestMode = false,
  onLoad,
}: PersonaVisualProps) {
  const [resolvedPersonaId, setResolvedPersonaId] = useState<string | null>(personaId || null);
  const [profile, setProfile] = useState<VisualProfile | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageSrc, setImageSrc] = useState<string>(src || "");
  const [imageAlt, setImageAlt] = useState<string>(alt || "");

  // Auto-detect persona from URL/context if enabled
  useEffect(() => {
    if (personaId) {
      setResolvedPersonaId(personaId);
      return;
    }

    if (autoDetectPersona && typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const detected = detectPersonaFromContext({
        queryParam: urlParams.get("persona"),
        utm_campaign: urlParams.get("utm_campaign"),
        referrer: document.referrer,
      });
      setResolvedPersonaId(detected);
    }
  }, [personaId, autoDetectPersona]);

  // Get visual profile and section config
  useEffect(() => {
    const selectedProfile = selectVisualProfile(resolvedPersonaId);
    setProfile(selectedProfile);

    // Get section-specific configuration
    const sectionConfig = getSectionConfigForPersona(sectionId, resolvedPersonaId);

    // Set image source (priority: prop > section fallback > default)
    if (!src) {
      const fallbackImage = getSectionFallbackImage(sectionId, resolvedPersonaId);
      setImageSrc(fallbackImage);
    } else {
      setImageSrc(src);
    }

    // Set alt text
    if (!alt && sectionConfig) {
      const persona = getPersona(resolvedPersonaId);
      setImageAlt(`${sectionConfig.label} - ${persona.label}`);
    } else if (alt) {
      setImageAlt(alt);
    } else {
      setImageAlt(`Visual for ${sectionId}`);
    }
  }, [resolvedPersonaId, sectionId, src, alt]);

  // Get blur placeholder color from profile
  const getBlurColor = (): string => {
    if (blurDataURL) return blurDataURL;
    if (!profile) return generateBlurPlaceholder("#f0f0f0");

    const muted = profile.cssVariables["--muted"] || "#f4f7fa";
    return generateBlurPlaceholder(muted);
  };

  // Handle image load
  const handleLoad = () => {
    setImageLoaded(true);
    onLoad?.();
  };

  // Generate prompt metadata for debugging
  const getPromptMetadata = () => {
    if (!isTestMode) return null;

    const prompt = generateSectionImagePrompt(sectionId, resolvedPersonaId);
    return {
      sectionId,
      personaId: resolvedPersonaId,
      dominantStyle: profile?.dominantStyle,
      prompt: prompt.slice(0, 100) + "...",
    };
  };

  // Build object-fit style
  const objectFitStyle: React.CSSProperties = fill
    ? { objectFit }
    : {};

  // Combined class names
  const combinedClassName = `
    ${ROUNDED_CLASSES[rounded]}
    ${className}
    ${!imageLoaded ? "animate-pulse bg-gray-200" : ""}
    transition-opacity duration-300
  `.trim();

  return (
    <div
      className={`relative ${fill ? "w-full h-full" : ""} ${ROUNDED_CLASSES[rounded]} overflow-hidden`}
      data-section={sectionId}
      data-persona={resolvedPersonaId}
    >
      {/* Main Image */}
      {fill ? (
        <Image
          src={imageSrc || FALLBACK_PLACEHOLDER}
          alt={imageAlt}
          fill
          priority={priority}
          quality={quality}
          className={`${combinedClassName} ${imageLoaded ? "opacity-100" : "opacity-0"}`}
          style={objectFitStyle}
          placeholder={placeholder}
          blurDataURL={placeholder === "blur" ? getBlurColor() : undefined}
          onLoad={handleLoad}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
      ) : (
        <Image
          src={imageSrc || FALLBACK_PLACEHOLDER}
          alt={imageAlt}
          width={width || 800}
          height={height || 450}
          priority={priority}
          quality={quality}
          className={`${combinedClassName} ${imageLoaded ? "opacity-100" : "opacity-0"}`}
          style={objectFitStyle}
          placeholder={placeholder}
          blurDataURL={placeholder === "blur" ? getBlurColor() : undefined}
          onLoad={handleLoad}
        />
      )}

      {/* Overlay */}
      {overlay && (
        <div
          className={`absolute inset-0 ${ROUNDED_CLASSES[rounded]}`}
          style={{
            backgroundColor: overlayColor,
            opacity: overlayOpacity,
          }}
        />
      )}

      {/* Loading placeholder */}
      {!imageLoaded && (
        <div
          className={`absolute inset-0 ${ROUNDED_CLASSES[rounded]} bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse`}
          style={fill ? {} : { width: width || 800, height: height || 450 }}
        />
      )}

      {/* Test mode debug overlay */}
      {isTestMode && (
        <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs p-2 font-mono">
          <div>Section: {sectionId}</div>
          <div>Persona: {resolvedPersonaId || "auto"}</div>
          <div>Style: {profile?.dominantStyle || "default"}</div>
          <div>Src: {imageSrc.slice(0, 30)}...</div>
        </div>
      )}
    </div>
  );
}

/**
 * Utility component for inline persona-adaptive images
 * Use this for smaller images within content
 */
export function PersonaInlineImage({
  sectionId,
  personaId,
  className = "",
  rounded = "md",
  ...props
}: Omit<PersonaVisualProps, "fill">) {
  return (
    <PersonaVisual
      sectionId={sectionId}
      personaId={personaId}
      className={className}
      rounded={rounded}
      fill={false}
      {...props}
    />
  );
}

/**
 * Utility component for full-width background images
 * Use this for section backgrounds
 */
export function PersonaBackgroundImage({
  sectionId,
  personaId,
  children,
  overlay = true,
  overlayOpacity = 0.4,
  className = "",
  ...props
}: Omit<PersonaVisualProps, "fill" | "rounded"> & {
  children?: React.ReactNode;
}) {
  return (
    <div className={`relative ${className}`}>
      <PersonaVisual
        sectionId={sectionId}
        personaId={personaId}
        fill
        rounded="none"
        overlay={overlay}
        overlayOpacity={overlayOpacity}
        priority
        {...props}
      />
      {children && (
        <div className="relative z-10">{children}</div>
      )}
    </div>
  );
}

export default PersonaVisual;
