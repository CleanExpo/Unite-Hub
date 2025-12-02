"use client";

/**
 * Visual Hero Component
 * Phase 10: UX-02 Visual System Integration
 *
 * Persona-adaptive hero section with visual intelligence fabric integration
 */

import { useState, useEffect } from "react";
import Image from "next/image";
import { selectVisualProfile, VisualProfile } from "@/lib/visual/visualStyleMatrix";
import { getPersona } from "@/lib/visual/visualPersonas";

export interface VisualHeroProps {
  // Content
  headline: string;
  subheadline?: string;
  badgeText?: string;
  ctaPrimary?: { text: string; href: string };
  ctaSecondary?: { text: string; href: string };

  // Persona & Style
  personaId?: string;
  businessType?: "trade" | "agency" | "nonprofit" | "professional";
  energyLevel?: "calm" | "neutral" | "high";
  visualMode?: "image_only" | "video_loop" | "mixed";

  // Image/Video sources (fallbacks)
  heroImage?: string;
  heroVideo?: string;
  heroImageAlt?: string;

  // Test mode indication
  isTestMode?: boolean;
}

export function VisualHero({
  headline,
  subheadline,
  badgeText,
  ctaPrimary,
  ctaSecondary,
  personaId,
  businessType,
  visualMode = "image_only",
  heroImage,
  heroVideo,
  heroImageAlt = "Hero visual",
  isTestMode = false,
}: VisualHeroProps) {
  const [profile, setProfile] = useState<VisualProfile | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    // Select visual profile based on persona
    const selectedProfile = selectVisualProfile(personaId || null, {
      preferDarkMode: true,
    });
    setProfile(selectedProfile);
  }, [personaId]);

  const persona = getPersona(personaId);

  // Get dynamic background gradient based on profile
  const getBackgroundGradient = () => {
    if (!profile) {
return "radial-gradient(circle at center top, #0d2a5c 0%, #051224 70%)";
}

    const background = profile.cssVariables["--background"] || "#0a1e3b";

    return `radial-gradient(circle at center top, ${background} 0%, #051224 70%)`;
  };

  // Default image based on business type - 5 WHYS human-centered images
  const getDefaultImage = () => {
    if (heroImage) {
return heroImage;
}

    // Map business type to 5 WHYS generated human-centered imagery
    const imageMap: Record<string, string> = {
      trade: "/images/generated/hero-trades-owner.jpg",
      agency: "/images/generated/hero-agency-owner.jpg",
      nonprofit: "/images/generated/hero-nonprofit-leader.jpg",
      professional: "/images/generated/hero-consultant.jpg",
    };

    return imageMap[businessType || "trade"] || "/images/generated/hero-trades-owner.jpg";
  };

  // Get alt text that's persona-aware and SEO-friendly
  const getAltText = () => {
    if (heroImageAlt && heroImageAlt !== "Hero visual") {
return heroImageAlt;
}

    const personaAlts: Record<string, string> = {
      trades_owner: "Small business owner managing marketing with AI tools",
      agency_owner: "Marketing agency dashboard showing automated workflows",
      nonprofit: "Community organization growing their online presence",
      consultant: "Professional consultant leveraging AI for client growth",
      marketing_manager: "Marketing manager analyzing AI-powered campaign results",
      anonymous: "Business owner discovering AI marketing automation",
    };

    let alt = personaAlts[persona.id] || personaAlts.anonymous;

    // Add test mode indicator for internal use (not visible to users)
    if (isTestMode) {
      alt = `[TEST ASSET] ${alt}`;
    }

    return alt;
  };

  return (
    <section
      className="relative text-white pt-40 pb-20 text-center overflow-hidden"
      style={{ background: getBackgroundGradient() }}
    >
      {/* Wave pattern overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "repeating-linear-gradient(45deg, rgba(255,255,255,0.03) 0px, transparent 2px, transparent 100px)",
        }}
      />

      <div className="max-w-[1200px] mx-auto px-5 relative">
        {/* Badge */}
        {badgeText && (
          <div className="inline-block bg-white/10 text-white px-4 py-2 rounded-full text-sm font-semibold mb-6 backdrop-blur-sm">
            {badgeText}
          </div>
        )}

        {/* Headline */}
        <h1
          className="text-5xl md:text-7xl font-extrabold mb-6 leading-tight"
          style={{
            fontWeight: profile?.typography?.headingWeight || 800,
            letterSpacing: profile?.typography?.letterSpacing || "-0.02em",
          }}
        >
          {headline}
        </h1>

        {/* Subheadline */}
        {subheadline && (
          <p className="text-xl opacity-90 max-w-[700px] mx-auto mb-12 leading-relaxed">
            {subheadline}
          </p>
        )}

        {/* CTA Buttons */}
        {(ctaPrimary || ctaSecondary) && (
          <div className="flex flex-col md:flex-row gap-4 justify-center mb-12">
            {ctaPrimary && (
              <a
                href={ctaPrimary.href}
                className="px-8 py-4 rounded-md font-bold text-lg bg-[#007bff] text-white hover:-translate-y-1 hover:shadow-xl transition-all"
                style={{ borderRadius: profile?.borderRadius || "8px" }}
              >
                {ctaPrimary.text}
              </a>
            )}
            {ctaSecondary && (
              <a
                href={ctaSecondary.href}
                className="px-8 py-4 rounded-md font-bold text-lg bg-transparent border-2 border-white/50 text-white hover:bg-white/10 hover:-translate-y-1 transition-all"
                style={{ borderRadius: profile?.borderRadius || "8px" }}
              >
                {ctaSecondary.text}
              </a>
            )}
          </div>
        )}

        {/* Hero Visual */}
        {(heroImage || heroVideo || businessType) && (
          <div className="mt-12 relative">
            {visualMode === "video_loop" && heroVideo ? (
              <div className="relative rounded-xl overflow-hidden shadow-2xl mx-auto max-w-4xl">
                <video
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-auto"
                  poster={getDefaultImage()}
                >
                  <source src={heroVideo} type="video/mp4" />
                  {/* Fallback to image */}
                  <Image
                    src={getDefaultImage()}
                    alt={getAltText()}
                    width={1200}
                    height={675}
                    className="w-full h-auto"
                    priority
                  />
                </video>
              </div>
            ) : (
              <div className="relative rounded-xl overflow-hidden shadow-2xl mx-auto max-w-4xl">
                <Image
                  src={getDefaultImage()}
                  alt={getAltText()}
                  width={1200}
                  height={675}
                  className={`w-full h-auto transition-opacity duration-500 ${
                    imageLoaded ? "opacity-100" : "opacity-0"
                  }`}
                  onLoad={() => setImageLoaded(true)}
                  priority
                />
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />

                {/* Test mode watermark (subtle, for internal use only) */}
                {isTestMode && (
                  <div className="absolute bottom-2 right-2 text-xs text-white/30 bg-black/20 px-2 py-1 rounded">
                    TEST
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center pt-2">
          <div className="w-1.5 h-3 bg-white/50 rounded-full animate-pulse" />
        </div>
      </div>
    </section>
  );
}

export default VisualHero;
