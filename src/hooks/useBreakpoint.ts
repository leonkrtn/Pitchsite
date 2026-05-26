'use client'

import { useState, useEffect } from 'react'

const BREAKPOINTS = { sm: 640, md: 768, lg: 1024, xl: 1280 }

export function useBreakpoint() {
  const [width, setWidth] = useState<number>(1280)

  useEffect(() => {
    setWidth(window.innerWidth)
    let raf: number
    const onResize = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => setWidth(window.innerWidth))
    }
    window.addEventListener('resize', onResize)
    return () => { window.removeEventListener('resize', onResize); cancelAnimationFrame(raf) }
  }, [])

  return {
    width,
    isMobile: width < BREAKPOINTS.md,
    isTablet: width >= BREAKPOINTS.md && width < BREAKPOINTS.lg,
    isDesktop: width >= BREAKPOINTS.lg,
    sm: width >= BREAKPOINTS.sm,
    md: width >= BREAKPOINTS.md,
    lg: width >= BREAKPOINTS.lg,
    xl: width >= BREAKPOINTS.xl,
  }
}
