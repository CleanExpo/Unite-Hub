import Image from 'next/image';
import { VideoPlayer } from './_components/VideoPlayer'; // Assuming you create a separate component
import { SynthexVideoJsonLd } from './_components/SynthexJsonLd'; // For structured data

export default function SynthexPage() {
  return (
    <>
      {/* For SEO: Add JSON-LD structured data to the head */}
      <SynthexVideoJsonLd />

      <main className="bg-gray-900 text-white">
        {/* Hero Section */}
        <section className="relative w-full aspect-[16/9] overflow-hidden">
          <Image
            src="/placeholders/synthex-hero.png"
            alt="Autonomous marketing dashboard with GBP map pack for Australian SMBs"
            fill
            priority
            className="object-cover"
          />
          <div className="absolute inset-0 bg-black/30" />
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
            {/* You can add headline text over the image here */}
            <h1 className="text-4xl md:text-6xl font-bold">
              Autonomous Marketing for Your Business
            </h1>
            <p className="mt-4 text-lg md:text-xl max-w-2xl">
              Let Synthex handle your SEO, GBP, and social presence, so you can focus on what you do best.
            </p>
          </div>
        </section>

        {/* Video Section */}
        <section className="py-12 md:py-20 px-4">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-8">See It In Action</h2>
            <VideoPlayer />
          </div>
        </section>

        {/* 
          Industries Collage Section (Optional) 
          Uncomment this section if you generate and decide to use the industries collage.
        */}
        {/*
        <section className="py-12 md:py-20 bg-gray-800 px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-8">
              Powering Australian Small Businesses
            </h2>
            <div className="relative aspect-[16/9] rounded-lg overflow-hidden shadow-2xl">
              <Image
                src="/placeholders/synthex-industries.png"
                alt="Grid of Australian small business scenes with location pins"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </section>
        */}
      </main>
    </>
  );
}