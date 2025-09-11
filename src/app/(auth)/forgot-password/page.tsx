/**
 * 🔐 FORGOT PASSWORD PAGE
 * Página de recuperación de contraseña con email
 */

'use client'

import { AuthLayout } from '@/components/auth/AuthLayout'
import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm'

export default function ForgotPasswordPage() {
  return (
    <AuthLayout 
      title="Recuperar Contraseña"
      subtitle="Ingresa tu email para recibir un enlace de recuperación"
      showBackToHome={true}
    >
      <ForgotPasswordForm />
    </AuthLayout>
  )
}
