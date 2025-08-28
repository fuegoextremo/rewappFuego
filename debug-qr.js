// Script de debug para verificar el formato de QR de cupones
import crypto from 'crypto';

const SECRET = 'your-secret-key-here'; // Asume que es el mismo

function signPayload(p) {
  const body = Buffer.from(JSON.stringify(p)).toString('base64url');
  const sig = crypto.createHmac('sha256', SECRET).update(body).digest('base64url');
  return `${body}.${sig}`;
}

function verifyToken(token) {
  const [body, sig] = token.split('.');
  if (!body || !sig) return null;
  const calc = crypto.createHmac('sha256', SECRET).update(body).digest('base64url');
  const sigBuf = Buffer.from(sig);
  const calcBuf = Buffer.from(calc);
  if (!crypto.timingSafeEqual(new Uint8Array(sigBuf), new Uint8Array(calcBuf))) {
    return null;
  }
  const payload = JSON.parse(Buffer.from(body, 'base64url').toString());
  if (payload.exp * 1000 < Date.now()) return null;
  return payload;
}

// Simular un QR de cupón
const couponPayload = {
  c: '123e4567-e89b-12d3-a456-426614174000', // UUID del cupón
  u: '987fcdeb-51a2-4321-b654-321987654321', // UUID del usuario
  exp: Math.floor(Date.now() / 1000) + 5 * 60 // 5 minutos
};

console.log('Payload del cupón:', couponPayload);

const token = signPayload(couponPayload);
console.log('Token firmado:', token);

const qrDataUrl = `http://localhost:3001/staff/redeem?t=${token}`;
console.log('QR Data (URL completa):', qrDataUrl);

// Simular un QR de check-in
const checkinPayload = {
  c: 'USR001', // unique_code del usuario
  u: '987fcdeb-51a2-4321-b654-321987654321', // UUID del usuario
  exp: Math.floor(Date.now() / 1000) + 5 * 60 // 5 minutos
};

console.log('\nPayload del check-in:', checkinPayload);

const checkinToken = signPayload(checkinPayload);
console.log('Token de check-in:', checkinToken);

// Verificar tokens
console.log('\n--- Verificación ---');
console.log('Cupón verificado:', verifyToken(token));
console.log('Check-in verificado:', verifyToken(checkinToken));
