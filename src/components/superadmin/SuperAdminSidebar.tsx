"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import { 
  HomeIcon, 
  BuildingOfficeIcon, 
  UsersIcon, 
  CogIcon,
  ChartBarIcon,
  PowerIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';
import { signOut } from "@/lib/auth/actions";

interface SuperAdminSidebarProps {
  userProfile: {
    first_name: string | null;
    last_name: string | null;
  };
}

const navigationItems = [
  {
    name: 'Dashboard',
    href: '/superadmin/dashboard',
    icon: HomeIcon,
  },
  {
    name: 'Sucursales',
    href: '/superadmin/branches',
    icon: BuildingOfficeIcon,
  },
  {
    name: 'Usuarios',
    href: '/superadmin/users',
    icon: UsersIcon,
  },
  {
    name: 'Analytics',
    href: '/superadmin/analytics',
    icon: ChartBarIcon,
  },
  {
    name: 'Sistema',
    href: '/superadmin/system',
    icon: CogIcon,
  },
];

export default function SuperAdminSidebar({ userProfile }: SuperAdminSidebarProps) {
  const pathname = usePathname();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <>
      {/* Mobile Bottom Navigation */}
      <div className="md:hidden bg-gradient-to-r from-purple-900 to-purple-800 border-t border-purple-700 shadow-lg">
        <div className="flex justify-around items-center py-2 px-1">
          {navigationItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={clsx(
                  "flex flex-col items-center justify-center p-2 rounded-lg transition-all duration-200 min-w-0 flex-1",
                  isActive
                    ? "text-white bg-purple-700"
                    : "text-purple-200 hover:text-white"
                )}
              >
                <item.icon className={clsx(
                  "w-5 h-5 mb-1",
                  isActive ? "text-white" : "text-purple-200"
                )} />
                <span className={clsx(
                  "text-xs font-medium truncate text-center",
                  isActive ? "text-white" : "text-purple-200"
                )}>
                  {item.name}
                </span>
              </Link>
            );
          })}
          
          {/* Logout Button - Solo móvil */}
          <button
            onClick={handleSignOut}
            className="flex flex-col items-center justify-center p-2 rounded-lg transition-all duration-200 min-w-0 flex-1 text-purple-300 hover:text-white"
          >
            <PowerIcon className="w-5 h-5 mb-1" />
            <span className="text-xs font-medium truncate text-center">
              Salir
            </span>
          </button>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden md:block fixed inset-y-0 left-0 z-50 w-64 bg-gradient-to-b from-purple-900 to-purple-800 shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-center h-16 px-4 bg-purple-950">
        <h1 className="text-xl font-bold text-white">
          👑 SUPERADMIN
        </h1>
      </div>

      {/* User Info */}
      <div className="p-4 border-b border-purple-700">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center">
            <span className="text-white font-semibold text-sm">
              {userProfile.first_name?.[0] || 'S'}
            </span>
          </div>
          <div>
            <p className="text-white font-medium text-sm">
              {userProfile.first_name} {userProfile.last_name}
            </p>
            <p className="text-purple-300 text-xs">Super Administrador</p>
          </div>
        </div>
      </div>

      {/* Quick Access to Admin */}
      <div className="p-3 border-b border-purple-700">
        <Link 
          href="/admin/dashboard"
          className="flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium bg-green-600 hover:bg-green-700 text-white transition-colors"
        >
          <span>🏢 Entrar a Admin</span>
          <ArrowRightIcon className="w-4 h-4" />
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-2 overflow-y-auto">
        <ul className="space-y-1">
          {navigationItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={`
                    flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors
                    ${isActive 
                      ? 'bg-purple-700 text-white shadow-lg' 
                      : 'text-purple-200 hover:bg-purple-700 hover:text-white'
                    }
                  `}
                >
                  <item.icon className="w-5 h-5 mr-3" />
                  {item.name}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-purple-700">
        <button 
          onClick={handleSignOut}
          className="flex items-center w-full px-3 py-2 rounded-lg text-sm font-medium text-purple-200 hover:bg-purple-700 hover:text-white transition-colors"
        >
          <PowerIcon className="w-5 h-5 mr-3" />
          Cerrar Sesión
        </button>
      </div>
    </div>
    </>
  );
}
