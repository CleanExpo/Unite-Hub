/* eslint-disable no-undef */
"use client"

import React, { useEffect, useState } from "react"
import { motion } from "framer-motion"

export interface ScrollProgressProps {
  className?: string
  containerRef?: React.RefObject<HTMLElement>
}

export function ScrollProgress({ className = "", containerRef }: ScrollProgressProps) {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const container = containerRef?.current

    const handleScroll = () => {
      let scrollPercentage = 0

      if (container) {
        const { scrollHeight, clientHeight, scrollTop } = container
        scrollPercentage = ((scrollTop) / (scrollHeight - clientHeight)) * 100
      } else {
        const { scrollHeight, clientHeight, scrollY } = window
        scrollPercentage = ((scrollY) / (scrollHeight - clientHeight)) * 100
      }

      setProgress(Math.min(scrollPercentage, 100))
    }

    if (container) {
      container.addEventListener("scroll", handleScroll)
      return () => container.removeEventListener("scroll", handleScroll)
    } else {
      window.addEventListener("scroll", handleScroll)
      return () => window.removeEventListener("scroll", handleScroll)
    }
  }, [containerRef])

  return (
    <motion.div
      className={`h-full ${className}`}
      style={{ width: `${progress}%` }}
      transition={{ duration: 0.1 }}
    />
  )
}
