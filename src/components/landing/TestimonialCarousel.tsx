'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Quote, Star } from 'lucide-react';

export interface Testimonial {
  quote: string;
  author: string;
  role: string;
  company?: string;
  avatar?: string;
  rating?: number;
}

export interface TestimonialCarouselProps {
  testimonials: Testimonial[];
  title?: string;
  subtitle?: string;
  autoPlay?: boolean;
  autoPlayInterval?: number;
  showRating?: boolean;
  variant?: 'default' | 'compact';
  className?: string;
}

/**
 * Testimonial Carousel Component
 *
 * Displays customer testimonials in a carousel format.
 * Supports auto-play and manual navigation.
 *
 * @example
 * ```tsx
 * <TestimonialCarousel
 *   title="What Our Customers Say"
 *   subtitle="Real results from real businesses"
 *   testimonials={[
 *     {
 *       quote: "Unite-Hub transformed how we handle leads. 10x productivity!",
 *       author: "Sarah Chen",
 *       role: "Marketing Director",
 *       company: "TechCorp",
 *       avatar: "/avatars/sarah.jpg",
 *       rating: 5
 *     }
 *   ]}
 *   autoPlay={true}
 *   showRating={true}
 * />
 * ```
 */
export function TestimonialCarousel({
  testimonials,
  title,
  subtitle,
  autoPlay = false,
  autoPlayInterval = 5000,
  showRating = true,
  variant = 'default',
  className = '',
}: TestimonialCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!autoPlay || testimonials.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, autoPlayInterval);

    return () => clearInterval(interval);
  }, [autoPlay, autoPlayInterval, testimonials.length]);

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  if (testimonials.length === 0) return null;

  const currentTestimonial = testimonials[currentIndex];

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className={`mb-20 ${className}`}>
      {(title || subtitle) && (
        <div className="text-center mb-12">
          {title && <h2 className="text-3xl font-bold mb-4">{title}</h2>}
          {subtitle && (
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {subtitle}
            </p>
          )}
        </div>
      )}

      <div className="max-w-4xl mx-auto">
        <Card className={variant === 'default' ? 'border-primary/20 shadow-lg' : ''}>
          <CardContent className="pt-12 pb-8">
            <div className="relative">
              {/* Quote Icon */}
              <Quote className="h-12 w-12 text-primary/20 absolute -top-6 -left-2" />

              {/* Rating */}
              {showRating && currentTestimonial.rating && (
                <div className="flex gap-1 mb-4 justify-center">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-5 w-5 ${
                        i < currentTestimonial.rating!
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-muted-foreground'
                      }`}
                    />
                  ))}
                </div>
              )}

              {/* Quote */}
              <blockquote className="text-xl md:text-2xl font-medium text-center mb-8 text-foreground">
                "{currentTestimonial.quote}"
              </blockquote>

              {/* Author */}
              <div className="flex items-center justify-center gap-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={currentTestimonial.avatar} alt={currentTestimonial.author} />
                  <AvatarFallback>{getInitials(currentTestimonial.author)}</AvatarFallback>
                </Avatar>
                <div className="text-left">
                  <div className="font-semibold">{currentTestimonial.author}</div>
                  <div className="text-sm text-muted-foreground">
                    {currentTestimonial.role}
                    {currentTestimonial.company && ` at ${currentTestimonial.company}`}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Navigation */}
        {testimonials.length > 1 && (
          <div className="flex items-center justify-center gap-4 mt-6">
            <Button
              variant="outline"
              size="icon"
              onClick={goToPrevious}
              aria-label="Previous testimonial"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            {/* Dots */}
            <div className="flex gap-2">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`h-2 w-2 rounded-full transition-all ${
                    index === currentIndex
                      ? 'bg-primary w-8'
                      : 'bg-muted-foreground/30'
                  }`}
                  aria-label={`Go to testimonial ${index + 1}`}
                />
              ))}
            </div>

            <Button
              variant="outline"
              size="icon"
              onClick={goToNext}
              aria-label="Next testimonial"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
