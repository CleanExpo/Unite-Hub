 
"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface CarouselImage {
  id: string
  src: string
  alt: string
  title: string
  description?: string
}

const defaultImages: CarouselImage[] = [
  {
    id: "1",
    src: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=600&fit=crop",
    alt: "Team collaboration",
    title: "Collaborate Better",
    description: "Work together seamlessly across your organization"
  },
  {
    id: "2",
    src: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=600&fit=crop",
    alt: "Dashboard analytics",
    title: "Analytics at a Glance",
    description: "See all your important metrics in real-time"
  },
  {
    id: "3",
    src: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=600&fit=crop",
    alt: "Mobile responsive",
    title: "Mobile Ready",
    description: "Access everything on any device"
  }
]

export interface ThreeDPhotoCarouselProps {
  images?: CarouselImage[]
  autoPlay?: boolean
  autoPlayInterval?: number
  showTitles?: boolean
  showDescriptions?: boolean
}

export default function ThreeDPhotoCarousel({
  images = defaultImages,
  autoPlay = true,
  autoPlayInterval = 5000,
  showTitles = true,
  showDescriptions = true
}: ThreeDPhotoCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [direction, setDirection] = useState(1)

  useEffect(() => {
    if (!autoPlay) {
return
}

    const interval = setInterval(() => {
      setDirection(1)
      setCurrentIndex((prev) => (prev + 1) % images.length)
    }, autoPlayInterval)

    return () => clearInterval(interval)
  }, [autoPlay, autoPlayInterval, images.length])

  const handlePrev = () => {
    setDirection(-1)
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length)
  }

  const handleNext = () => {
    setDirection(1)
    setCurrentIndex((prev) => (prev + 1) % images.length)
  }

  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 1000 : -1000,
      opacity: 0
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1
    },
    exit: (dir: number) => ({
      zIndex: 0,
      x: dir < 0 ? 1000 : -1000,
      opacity: 0
    })
  }

  const imageVariants = {
    enter: (dir: number) => ({
      rotateY: dir > 0 ? 45 : -45,
      opacity: 0,
      scale: 0.8
    }),
    center: {
      rotateY: 0,
      opacity: 1,
      scale: 1
    },
    exit: (dir: number) => ({
      rotateY: dir < 0 ? 45 : -45,
      opacity: 0,
      scale: 0.8
    })
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-gradient-to-br from-slate-900 to-slate-800 shadow-2xl">
        {/* Main carousel container */}
        <div className="relative w-full h-full flex items-center justify-center perspective">
          <AnimatePresence initial={false} custom={direction} mode="wait">
            <motion.div
              key={currentIndex}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: "spring", stiffness: 300, damping: 30 },
                opacity: { duration: 0.2 }
              }}
              className="absolute w-full h-full flex items-center justify-center"
              style={{
                perspective: "1000px"
              }}
            >
              <motion.div
                custom={direction}
                variants={imageVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{
                  rotateY: { type: "spring", stiffness: 300, damping: 30 },
                  opacity: { duration: 0.2 },
                  scale: { type: "spring", stiffness: 300, damping: 30 }
                }}
                className="w-full h-full flex items-center justify-center"
                style={{
                  transformStyle: "preserve-3d"
                }}
              >
                <img
                  src={images[currentIndex]?.src}
                  alt={images[currentIndex]?.alt}
                  className="w-full h-full object-cover"
                />
              </motion.div>

              {/* Overlay gradient for text */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

              {/* Text content */}
              {(showTitles || showDescriptions) && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  transition={{ delay: 0.2, duration: 0.3 }}
                  className="absolute bottom-0 left-0 right-0 p-8 text-white z-10"
                >
                  {showTitles && (
                    <h2 className="text-3xl md:text-4xl font-bold mb-2">
                      {images[currentIndex]?.title}
                    </h2>
                  )}
                  {showDescriptions && images[currentIndex]?.description && (
                    <p className="text-lg text-white/90 max-w-2xl">
                      {images[currentIndex]?.description}
                    </p>
                  )}
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation buttons */}
          <button
            onClick={handlePrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-white/20 hover:bg-white/40 text-white rounded-full p-3 transition-colors backdrop-blur-sm group"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
          </button>

          <button
            onClick={handleNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-white/20 hover:bg-white/40 text-white rounded-full p-3 transition-colors backdrop-blur-sm group"
            aria-label="Next slide"
          >
            <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
          </button>

          {/* Indicators */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
            {images.map((_, index) => (
              <motion.button
                key={index}
                onClick={() => {
                  setDirection(index > currentIndex ? 1 : -1)
                  setCurrentIndex(index)
                }}
                className={`rounded-full transition-all ${
                  index === currentIndex
                    ? "bg-white w-8 h-2"
                    : "bg-white/50 w-2 h-2 hover:bg-white/75"
                }`}
                aria-label={`Go to slide ${index + 1}`}
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.9 }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Thumbnail strip */}
      <div className="mt-6 flex gap-3 justify-center overflow-x-auto pb-2">
        {images.map((image, index) => (
          <motion.button
            key={image.id}
            onClick={() => {
              setDirection(index > currentIndex ? 1 : -1)
              setCurrentIndex(index)
            }}
            className={`relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden transition-all ${
              index === currentIndex
                ? "ring-2 ring-teal-600 scale-105"
                : "hover:scale-105"
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <img
              src={image.src}
              alt={image.alt}
              className={`w-full h-full object-cover transition-opacity ${
                index === currentIndex ? "opacity-100" : "opacity-60 hover:opacity-80"
              }`}
            />
            {index === currentIndex && (
              <motion.div
                layoutId="indicator"
                className="absolute inset-0 bg-teal-600/20 border-2 border-teal-600 rounded-lg"
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            )}
          </motion.button>
        ))}
      </div>
    </div>
  )
}
