import crypto from 'crypto'

const SECRET = process.env.QR_SECRET_KEY! // añade en .env.local

export type RedeemPayload = {
  c: string // coupon_id
  u: string // user_id dueño del cupón
  exp: number // epoch seconds
}

export function signPayload(p: RedeemPayload) {
  const body = Buffer.from(JSON.stringify(p)).toString('base64url')
  const sig = crypto.createHmac('sha256', SECRET).update(body).digest('base64url')
  return `${body}.${sig}`
}

// (opcional) verificación, la usaremos en la vista del verificador
export function verifyToken(token: string): RedeemPayload | null {
  const [body, sig] = token.split('.')
  if (!body || !sig) return null
  const calc = crypto.createHmac('sha256', SECRET).update(body).digest('base64url')
  const sigBuf = Buffer.from(sig)
  const calcBuf = Buffer.from(calc)
  if (!crypto.timingSafeEqual(new Uint8Array(sigBuf), new Uint8Array(calcBuf))) {
    return null
  }
  const payload = JSON.parse(Buffer.from(body, 'base64url').toString()) as RedeemPayload
  if (payload.exp * 1000 < Date.now()) return null
  return payload
}