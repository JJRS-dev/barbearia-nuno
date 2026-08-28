'use client'

import type { ReactNode } from 'react'
import { motion } from 'framer-motion'

type MotionRevealProps = {
  children: ReactNode
  className?: string
  delay?: number
  y?: number
}

export function MotionReveal({ children, className, delay = 0, y = 24 }: MotionRevealProps) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  )
}
