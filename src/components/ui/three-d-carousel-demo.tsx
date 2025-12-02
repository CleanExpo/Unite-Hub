import ThreeDPhotoCarousel from "./three-d-carousel"

export function ThreeDPhotoCarouselDemo() {
  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="min-h-[500px] flex flex-col justify-center border border-dashed rounded-lg space-y-4">
        <div className="p-2">
          <ThreeDPhotoCarousel
            autoPlay={true}
            autoPlayInterval={5000}
            showTitles={true}
            showDescriptions={true}
          />
        </div>
      </div>
    </div>
  )
}
