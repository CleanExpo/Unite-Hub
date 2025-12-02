 
"use client"

import { useEffect, useState } from "react"
import { useMotionValue, useTransform, animate } from "framer-motion"
import { motion } from "framer-motion"

export interface AnimatedNumberProps {
  value: number
  precision?: number
  format?: (value: number) => string
  duration?: number
  mass?: number
  stiffness?: number
  damping?: number
  onAnimationStart?: () => void
  onAnimationComplete?: () => void
}

export function AnimatedNumber({
  value,
  precision = 0,
  format,
  duration = 0.5,
  mass = 1,
  stiffness = 100,
  damping = 10,
  onAnimationStart,
  onAnimationComplete,
}: AnimatedNumberProps) {
  const motionValue = useMotionValue(0)
  const [isAnimating, setIsAnimating] = useState(false)

  const displayValue = useTransform(motionValue, (latest) => {
    const rounded = precision
      ? parseFloat(latest.toFixed(precision))
      : Math.round(latest)

    return format ? format(rounded) : rounded.toString()
  })

  useEffect(() => {
    let isMounted = true

    if (isMounted) {
      setIsAnimating(true)
      onAnimationStart?.()
    }

    const animation = animate(motionValue, value, {
      duration,
      mass,
      stiffness,
      damping,
      type: "spring",
      onComplete: () => {
        if (isMounted) {
          setIsAnimating(false)
          onAnimationComplete?.()
        }
      },
    })

    return () => {
      isMounted = false
      animation.stop()
    }
  }, [value, duration, mass, stiffness, damping, motionValue, onAnimationStart, onAnimationComplete])

  return (
    <motion.span
      className="inline-block tabular-nums"
      data-animating={isAnimating}
    >
      {displayValue}
    </motion.span>
  )
}
