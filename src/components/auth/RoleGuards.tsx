'use client'

import { RouteGuard } from './RouteGuard'

// 🎨 Componentes especializados para casos comunes

export function ClientGuard({ children }: { children: React.ReactNode }) {
  return (
    <RouteGuard allowedRoles={['client', 'verifier', 'manager', 'admin', 'superadmin']}>
      {children}
    </RouteGuard>
  )
}

export function AdminGuard({ children }: { children: React.ReactNode }) {
  return (
    <RouteGuard allowedRoles={['verifier', 'manager', 'admin', 'superadmin']}>
      {children}
    </RouteGuard>
  )
}

export function SuperAdminGuard({ children }: { children: React.ReactNode }) {
  return (
    <RouteGuard allowedRoles={['superadmin']}>
      {children}
    </RouteGuard>
  )
}

export function StaffGuard({ children }: { children: React.ReactNode }) {
  return (
    <RouteGuard allowedRoles={['verifier', 'manager', 'admin']}>
      {children}
    </RouteGuard>
  )
}

// 🔐 Guards específicos para páginas admin
export function ScannerGuard({ children }: { children: React.ReactNode }) {
  return (
    <RouteGuard allowedRoles={['verifier', 'manager', 'admin', 'superadmin']}>
      {children}
    </RouteGuard>
  )
}

export function DashboardGuard({ children }: { children: React.ReactNode }) {
  return (
    <RouteGuard allowedRoles={['manager', 'admin', 'superadmin']}>
      {children}
    </RouteGuard>
  )
}

export function UsersGuard({ children }: { children: React.ReactNode }) {
  return (
    <RouteGuard allowedRoles={['manager', 'admin', 'superadmin']}>
      {children}
    </RouteGuard>
  )
}

export function PrizesGuard({ children }: { children: React.ReactNode }) {
  return (
    <RouteGuard allowedRoles={['manager', 'admin', 'superadmin']}>
      {children}
    </RouteGuard>
  )
}

export function SettingsGuard({ children }: { children: React.ReactNode }) {
  return (
    <RouteGuard allowedRoles={['admin', 'superadmin']}>
      {children}
    </RouteGuard>
  )
}

export function ManagerGuard({ children }: { children: React.ReactNode }) {
  return (
    <RouteGuard allowedRoles={['manager', 'admin', 'superadmin']}>
      {children}
    </RouteGuard>
  )
}
