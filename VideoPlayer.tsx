"use client"; // This component can use client-side features if needed for custom controls

export function VideoPlayer() {
  return (
    <div className="w-full aspect-video overflow-hidden rounded-lg shadow-2xl border border-gray-700">
      <video
        className="w-full h-full object-cover"
        poster="/videos/synthex-hero.jpg" // Assumes you generate a poster image
        controls
        playsInline
        preload="metadata"
      >
        <source src="/videos/synthex-hero.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>
    </div>
  );
}