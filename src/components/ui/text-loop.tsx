/* eslint-disable no-undef */
"use client"

import React, { ReactNode, useEffect, useState } from "react"
import { AnimatePresence, motion, Transition, Variants } from "framer-motion"

export interface TextLoopProps {
  children: ReactNode[]
  interval?: number
  className?: string
  variants?: Variants
  transition?: Transition
}

export function TextLoop({
  children,
  interval = 3000,
  className = "",
  variants,
  transition,
}: TextLoopProps) {
  const [index, setIndex] = useState(0)
  const childrenArray = React.Children.toArray(children)

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % childrenArray.length)
    }, interval)

    return () => clearInterval(timer)
  }, [interval, childrenArray.length])

  const defaultVariants: Variants = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 },
  }

  const defaultTransition: Transition = {
    duration: 0.3,
    ease: "easeInOut",
  }

  return (
    <AnimatePresence mode="wait">
      <motion.span
        key={index}
        className={className}
        variants={variants || defaultVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={transition || defaultTransition}
      >
        {childrenArray[index]}
      </motion.span>
    </AnimatePresence>
  )
}
