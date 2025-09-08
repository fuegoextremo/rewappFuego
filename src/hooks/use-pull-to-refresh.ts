'use client'

import { useState, useCallback } from 'react'

export interface UsePullToRefreshOptions {
  /** Threshold distance to trigger refresh (default: 60) */
  threshold?: number
  /** Maximum pull distance (default: 120) */
  maxDistance?: number
  /** Enable pull-to-refresh (default: true) */
  enabled?: boolean
  /** Callback when refresh is triggered */
  onRefresh?: () => Promise<void> | void
}

export function usePullToRefresh(options: UsePullToRefreshOptions = {}) {
  const { 
    threshold = 60, 
    maxDistance = 120, 
    enabled = true,
    onRefresh 
  } = options

  const [isRefreshing, setIsRefreshing] = useState(false)
  const [pullDistance, setPullDistance] = useState(0)
  const [startY, setStartY] = useState(0)

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!enabled || window.scrollY > 0 || isRefreshing) return
    
    const touch = e.touches[0]
    setStartY(touch.clientY)
    setPullDistance(0)
  }, [enabled, isRefreshing])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!enabled || window.scrollY > 0 || isRefreshing) return
    
    const touch = e.touches[0]
    const currentY = touch.clientY
    
    if (currentY > startY) {
      const distance = Math.max(0, Math.min(currentY - startY, maxDistance))
      setPullDistance(distance)
    }
  }, [enabled, isRefreshing, startY, maxDistance])

  const handleTouchEnd = useCallback(async () => {
    if (!enabled) return
    
    if (pullDistance > threshold && !isRefreshing && onRefresh) {
      setIsRefreshing(true)
      try {
        await onRefresh()
      } catch (error) {
        console.error('Pull-to-refresh error:', error)
      } finally {
        setIsRefreshing(false)
        setPullDistance(0)
      }
    } else {
      setPullDistance(0)
    }
  }, [enabled, pullDistance, threshold, isRefreshing, onRefresh])

  // Calculado states for animations
  const isTriggered = pullDistance > threshold
  const pullProgress = Math.min(pullDistance / threshold, 1)
  const shouldShowIndicator = pullDistance > 0
  
  return {
    // States
    isRefreshing,
    pullDistance,
    isTriggered,
    pullProgress,
    shouldShowIndicator,
    
    // Touch handlers
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    
    // Manual controls
    triggerRefresh: () => onRefresh?.(),
    resetPull: () => setPullDistance(0)
  }
}
