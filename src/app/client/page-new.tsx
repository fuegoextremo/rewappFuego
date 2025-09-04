'use client'

import { AppShell } from '@/components/client/AppShell'

export default function ClientSPAPage() {
  return <AppShell>
    {/* Este será el fallback si no hay vista específica seleccionada */}
    <div className="text-center py-12">
      <p className="text-gray-500">Cargando aplicación...</p>
    </div>
  </AppShell>
}