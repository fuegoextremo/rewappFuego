'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import QRCode from 'qrcode'

type ApiResp = {
  ok: boolean
  qrData?: string
  code?: string
  error?: string
}

export default function UserQR({ size = 240 }: { size?: number }) {
  const [img, setImg] = useState<string | null>(null)
  const [code, setCode] = useState<string>('—')
  const [err, setErr] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    async function run() {
      try {
        setErr(null); setImg(null); setCode('—'); setLoading(true)
        const res = await fetch('/api/checkin/qr-token', { cache: 'no-store' })
        const json: ApiResp = await res.json()
        if (!json.ok || !json.qrData) throw new Error(json.error || 'error')
        const dataUrl = await QRCode.toDataURL(json.qrData, { margin: 1, width: size })
        if (!mounted) return
        setImg(dataUrl)
        setCode(json.code ?? '')
      } catch (e) {
        if (!mounted) return
        setErr('No se pudo generar el QR. Intenta de nuevo.')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    run()
    return () => { mounted = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (loading) {
    return (
      <div className="flex flex-col items-center gap-3">
        <div className="h-[240px] w-[240px] max-w-full rounded-2xl border flex items-center justify-center">
          <span className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
        </div>
        <div className="h-4 w-24 rounded bg-gray-100" />
      </div>
    )
  }

  if (err) {
    return <p className="text-sm text-red-600 text-center">{err}</p>
  }

  return (
    <div className="flex flex-col items-center gap-2">
      {img && (
        <Image
          src={img}
          alt="QR para check-in"
          width={size}
          height={size}
          className="rounded-2xl border p-2 bg-white"
          unoptimized
          priority
        />
      )}
      {code && <p className="text-xs text-gray-500">#{code}</p>}
    </div>
  )
}
