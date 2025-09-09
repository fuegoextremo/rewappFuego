/**
 * @deprecated Este hook está OBSOLETO desde la implementación del RealtimeManager singleton.
 * Usar Redux como fuente única de verdad en lugar de React Query para datos de usuario.
 * Ver: RealtimeManager + Redux para datos de usuario.
 */

// 🚨 OBSOLETO: Usar RealtimeManager + Redux en su lugar

import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { createClientBrowser } from '@/lib/supabase/client'

// OBSOLETO: Usar Redux en lugar de React Query para datos de usuario
export function useRealtimeFallback(userId: string) {
  const queryClient = useQueryClient()
  const pollIntervalRef = useRef<NodeJS.Timeout>()
  const lastSpinsRef = useRef<number>()

  useEffect(() => {
    if (!userId) return

    // 🔄 Polling cada 2 segundos para detectar cambios
    const startPolling = () => {
      pollIntervalRef.current = setInterval(async () => {
        try {
          const supabase = createClientBrowser()
          const { data: userData } = await supabase
            .from('user_spins')
            .select('available_spins')
            .eq('user_id', userId)
            .single()

          if (userData && lastSpinsRef.current !== undefined) {
            if (userData.available_spins !== lastSpinsRef.current) {
              console.log('🔄 FALLBACK: Cambio detectado en spins:', lastSpinsRef.current, '->', userData.available_spins)
              
              // Actualizar React Query
              queryClient.setQueryData(['user', 'spins', userId], (oldData: any) => {
                if (oldData) {
                  return { ...oldData, availableSpins: userData.available_spins }
                }
                return { availableSpins: userData.available_spins }
              })

              // Actualizar Redux si tienes dispatch
              // dispatch(updateAvailableSpins(userData.available_spins))
            }
          }
          
          lastSpinsRef.current = userData?.available_spins
        } catch (error) {
          console.error('❌ Error en fallback polling:', error)
        }
      }, 2000) // Cada 2 segundos
    }

    // Obtener valor inicial
    const getInitialValue = async () => {
      try {
        const supabase = createClientBrowser()
        const { data } = await supabase
          .from('user_spins')
          .select('available_spins')
          .eq('user_id', userId)
          .single()
        
        lastSpinsRef.current = data?.available_spins
        console.log('🚨 FALLBACK ACTIVADO - Valor inicial:', lastSpinsRef.current)
      } catch (error) {
        console.error('❌ Error obteniendo valor inicial:', error)
      }
    }

    getInitialValue().then(startPolling)

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
        console.log('🚨 FALLBACK DESACTIVADO')
      }
    }
  }, [userId, queryClient])
}

// 🎯 Para usar en RouletteView o donde necesites:
// useRealtimeFallback(userId)
