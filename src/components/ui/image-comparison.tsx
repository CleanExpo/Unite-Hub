 
"use client"

import React, { ReactNode, useRef, useState } from "react"

export interface ImageComparisonProps {
  children: ReactNode
  className?: string
}

export interface ImageComparisonImageProps {
  src: string
  alt: string
  position: "left" | "right"
}

export interface ImageComparisonSliderProps {
  className?: string
}

export function ImageComparison({ children, className = "" }: ImageComparisonProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState(50)

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) {
return
}
    const rect = containerRef.current.getBoundingClientRect()
    const newPosition = ((e.clientX - rect.left) / rect.width) * 100
    setPosition(Math.max(0, Math.min(100, newPosition)))
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!containerRef.current) {
return
}
    const rect = containerRef.current.getBoundingClientRect()
    const newPosition = ((e.touches[0].clientX - rect.left) / rect.width) * 100
    setPosition(Math.max(0, Math.min(100, newPosition)))
  }

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden cursor-col-resize ${className}`}
      onMouseMove={handleMouseMove}
      onTouchMove={handleTouchMove}
    >
      {children}
      <div
        className="absolute top-0 bottom-0 w-1 bg-white shadow-lg"
        style={{ left: `${position}%` }}
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center">
          <div className="flex gap-1">
            <div className="w-1 h-3 bg-gray-400" />
            <div className="w-1 h-3 bg-gray-400" />
          </div>
        </div>
      </div>
    </div>
  )
}

export function ImageComparisonImage({
  src,
  alt,
}: ImageComparisonImageProps) {
  return (
    <div className="absolute inset-0">
      <img src={src} alt={alt} className="w-full h-full object-cover" />
    </div>
  )
}

export function ImageComparisonSlider({ className = "" }: ImageComparisonSliderProps) {
  return <div className={`absolute inset-y-0 w-1 bg-white shadow-lg ${className}`} />
}
