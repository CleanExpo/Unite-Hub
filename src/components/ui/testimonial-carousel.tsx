"use client"

/**
 * TestimonialCarousel Component
 *
 * Premium testimonial carousel with auto-play and manual navigation.
 * Features avatar, quote, and company branding.
 * Inspired by StyleUI patterns with Synthex design tokens.
 *
 * @example
 * <TestimonialCarousel
 *   testimonials={[
 *     {
 *       quote: "This product changed our workflow completely.",
 *       author: "Jane Doe",
 *       role: "CEO",
 *       company: "Acme Inc",
 *       avatar: "/avatars/jane.jpg"
 *     }
 *   ]}
 * />
 */

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronLeft, ChevronRight, Quote } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface Testimonial {
  /** The testimonial quote */
  quote: string
  /** Author name */
  author: string
  /** Author role/title */
  role: string
  /** Company name */
  company?: string
  /** Avatar image URL */
  avatar?: string
  /** Company logo URL */
  companyLogo?: string
}

interface TestimonialCarouselProps {
  /** Array of testimonials */
  testimonials: Testimonial[]
  /** Auto-play interval in ms (0 to disable) */
  autoPlayInterval?: number
  /** Custom className */
  className?: string
  /** Show navigation arrows */
  showArrows?: boolean
  /** Show dots navigation */
  showDots?: boolean
}

export function TestimonialCarousel({
  testimonials,
  autoPlayInterval = 5000,
  className,
  showArrows = true,
  showDots = true,
}: TestimonialCarouselProps) {
  const [currentIndex, setCurrentIndex] = React.useState(0)
  const [direction, setDirection] = React.useState(0)

  const goToNext = React.useCallback(() => {
    setDirection(1)
    setCurrentIndex((prev) => (prev + 1) % testimonials.length)
  }, [testimonials.length])

  const goToPrev = React.useCallback(() => {
    setDirection(-1)
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length)
  }, [testimonials.length])

  const goToIndex = React.useCallback((index: number) => {
    setDirection(index > currentIndex ? 1 : -1)
    setCurrentIndex(index)
  }, [currentIndex])

  // Auto-play
  React.useEffect(() => {
    if (autoPlayInterval <= 0) {
return
}

    const interval = setInterval(goToNext, autoPlayInterval)
    return () => clearInterval(interval)
  }, [autoPlayInterval, goToNext])

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 300 : -300,
      opacity: 0,
    }),
  }

  const currentTestimonial = testimonials[currentIndex]

  return (
    <section className={cn("py-20", className)}>
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="relative">
          {/* Quote icon */}
          <div className="absolute -top-4 left-0 text-accent-500/20">
            <Quote className="h-16 w-16" />
          </div>

          {/* Testimonial content */}
          <div className="relative min-h-[300px] overflow-hidden">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={currentIndex}
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{
                  x: { type: "spring", stiffness: 300, damping: 30 },
                  opacity: { duration: 0.2 },
                }}
                className="absolute inset-0 flex flex-col items-center justify-center text-center"
              >
                {/* Quote */}
                <blockquote className="text-xl font-medium leading-relaxed text-text-primary sm:text-2xl lg:text-3xl">
                  &ldquo;{currentTestimonial.quote}&rdquo;
                </blockquote>

                {/* Author info */}
                <div className="mt-8 flex flex-col items-center gap-4">
                  {currentTestimonial.avatar && (
                    <img
                      src={currentTestimonial.avatar}
                      alt={currentTestimonial.author}
                      className="h-14 w-14 rounded-full border-2 border-accent-500/20 object-cover"
                    />
                  )}
                  <div className="text-center">
                    <div className="font-semibold text-text-primary">
                      {currentTestimonial.author}
                    </div>
                    <div className="text-sm text-text-secondary">
                      {currentTestimonial.role}
                      {currentTestimonial.company && (
                        <span> at {currentTestimonial.company}</span>
                      )}
                    </div>
                  </div>
                  {currentTestimonial.companyLogo && (
                    <img
                      src={currentTestimonial.companyLogo}
                      alt={currentTestimonial.company || "Company"}
                      className="h-8 opacity-60"
                    />
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation arrows */}
          {showArrows && testimonials.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-0 top-1/2 -translate-x-full -translate-y-1/2 opacity-60 hover:opacity-100"
                onClick={goToPrev}
                aria-label="Previous testimonial"
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-0 top-1/2 translate-x-full -translate-y-1/2 opacity-60 hover:opacity-100"
                onClick={goToNext}
                aria-label="Next testimonial"
              >
                <ChevronRight className="h-6 w-6" />
              </Button>
            </>
          )}
        </div>

        {/* Dots navigation */}
        {showDots && testimonials.length > 1 && (
          <div className="mt-8 flex justify-center gap-2">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => goToIndex(index)}
                className={cn(
                  "h-2 w-2 rounded-full transition-all duration-300",
                  index === currentIndex
                    ? "w-8 bg-accent-500"
                    : "bg-border-subtle hover:bg-text-muted"
                )}
                aria-label={`Go to testimonial ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

TestimonialCarousel.displayName = "TestimonialCarousel"

export default TestimonialCarousel
