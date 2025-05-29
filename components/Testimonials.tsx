"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight, Quote } from "lucide-react"

type Testimonial = {
  id: number
  content: string
  author: string
  role: string
  company: string
  initials: string
}

const testimonials: Testimonial[] = [
  {
    id: 1,
    content:
      "Auto AGI Builder cut our requirements gathering phase by 65% and helped us identify critical features we would have missed.",
    author: "Sarah Frost",
    role: "CTO",
    company: "TechVision Inc.",
    initials: "SF",
  },
  {
    id: 2,
    content:
      "The prototype generation feature saved us weeks of development time. Our stakeholders could see and interact with the concept immediately.",
    author: "Mike Johnson",
    role: "Product Manager",
    company: "InnoSoft",
    initials: "MJ",
  },
  {
    id: 3,
    content:
      "The ROI calculator helped us justify our development budget to stakeholders with clear metrics and projections.",
    author: "Rebecca Lee",
    role: "CEO",
    company: "StartupEdge",
    initials: "RL",
  },
  {
    id: 4,
    content: "We've reduced our development time by 40% since implementing AGI Auto Builder into our workflow.",
    author: "David Chen",
    role: "Lead Developer",
    company: "CodeFusion",
    initials: "DC",
  },
]

export default function Testimonials() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const displayCount = 3
  const maxIndex = testimonials.length - displayCount

  const nextSlide = () => {
    setCurrentIndex((prevIndex) => Math.min(prevIndex + 1, maxIndex))
  }

  const prevSlide = () => {
    setCurrentIndex((prevIndex) => Math.max(prevIndex - 1, 0))
  }

  const visibleTestimonials = testimonials.slice(currentIndex, currentIndex + displayCount)

  return (
    <section className="py-16 bg-agi-dark">
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex items-center justify-between mb-12">
          <h2 className="text-3xl font-bold text-agi-blue">What Our Users Say</h2>
          <div className="flex space-x-2">
            <button
              onClick={prevSlide}
              disabled={currentIndex === 0}
              className={`p-2 rounded-full ${currentIndex === 0 ? "text-gray-500 cursor-not-allowed" : "text-white hover:bg-agi-dark-light"}`}
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              onClick={nextSlide}
              disabled={currentIndex === maxIndex}
              className={`p-2 rounded-full ${currentIndex === maxIndex ? "text-gray-500 cursor-not-allowed" : "text-white hover:bg-agi-dark-light"}`}
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {visibleTestimonials.map((testimonial) => (
            <div key={testimonial.id} className="rounded bg-agi-dark-light p-6 relative">
              <Quote className="absolute top-4 right-4 h-6 w-6 text-agi-blue opacity-30" />
              <p className="text-gray-300 mb-6 text-sm">{testimonial.content}</p>
              <div className="flex items-center">
                <div className="h-10 w-10 rounded-full bg-gray-700 flex items-center justify-center text-agi-blue font-semibold mr-3">
                  {testimonial.initials}
                </div>
                <div>
                  <h4 className="font-semibold">{testimonial.author}</h4>
                  <p className="text-xs text-gray-400">
                    {testimonial.role}, {testimonial.company}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
