'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

interface VersionToggleProps {
  currentVersion: 'spa' | 'classic'
}

export function VersionToggle({ currentVersion }: VersionToggleProps) {
  const router = useRouter()
  const [switching, setSwitching] = useState(false)

  const handleSwitch = async () => {
    setSwitching(true)
    
    // Simular delay para UX
    await new Promise(resolve => setTimeout(resolve, 300))
    
    if (currentVersion === 'spa') {
      router.push('/classicapp')
    } else {
      router.push('/client')
    }
  }

  const otherVersion = currentVersion === 'spa' ? 'Classic' : 'SPA'
  const icon = currentVersion === 'spa' ? '🏛️' : '🚀'

  return (
    <Button
      onClick={handleSwitch}
      disabled={switching}
      variant="ghost"
      size="sm"
      className="text-xs h-6 px-2"
    >
      {switching ? (
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin"></div>
          Cambiando...
        </div>
      ) : (
        <div className="flex items-center gap-1">
          {icon} Ir a {otherVersion}
        </div>
      )}
    </Button>
  )
}
