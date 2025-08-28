import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Shield } from "lucide-react";

interface SuperAdminBannerProps {
  userProfile: {
    first_name: string | null;
    last_name: string | null;
    role: string | null;
    email: string;
  } | null;
}

export default function SuperAdminBanner({ userProfile }: SuperAdminBannerProps) {
  // Solo mostrar si es SuperAdmin y solo en móvil
  if (!userProfile || userProfile.role !== 'superadmin') {
    return null;
  }

  const getDisplayName = () => {
    if (userProfile.first_name && userProfile.last_name) {
      return `${userProfile.first_name} ${userProfile.last_name}`;
    }
    return userProfile.email?.split('@')[0] || 'Usuario';
  };

  return (
    <div className="md:hidden bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-lg mb-4 rounded-lg mx-2">
      <div className="px-3 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-white bg-opacity-20 flex items-center justify-center">
              <Shield className="w-3 h-3 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium">
                  👑 SuperAdmin
                </span>
                <Badge variant="secondary" className="text-xs bg-white bg-opacity-20 text-white border-white border-opacity-30">
                  {getDisplayName()}
                </Badge>
              </div>
            </div>
          </div>
          
          <Link href="/superadmin">
            <Button 
              variant="outline" 
              size="sm" 
              className="text-purple-700 border-white bg-white hover:bg-purple-50 hover:border-purple-200 transition-colors text-xs px-2 py-1 h-auto"
            >
              <ArrowLeft className="w-3 h-3 mr-1" />
              Volver
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
