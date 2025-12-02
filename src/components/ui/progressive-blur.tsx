 
"use client"

import React from "react"
import { motion, MotionProps } from "framer-motion"

export interface ProgressiveBlurProps extends MotionProps {
  className?: string
  blurIntensity?: number
}

export function ProgressiveBlur({
  className = "",
  blurIntensity = 0.5,
  ...motionProps
}: ProgressiveBlurProps) {
  const maxBlur = 20 * blurIntensity

  return (
    <motion.div
      className={className}
      style={{
        background: `linear-gradient(to bottom, rgba(0,0,0,0), rgba(0,0,0,0.8))`,
        backdropFilter: `blur(${maxBlur}px)`,
      }}
      {...motionProps}
    />
  )
}
