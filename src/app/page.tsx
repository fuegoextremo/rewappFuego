/**
 * 🏠 PÁGINA RAÍZ
 * Redirección temporal a /login mientras se desarrolla landing page dedicada
 */

import { redirect } from 'next/navigation'

export default function HomePage() {
  // Redirección inmediata a login
  redirect('/login')
}