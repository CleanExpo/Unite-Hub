 
"use client"

import React, { ReactNode, useRef, useState } from "react"
import { motion, MotionConfig } from "framer-motion"

export interface DockProps {
  children: ReactNode
  className?: string
}

export interface DockItemProps {
  className?: string
}

export interface DockIconProps {
  children: ReactNode
}

export interface DockLabelProps {
  children: ReactNode
}

export function Dock({ children, className = "" }: DockProps) {
  return (
    <div className={`flex items-end gap-2 ${className}`}>
      <MotionConfig
        transition={{
          duration: 0.2,
          ease: "easeInOut",
        }}
      >
        {children}
      </MotionConfig>
    </div>
  )
}

export function DockItem({ className = "" }: DockItemProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div
      ref={ref}
      className={`relative flex flex-col items-center ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <motion.div
        className="mb-2"
        animate={isHovered ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
        transition={{ duration: 0.2 }}
      >
        <DockLabel />
      </motion.div>
      <motion.div
        className="p-2"
        animate={isHovered ? { scale: 1.2, y: -10 } : { scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 10 }}
      >
        <DockIcon />
      </motion.div>
    </div>
  )
}

export function DockIcon({ children }: DockIconProps) {
  return <div className="flex items-center justify-center h-10 w-10">{children}</div>
}

export function DockLabel({ children }: DockLabelProps) {
  return (
    <div className="text-xs font-medium text-center whitespace-nowrap px-2 py-1 rounded bg-gray-900 text-white">
      {children}
    </div>
  )
}
