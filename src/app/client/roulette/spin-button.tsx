'use client'

import { useState, useTransition, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useSystemSettings } from '@/hooks/use-system-settings'
import ResultSheet from '@/components/client/ResultSheet'
import WheelRive, { WheelRiveRef } from '@/components/client/WheelRive'

const RIVE_ANIMATION_DURATION = 5000 // 5.5s spin + 1s transition = 6.5s total
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))

type SpinResult = { won: boolean; prize_name?: string | null }

export default function SpinButton({ disabled }: { disabled: boolean }) {
  const [pending, start] = useTransition()
  const [msg, setMsg] = useState<string | null>(null)
  const [result, setResult] = useState<SpinResult | null>(null)
  const [spinning, setSpinning] = useState(false) // Estado para la animación RIVE
  const { data: settings, isLoading: settingsLoading } = useSystemSettings()
  const router = useRouter()
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
  const primaryColor = settings?.company_theme_primary || '#10B981'

  // 🎰 Nueva lógica integrada con RIVE
  const onSpin = () => {
    setMsg(null)
    setResult(null)
    start(async () => {
      try {
        // 1️⃣ Obtener resultado del API primero
        const res = await fetch('/api/roulette', { method: 'POST' })
        const json = await res.json()

        if (!res.ok || !json.ok) {
          setMsg(json?.error ?? 'No se pudo girar')
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
          router.refresh()
        } else {
          // Fallback si RIVE no funciona
          console.warn('⚠️ No se pudo iniciar animación RIVE, mostrando resultado directo')
          setResult(spinResult)
          setSpinning(false)
          router.refresh()
        }
      } catch (error) {
        console.error('❌ Error en giro:', error)
        setMsg('Error de red')
        setSpinning(false)
        // Resetear RIVE en caso de error
        wheelRiveRef.current?.resetSpin()
      }
    })
  }

  // 🎰 Callback cuando RIVE complete (respaldo)
  const handleRiveComplete = () => {
    console.log('🎰 RIVE completó animación')
    // La lógica principal ya maneja el timing, esto es respaldo
  }

  return (
    <div className="space-y-6">
      {/* 🎰 Ruleta RIVE */}
      <WheelRive 
        ref={wheelRiveRef}
        spinning={spinning}
        onSpinComplete={handleRiveComplete}
      />

      {/* 🎯 Botón de girar */}
      <div className="space-y-3">
        <button
          onClick={onSpin}
          disabled={disabled || pending || spinning}
          className="inline-flex h-12 items-center justify-center rounded-xl px-6 text-white font-semibold shadow active:translate-y-[1px] disabled:opacity-40"
          style={{ backgroundColor: primaryColor }}
        >
          {spinning ? 'Girando…' : pending ? 'Obteniendo resultado…' : 'Girar ruleta'}
        </button>

        {(pending || spinning) && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
            {spinning ? 'Animación en progreso...' : 'Obteniendo resultado...'}
          </div>
        )}

        {/* Bottom sheet con el resultado */}
        <ResultSheet
          open={!!result}
          onClose={() => setResult(null)}
          won={!!result?.won}
          prizeName={result?.prize_name}
        />

        {msg && <p className="text-sm text-gray-700">{msg}</p>}
      </div>
    </div>
  )
}