 
"use client"

import React, { ReactNode } from "react"
import { motion } from "framer-motion"

export interface InfiniteSliderProps {
  children: ReactNode[]
  gap?: number
  duration?: number
  reverse?: boolean
  pauseOnHover?: boolean
}

export function InfiniteSlider({
  children,
  gap = 16,
  duration = 20,
  reverse = false,
  pauseOnHover = true,
}: InfiniteSliderProps) {
  const childrenArray = React.Children.toArray(children)
  const duplicatedChildren = [...childrenArray, ...childrenArray]

  return (
    <div className="w-full overflow-hidden">
      <motion.div
        className="flex"
        style={{ gap: `${gap}px` }}
        initial={{ x: 0 }}
        animate={{ x: reverse ? "0" : "-50%" }}
        transition={{
          duration,
          repeat: Infinity,
          ease: "linear",
          repeatType: "loop",
        }}
        whileHover={pauseOnHover ? { animationPlayState: "paused" } : undefined}
      >
        {duplicatedChildren.map((child, index) => (
          <div key={index} className="flex-shrink-0">
            {child}
          </div>
        ))}
      </motion.div>
    </div>
  )
}
