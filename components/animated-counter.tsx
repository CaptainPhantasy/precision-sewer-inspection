'use client'

import { useEffect, useState, useRef } from 'react'
import { useInView } from 'react-intersection-observer'

interface AnimatedCounterProps {
  end: number
  duration?: number
  prefix?: string
  suffix?: string
  decimals?: number
}

export default function AnimatedCounter({
  end,
  duration = 2000,
  prefix = '',
  suffix = '',
  decimals = 0,
}: AnimatedCounterProps) {
  const [count, setCount] = useState(end ?? 0)
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.3 })
  const hasAnimated = useRef(false)

  useEffect(() => {
    if (inView && !hasAnimated?.current) {
      hasAnimated.current = true
      const startTime = Date.now()
      const animate = () => {
        const now = Date.now()
        const elapsed = now - startTime
        const progress = Math.min(elapsed / (duration ?? 2000), 1)
        
        // Ease out cubic
        const easeOut = 1 - Math.pow(1 - progress, 3)
        setCount(Math.floor(easeOut * (end ?? 0)))

        if (progress < 1) {
          requestAnimationFrame(animate)
        } else {
          setCount(end ?? 0)
        }
      }
      requestAnimationFrame(animate)
    }
  }, [inView, end, duration])

  return (
    <span ref={ref}>
      {prefix ?? ''}
      {(count ?? 0)?.toFixed?.(decimals ?? 0)}
      {suffix ?? ''}
    </span>
  )
}
