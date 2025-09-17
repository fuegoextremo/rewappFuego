'use client'

import { useMemo } from 'react'

interface CircularProgressProps {
  progress: number // 0-100
  total: number
  size?: number // tamaño en pixels
  strokeWidth?: number
  color?: string
  backgroundColor?: string
  showNumbers?: boolean
  className?: string
}

export function CircularProgress({
  progress,
  total,
  size = 64,
  strokeWidth = 4,
  color = '#3B82F6',
  backgroundColor = '#E5E7EB',
  showNumbers = true,
  className = ''
}: CircularProgressProps) {
  const { radius, circumference, strokeDashoffset } = useMemo(() => {
    const radius = (size - strokeWidth) / 2
    const circumference = 2 * Math.PI * radius
    const percentage = Math.min(Math.max((progress / total) * 100, 0), 100)
    const strokeDashoffset = circumference - (percentage / 100) * circumference
    
    return { radius, circumference, strokeDashoffset }
  }, [progress, total, size, strokeWidth])

  return (
    <div 
      className={`relative inline-flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      {/* SVG Circular Progress */}
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          stroke={backgroundColor}
          fill="transparent"
        />
        
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          stroke={color}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-500 ease-out"
        />
      </svg>
      
      {/* Numbers overlay - Horizontal */}
      {showNumbers && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span 
            className="font-bold text-gray-900"
            style={{ fontSize: size * 0.22 }}
          >
            {progress}/{total}
          </span>
        </div>
      )}
    </div>
  )
}