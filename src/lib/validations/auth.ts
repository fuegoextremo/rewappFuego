/**
 * 🔐 AUTH VALIDATIONS
 * Esquemas de validación para formularios de autenticación
 * Usando Zod para validación del lado cliente
 */

import { z } from 'zod'

// 📧 Validación de email
export const emailSchema = z
  .string()
  .min(1, 'El email es requerido')
  .email('Formato de email inválido')

// 🔐 Validación de contraseña
export const passwordSchema = z
  .string()
  .min(6, 'La contraseña debe tener al menos 6 caracteres')

// 📱 Validación de teléfono (con selector de país)
export const phoneSchema = z
  .string()
  .min(1, 'El teléfono es requerido')
  .refine((phone) => {
    // El componente PhoneInput ya maneja el formato internacional
    // Solo validamos que no esté vacío y tenga un formato válido
    if (!phone || phone.length < 8) {
      return false
    }
    // Acepta cualquier formato que venga del PhoneInput
    return true
  }, 'Número de teléfono inválido. Ingresa un número válido de 10 dígitos.')

// 📅 Validación de fecha de nacimiento
export const birthDateSchema = z
  .string()
  .min(1, 'La fecha de nacimiento es requerida')
  .refine((date) => {
    const birthDate = new Date(date)
    const today = new Date()
    const age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      return age - 1 >= 13
    }
    
    return age >= 13
  }, 'Debes ser mayor de 13 años')

// 👤 Validación de nombre
export const nameSchema = z
  .string()
  .min(1, 'Este campo es requerido')
  .min(2, 'Debe tener al menos 2 caracteres')
  .max(50, 'Máximo 50 caracteres')

// ✅ Schema completo para LOGIN
export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
})

// ✅ Schema completo para REGISTRO
export const registerSchema = z.object({
  firstName: nameSchema,
  lastName: nameSchema,
  email: emailSchema,
  phone: phoneSchema,
  birthDate: birthDateSchema,
  password: passwordSchema,
  confirmPassword: passwordSchema,
  acceptTerms: z.boolean().refine(val => val === true, {
    message: 'Debes aceptar los términos y condiciones'
  })
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword']
})

// ✅ Schema para COMPLETAR PERFIL (OAuth)
export const completeProfileSchema = z.object({
  phone: phoneSchema,
  birthDate: birthDateSchema,
  acceptTerms: z.boolean().refine(val => val === true, 'Debes aceptar los términos y condiciones')
})

// ✅ Schema para FORGOT PASSWORD
export const forgotPasswordSchema = z.object({
  email: emailSchema,
})

// ✅ Schema para RESET PASSWORD
export const resetPasswordSchema = z.object({
  password: passwordSchema,
  confirmPassword: passwordSchema,
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword']
})

// 📝 Tipos TypeScript exportados
export type LoginFormData = z.infer<typeof loginSchema>
export type RegisterFormData = z.infer<typeof registerSchema>
export type CompleteProfileFormData = z.infer<typeof completeProfileSchema>
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>
