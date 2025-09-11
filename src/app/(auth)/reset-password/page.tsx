/**
 * 🔐 RESET PASSWORD PAGE
 * Página para establecer nueva contraseña con token
 */

'use client'

import { Suspense } from 'react'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm'

function ResetPasswordContent() {
  return (
    <AuthLayout 
      title="Nueva Contraseña"
      subtitle="Ingresa tu nueva contraseña"
      showBackToHome={true}
    >
      <ResetPasswordForm />
    </AuthLayout>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  )
}
