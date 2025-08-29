
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Award,
  QrCode,
  Settings,
  LogOut,
  ArrowLeft,
  Shield,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import clsx from "clsx";
import { useEffect, useState } from "react";
import { createClientBrowser } from "@/lib/supabase/client";
import { signOut } from "@/lib/auth/actions";

const links = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Usuarios", href: "/users", icon: Users },
  { name: "Premios", href: "/prizes", icon: Award },
  { name: "Scanner", href: "/scanner", icon: QrCode },
  { name: "Ajustes", href: "/settings", icon: Settings },
];

interface UserProfile {
  first_name: string | null;
  last_name: string | null;
  role: string | null;
  email: string;
}

export default function Sidebar() {
  const pathname = usePathname();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const supabase = createClientBrowser();

  useEffect(() => {
    async function getUserProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("user_profiles")
          .select("first_name, last_name, role")
          .eq("id", user.id)
          .single();
        
        if (profile) {
          setUserProfile({
            ...profile,
            email: user.email || '',
          });
        }
      }
    }
    getUserProfile();
  }, [supabase]);

  const getDisplayName = () => {
    if (userProfile?.first_name && userProfile?.last_name) {
      return `${userProfile.first_name} ${userProfile.last_name}`;
    }
    return userProfile?.email?.split('@')[0] || 'Usuario';
  };

  const getRoleBadge = () => {
    if (userProfile?.role === 'superadmin') {
      return <Badge variant="destructive" className="text-xs">SuperAdmin</Badge>;
    }
    if (userProfile?.role === 'admin') {
      return <Badge variant="default" className="text-xs bg-purple-600">Admin</Badge>;
    }
    return null;
  };

  const isSuperAdmin = userProfile?.role === 'superadmin';

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
      <div className="md:hidden bg-white border-t border-gray-200 shadow-lg">
        <div className="flex justify-around items-center py-2 px-1">
          {links.map((link) => {
            const LinkIcon = link.icon;
            const isActive = pathname === `/admin${link.href}`;
            return (
              <Link
                key={link.name}
                href={`/admin${link.href}`}
                className={clsx(
                  "flex flex-col items-center justify-center p-2 rounded-lg transition-all duration-200 min-w-0 flex-1",
                  isActive
                    ? "text-blue-600"
                    : "text-gray-500 hover:text-gray-700"
                )}
              >
                <LinkIcon className={clsx(
                  "w-5 h-5 mb-1",
                  isActive ? "text-blue-600" : "text-gray-500"
                )} />
                <span className={clsx(
                  "text-xs font-medium truncate text-center",
                  isActive ? "text-blue-600" : "text-gray-500"
                )}>
                  {link.name}
                </span>
              </Link>
            );
          })}
          
          {/* Logout Button - Solo móvil */}
          <button
            onClick={handleSignOut}
            className="flex flex-col items-center justify-center p-2 rounded-lg transition-all duration-200 min-w-0 flex-1 text-red-500 hover:text-red-700"
          >
            <LogOut className="w-5 h-5 mb-1" />
            <span className="text-xs font-medium truncate text-center">
              Salir
            </span>
          </button>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden md:flex h-full flex-col bg-white border-r border-gray-200 shadow-sm">
        {/* Header con información del usuario */}
        {userProfile && (
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-md">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {getDisplayName()}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  {getRoleBadge()}
                  {isSuperAdmin && (
                    <span className="text-xs text-gray-500 font-medium">Panel Admin</span>
                  )}
                </div>
              </div>
            </div>
            
            {isSuperAdmin && (
              <Link href="/superadmin">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full text-xs border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300"
                >
                  <ArrowLeft className="w-3 h-3 mr-2" />
                  Volver a SuperAdmin
                </Button>
              </Link>
            )}
          </div>
        )}

        {/* Navigation Links */}
        <div className="flex-1 flex flex-col">
          <nav className="flex-1 p-3">
            <div className="space-y-1">
              {links.map((link) => {
                const LinkIcon = link.icon;
                const isActive = pathname === `/admin${link.href}`;
                return (
                  <Link
                    key={link.name}
                    href={`/admin${link.href}`}
                    className={clsx(
                      "flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200",
                      isActive
                        ? "bg-blue-50 text-blue-700 border border-blue-200 shadow-sm"
                        : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                    )}
                  >
                    <LinkIcon className={clsx(
                      "w-5 h-5",
                      isActive ? "text-blue-600" : "text-gray-500"
                    )} />
                    <span className="truncate">{link.name}</span>
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* Actions */}
          <div className="p-3 border-t border-gray-200 space-y-2">
            {/* Ver como Cliente Button */}
            <Link href="/client?admin=true">
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 px-3 py-2.5 text-sm font-medium text-blue-600 hover:bg-blue-50 hover:text-blue-700 rounded-lg transition-all duration-200"
              >
                <Eye className="w-5 h-5" />
                <span>Ver como Cliente</span>
              </Button>
            </Link>
            
            {/* Logout Button */}
            <Button
              onClick={handleSignOut}
              variant="ghost"
              className="w-full justify-start gap-3 px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 hover:text-red-700 rounded-lg transition-all duration-200"
            >
              <LogOut className="w-5 h-5" />
              <span>Cerrar Sesión</span>
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
