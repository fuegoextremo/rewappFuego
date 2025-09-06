import React, { useState, useEffect } from 'react'
import { StreakSection } from './StreakSection'
import { createClientBrowser } from '@/lib/supabase/client'

interface StreakSectionWrapperProps {
  userId: string
}

export function StreakSectionWrapper({ userId }: StreakSectionWrapperProps) {
  const [currentCount, setCurrentCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadCurrentCount() {
      const supabase = createClientBrowser()
      
      try {
        const { data: userStreak } = await supabase
          .from('streaks')
          .select('current_count')
          .eq('user_id', userId)
          .single()

        setCurrentCount(userStreak?.current_count || 0)
      } catch (error) {
        // Si no hay racha, usar 0 (usuario nuevo)
        setCurrentCount(0)
      } finally {
        setLoading(false)
      }
    }

    loadCurrentCount()

    // Escuchar refresh global
    const handleRefresh = () => loadCurrentCount()
    window.addEventListener('app-refresh', handleRefresh)
    return () => window.removeEventListener('app-refresh', handleRefresh)
  }, [userId])

  if (loading) {
    return (
      <div className="bg-gradient-to-r from-orange-100 to-red-100 rounded-2xl p-6 text-center">
        <div className="animate-pulse">
          <div className="w-24 h-24 bg-gray-300 rounded-full mx-auto mb-4"></div>
          <div className="h-4 bg-gray-300 rounded w-3/4 mx-auto mb-2"></div>
          <div className="h-6 bg-gray-300 rounded w-1/2 mx-auto"></div>
        </div>
      </div>
    )
  }

  // Usar el componente original que funciona
  return <StreakSection userId={userId} currentCount={currentCount} />
}
