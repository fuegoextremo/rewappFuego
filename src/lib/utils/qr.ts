import crypto from 'crypto'

const SECRET = process.env.QR_SECRET_KEY! // añade en .env.local

export type QRKind = 'checkin' | 'redeem'

export type RedeemPayload = {
  c: string // coupon_id
  u: string // user_id dueño del cupón
  exp: number // epoch seconds
  kind?: QRKind // opcional para compatibilidad con tokens legacy
}

export function signPayload(p: RedeemPayload) {
  const body = Buffer.from(JSON.stringify(p)).toString('base64url')
  const sig = crypto.createHmac('sha256', SECRET).update(body).digest('base64url')
  return `${body}.${sig}`
}

export function normalizeScannedQrInput(input: string): string {
  if (!input) return input

  const normalizedInput = input.trim()

  // Caso principal: extraer ?t=token desde URLs absolutas o relativas.
  if (normalizedInput.includes('?t=') || normalizedInput.includes('&t=')) {
    try {
      const url = normalizedInput.startsWith('http')
        ? new URL(normalizedInput)
        : new URL(normalizedInput, 'https://local')

      const token = url.searchParams.get('t')
      if (token) return decodeURIComponent(token)
    } catch {
      // Fallback manual para strings mal formados
      const match = normalizedInput.match(/[?&]t=([^&]+)/)
      if (match?.[1]) {
        return decodeURIComponent(match[1])
      }
    }
  }

  // Soporte para payload directo tipo "t=..."
  if (normalizedInput.startsWith('t=')) {
    return decodeURIComponent(normalizedInput.slice(2))
  }

  return normalizedInput
}

export function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

// (opcional) verificación, la usaremos en la vista del verificador
export function verifyToken(token: string): RedeemPayload | null {
  try {
    const [body, sig] = token.split('.')
    if (!body || !sig) return null

    const calc = crypto.createHmac('sha256', SECRET).update(body).digest('base64url')
    const sigBuf = Buffer.from(sig)
    const calcBuf = Buffer.from(calc)

    // Evita excepción de timingSafeEqual por longitud distinta.
    if (sigBuf.length !== calcBuf.length) return null
    if (!crypto.timingSafeEqual(sigBuf, calcBuf)) return null

    const payload = JSON.parse(Buffer.from(body, 'base64url').toString()) as RedeemPayload
    if (!payload?.u || !payload?.c || !payload?.exp) return null
    if (payload.exp * 1000 < Date.now()) return null

    return payload
  } catch {
    return null
  }
}