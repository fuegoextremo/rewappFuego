'use client'

import { useState, useTransition } from 'react'
import { useAppActions } from '@/hooks/use-app-actions'
import { useUser } from '@/store/hooks'
import ResultSheet from '@/components/client/ResultSheet'

const MIN_SPIN_MS = 1400
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))

type SpinResult = { won: boolean; prize_name?: string | null }

export default function StoreSpinButton({ disabled }: { disabled: boolean }) {
  const [pending, start] = useTransition()
  const [msg, setMsg] = useState<string | null>(null)
  const [result, setResult] = useState<SpinResult | null>(null)
  const { loadUserData } = useAppActions()
  const user = useUser()

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
        setResult(result)
        
        // ✨ ACTUALIZACIÓN CRÍTICA: Recargar datos del usuario inmediatamente
        if (user?.id) {
          await loadUserData(user.id)
        }
        
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
        className="inline-flex h-12 items-center justify-center rounded-xl bg-emerald-600 px-6 text-white font-semibold shadow active:translate-y-[1px] disabled:opacity-40"
      >
        {pending ? (
          <>
            <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            Girando...
          </>
        ) : (
          'Girar Ruleta'
        )}
      </button>

      {msg && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2">
          <p className="text-sm text-red-700">{msg}</p>
        </div>
      )}

      <ResultSheet 
        open={!!result} 
        onClose={() => setResult(null)}
        won={result?.won || false}
        prizeName={result?.prize_name}
      />
    </div>
  )
}
