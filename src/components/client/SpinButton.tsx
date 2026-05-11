'use client'

import { useState, useTransition, useRef, useEffect } from 'react'
//import { Loader2 } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryClient'
import { useAppDispatch } from '@/store/hooks'
import { startSpin, endSpin } from '@/store/slices/rouletteSlice'
import { useNavigationBlock } from '@/hooks/useNavigationBlock'
import { useSystemSettings } from '@/hooks/use-system-settings'
import ResultSheet from '@/components/client/ResultSheet'
import WheelRive, { WheelRiveRef } from '@/components/client/WheelRive'
// import { useRouter } from 'next/navigation'

const RIVE_ANIMATION_DURATION = 5000 // 5.5s spin + 1s transition = 6.5s total
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))

type SpinResult = { won: boolean; prize_name?: string | null }

export default function SpinButton({ disabled }: { disabled: boolean }) {
  const [pending, start] = useTransition()
  const [msg, setMsg] = useState<string | null>(null)
  const [result, setResult] = useState<SpinResult | null>(null)
  const [spinning, setSpinning] = useState(false) // Estado para la animación RIVE
  const { data: settings, isLoading: settingsLoading } = useSystemSettings()
  const dispatch = useAppDispatch()
  const queryClient = useQueryClient()
  
  // 🔒 Activar hook de bloqueo de navegación
  useNavigationBlock()
  
  // 🔓 Desbloquear navegación cuando se muestre el resultado
  useEffect(() => {
    if (result && !spinning) {
      // Esperar 3 segundos adicionales para que el usuario vea el resultado
      const unlockTimer = setTimeout(() => {
        dispatch(endSpin())
        console.log('🔓 Navegación desbloqueada - resultado mostrado')
      }, 3000)
      
      return () => clearTimeout(unlockTimer)
    }
  }, [result, spinning, dispatch])
  
  // const router = useRouter()
  // const queryClient = useQueryClient()
  const wheelRiveRef = useRef<WheelRiveRef>(null)

  // ✨ Loading inteligente: solo skeleton si NO tenemos settings Y estamos cargando
  const hasSettings = !!settings
  if (settingsLoading && !hasSettings) {
    return (
      <div className="space-y-3">
        <div className="inline-flex h-12 items-center justify-center rounded-xl bg-gray-200 px-6 font-semibold shadow animate-pulse">
          <div className="w-20 h-4 bg-gray-300 rounded"></div>
        </div>
      </div>
    )
  }

  // ✨ Usar configuración o fallback elegante
  // const primaryColor = settings?.company_theme_primary || '#b91010ff'

  // 🎰 Nueva lógica integrada con RIVE
  const onSpin = () => {
    setMsg(null)
    setResult(null)
    
    // 🔒 ACTIVAR BLOQUEO DE NAVEGACIÓN
    dispatch(startSpin())
    console.log('🔒 Navegación bloqueada - iniciando giro')
    
    start(async () => {
      try {
        // 1️⃣ Obtener resultado del API primero
        const res = await fetch('/api/roulette', { method: 'POST' })
        const json = await res.json()

        if (!res.ok || !json.ok) {
          setMsg(json?.error ?? 'No se pudo girar')
          // 🔓 DESBLOQUEAR en caso de error
          dispatch(endSpin())
          console.log('🔓 Navegación desbloqueada - error en giro')
          return
        }

        const { result: spinResult } = json as { result: SpinResult }
        console.log('🎰 Resultado obtenido:', spinResult)

        // 2️⃣ Activar animación RIVE con el resultado
        const animationStarted = wheelRiveRef.current?.triggerSpin(spinResult.won)
        
        if (animationStarted) {
          setSpinning(true)
          console.log('🎰 Animación RIVE iniciada:', spinResult.won ? 'GANAR' : 'PERDER')
          console.log('⏱️ Esperando animación completa:', RIVE_ANIMATION_DURATION, 'ms (5.5s spin + 1s transition)')
          
          // 3️⃣ Esperar que termine la animación completa (6.5s)
          await delay(RIVE_ANIMATION_DURATION)
          
          // 4️⃣ Asegurar que RIVE esté reseteado y mostrar resultado
          wheelRiveRef.current?.resetSpin()
          console.log('🎰 Timeout de animación alcanzado, forzando reset y mostrando resultado')
          setResult(spinResult)
          setSpinning(false)

          // Invalidar cache de premios si ganó: el inventario cambió en DB
          if (spinResult.won) {
            queryClient.invalidateQueries({ queryKey: queryKeys.roulette.prizes })
          }

          // ✨ REALTIME PURO: Confiando 100% en RealtimeProvider
          console.log('✨ Giro completado - Esperando Realtime para actualizar RouletteView y HomeView')
        } else {
          // Fallback si RIVE no funciona
          console.warn('⚠️ No se pudo iniciar animación RIVE, mostrando resultado directo')
          setResult(spinResult)
          setSpinning(false)
          
          // ✨ REALTIME PURO: Confiando 100% en RealtimeProvider (fallback)
          console.log('✨ Giro completado (fallback) - Esperando Realtime para actualizar todo')
        }
      } catch (error) {
        console.error('❌ Error en giro:', error)
        setMsg('Error de red')
        setSpinning(false)
        // Resetear RIVE en caso de error
        wheelRiveRef.current?.resetSpin()
        // 🔓 DESBLOQUEAR en caso de error
        dispatch(endSpin())
        console.log('🔓 Navegación desbloqueada - error de red')
      }
    })
  }

  // 🎰 Callback cuando RIVE complete (respaldo)
  const handleRiveComplete = () => {
    console.log('🎰 RIVE completó animación')
    // La lógica principal ya maneja el timing, esto es respaldo
  }

  return (
    <div className="relative">
      {/* 🎰 Ruleta RIVE como fondo */}
      <WheelRive 
        ref={wheelRiveRef}
        spinning={spinning}
        onSpinComplete={handleRiveComplete}
      />

      {/* 🎯 Botón circular centrado encima de la ruleta */}
      <div className="absolute inset-0 flex items-center justify-center">
        {/* Ajuste vertical proporcional para compensar la proporción 5:6 de la ruleta */}
        <div className="transform" style={{ transform: 'translateY(32%)' }}>
          {/* Contenedor exterior SIN stroke - Gradiente INVERTIDO */}
          <div 
            className="w-[30vw] h-[30vw] rounded-full flex items-center justify-center"
            style={{
              background: 'linear-gradient(184deg, #FF4848 11.7%, #B00 100.24%)'
            }}
          >
            {/* Contenedor interior CON stroke y gradiente del centro */}
            <button
              onClick={onSpin}
              disabled={disabled || pending || spinning}
              className="w-[22vw] h-[22vw] rounded-full text-white font-bold text-sm active:scale-95 transition-transform disabled:scale-100 flex items-center justify-center"
              style={{ 
                background: 'linear-gradient(4deg, #FF4848 11.7%, #B00 100.24%)',
                border: '3px solid #FF4848',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15), 0 2px 4px rgba(0,0,0,0.1)'
              }}
            >
              <span className="leading-tight text-center text-lg">
                {spinning ? 'GIRANDO' : pending ? 'CARGANDO' : 'GIRAR'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom sheet con el resultado */}
      <ResultSheet
        open={!!result}
        onClose={() => setResult(null)}
        won={!!result?.won}
        prizeName={result?.prize_name}
      />

      {/* Mensaje de error (si existe) */}
      {msg && (
        <div className="mt-4 text-center">
          <p className="text-sm text-red-600 bg-red-50 rounded-lg px-4 py-2 inline-block">{msg}</p>
        </div>
      )}
    </div>
  )
}