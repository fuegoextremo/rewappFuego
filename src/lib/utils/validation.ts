// src/lib/utils/validation.ts
import { z } from 'zod'

export const profileSchema = z.object({
  first_name: z.string().trim().max(80, 'Nombre muy largo').optional().or(z.literal('')),
  last_name: z.string().trim().max(100, 'Apellidos muy largos').optional().or(z.literal('')),
  phone: z
    .string()
    .trim()
    .regex(/^\d{10}$/, 'El teléfono debe tener 10 dígitos')
    .optional()
    .or(z.literal('')),
  // YYYY-MM-DD (el input type="date" ya da este formato)
  birth_date: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida (YYYY-MM-DD)')
    .optional()
    .or(z.literal('')),
})

export const passwordChangeSchema = z
  .object({
    current_password: z.string().min(6, 'Contraseña actual inválida'),
    new_password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
    confirm_password: z.string().min(8, 'Confirma tu nueva contraseña'),
  })
  .refine((v) => v.new_password === v.confirm_password, {
    message: 'Las contraseñas no coinciden',
    path: ['confirm_password'],
  })