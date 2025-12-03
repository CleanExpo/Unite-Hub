'use client';

import { useState } from 'react';

export function HeroVideoPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <div className="relative w-full aspect-video rounded-xl overflow-hidden shadow-2xl bg-black mb-8 group">
      {/* Video Embed (Vimeo recommended for better performance) */}
      {isPlaying ? (
        <iframe
          src="https://player.vimeo.com/video/placeholder?h=8cc0d9b1d8&autoplay=1"
          width="100%"
          height="100%"
          frameBorder="0"
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
          className="w-full h-full"
          title="Synthex AI Marketing Platform Demo"
        />
      ) : (
        <>
          {/* Thumbnail Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#051224] to-[#0d2a5c] flex items-center justify-center">
            {/* Placeholder text while video loads */}
            <div className="text-center">
              <div className="text-white/40 text-sm mb-2">Product Demo (60 seconds)</div>
              <svg className="w-20 h-20 text-white/20 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
              </svg>
            </div>
          </div>

          {/* Play Button Overlay */}
          <button
            onClick={() => setIsPlaying(true)}
            className="absolute inset-0 flex items-center justify-center group hover:bg-black/20 transition-colors z-10"
            aria-label="Play video"
            type="button"
          >
            <div className="w-20 h-20 bg-accent-500 rounded-full flex items-center justify-center group-hover:bg-accent-400 group-hover:scale-110 transition-all transform shadow-2xl">
              <svg className="w-10 h-10 text-white ml-1" fill="currentColor" viewBox="0 0 20 20">
                <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
              </svg>
            </div>
          </button>
        </>
      )}

      {/* Video Schema Markup */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org/",
          "@type": "VideoObject",
          "name": "Synthex AI Marketing Platform - 60 Second Product Demo",
          "description": "See how Synthex automates your marketing with AI. Email arrives → AI analyzes → Contact scores → Hot leads automatically.",
          "thumbnailUrl": "https://unite-hub.vercel.app/video-thumbnail.jpg",
          "uploadDate": new Date().toISOString().split('T')[0],
          "duration": "PT1M",
          "contentUrl": "https://vimeo.com/placeholder",
          "embedUrl": "https://player.vimeo.com/video/placeholder"
        })}
      </script>
    </div>
  );
}
