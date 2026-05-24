'use client'

import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'

interface ScrollRevealProps {
  children: React.ReactNode
  className?: string
  delay?: number
}

export function ScrollReveal({ children, className, delay = 0 }: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ clipPath: 'inset(0 0 100% 0)', opacity: 0 }}
      animate={
        inView
          ? { clipPath: 'inset(0 0 0% 0)', opacity: 1 }
          : { clipPath: 'inset(0 0 100% 0)', opacity: 0 }
      }
      transition={{
        duration: 0.6,
        delay,
        ease: [0.23, 1, 0.32, 1],
      }}
    >
      {children}
    </motion.div>
  )
}
