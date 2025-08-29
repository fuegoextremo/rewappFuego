'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClientBrowser } from '@/lib/supabase/client'
import { useSystemSettings } from '@/hooks/use-system-settings'

type CheckIn = {
  id: string
  check_in_date: string | null
  spins_earned: number | null
  created_at: string | null
  branches?: {
    name: string
  } | null
}

type Props = {
  userId: string
}

export function RecentActivity({ userId }: Props) {
  const [checkIns, setCheckIns] = useState<CheckIn[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(0)
  const { settings } = useSystemSettings()

  const ITEMS_PER_PAGE = 10

  const loadCheckIns = useCallback(async (pageNumber: number) => {
    const supabase = createClientBrowser()
    
    const { data, error } = await supabase
      .from('check_ins')
      .select(`
        id,
        check_in_date,
        spins_earned,
        created_at,
        branches (
          name
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(pageNumber * ITEMS_PER_PAGE, (pageNumber + 1) * ITEMS_PER_PAGE - 1)

    if (error) {
      console.error('Error cargando check-ins:', error)
      setLoading(false)
      setLoadingMore(false)
      return
    }

    if (pageNumber === 0) {
      setCheckIns(data || [])
      setLoading(false)
    } else {
      setCheckIns(prev => [...prev, ...(data || [])])
      setLoadingMore(false)
    }

    setHasMore((data?.length || 0) === ITEMS_PER_PAGE)
    setPage(pageNumber)
  }, [userId])

  useEffect(() => {
    loadCheckIns(0)
  }, [loadCheckIns])

  function loadMore() {
    if (!loadingMore && hasMore) {
      setLoadingMore(true)
      loadCheckIns(page + 1)
    }
  }

  const primaryColor = settings?.company_theme_primary || '#D73527'

  if (loading) {
    return (
      <div className="space-y-3">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Actividad reciente</h3>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl p-4 border border-gray-100 animate-pulse">
            <div className="flex justify-between items-center">
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-24"></div>
                <div className="h-3 bg-gray-200 rounded w-16"></div>
              </div>
              <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (checkIns.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-6xl mb-4">🔥</div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">Sin actividad aún</h3>
        <p className="text-sm text-gray-500 mb-4">
          Cuando muestres tu código QR en Fuego Extremo, verás aquí el registro de tus visitas y avances.
        </p>
        <div className="w-16 h-1 rounded-full mx-auto" style={{ backgroundColor: primaryColor }}></div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-bold text-gray-900 mb-4">Actividad reciente</h3>
      
      {checkIns.map((checkIn) => (
        <div key={checkIn.id} className="bg-white rounded-xl p-4 border border-gray-100">
          <div className="flex justify-between items-center">
            <div>
              <div className="font-medium text-gray-900">
                {checkIn.check_in_date ? new Date(checkIn.check_in_date).toLocaleDateString('es-ES', {
                  day: 'numeric',
                  month: 'short'
                }) : 'Fecha no disponible'}
              </div>
              <div className="text-sm text-gray-500">
                {checkIn.branches?.name || 'Sucursal'}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div 
                className="text-sm font-semibold px-2 py-1 rounded-full text-white"
                style={{ backgroundColor: primaryColor }}
              >
                +{checkIn.spins_earned || 0} giros
              </div>
              <div className="text-xl">🔥</div>
            </div>
          </div>
        </div>
      ))}

      {hasMore && (
        <button
          onClick={loadMore}
          disabled={loadingMore}
          className="w-full py-3 text-center text-gray-500 hover:text-gray-700 disabled:opacity-50"
        >
          {loadingMore ? 'Cargando...' : 'Ver más actividad'}
        </button>
      )}
    </div>
  )
}
