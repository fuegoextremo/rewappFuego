'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useSystemSettings } from '@/hooks/use-system-settings'
import ResultSheet from '@/components/client/ResultSheet'

const MIN_SPIN_MS = 1400
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))

type SpinResult = { won: boolean; prize_name?: string | null }

export default function SpinButton({ disabled }: { disabled: boolean }) {
  const [pending, start] = useTransition()
  const [msg, setMsg] = useState<string | null>(null)
  const [result, setResult] = useState<SpinResult | null>(null)
  const { data: settings, isLoading: settingsLoading } = useSystemSettings() // ✨ React Query con cache agresivo
  const router = useRouter()

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
  const primaryColor = settings?.company_theme_primary || '#10B981' // fallback limpio

  const onSpin = () => {
    setMsg(null)
    setResult(null)
    start(async () => {
      const t0 = performance.now()
      try {
        const res = await fetch('/api/roulette', { method: 'POST' })
        const json = await res.json()
        const elapsed = performance.now() - t0
        await delay(Math.max(0, MIN_SPIN_MS - elapsed))

        if (!res.ok || !json.ok) {
          setMsg(json?.error ?? 'No se pudo girar')
          return
        }
        const { result } = json as { result: SpinResult }
        setResult(result)     // <- abrirá el bottom sheet
        router.refresh()
      } catch {
        const elapsed = performance.now() - t0
        await delay(Math.max(0, MIN_SPIN_MS - elapsed))
        setMsg('Error de red')
      }
    })
  }

  return (
    <div className="space-y-3">
      <button
        onClick={onSpin}
        disabled={disabled || pending}
        className="inline-flex h-12 items-center justify-center rounded-xl px-6 text-white font-semibold shadow active:translate-y-[1px] disabled:opacity-40"
        style={{ backgroundColor: primaryColor }} // ✨ Color personalizado dinámico
      >
        {pending ? 'Girando…' : 'Girar ruleta'}
      </button>

      {pending && (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
          Girando...
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
  )
}