import { AppShell } from '@/components/client/AppShell'
import { ClientGuard } from '@/components/auth/RoleGuards'

export default function ClientPage() {
  return (
    <ClientGuard>
      <AppShell />
    </ClientGuard>
  )
}
