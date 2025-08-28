import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { type UserWithProfile } from "@/app/superadmin/users/actions";

interface UserDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserWithProfile | null;
}

export default function UserDetailsModal({ 
  open, 
  onOpenChange, 
  user 
}: UserDetailsModalProps) {
  if (!user) return null;

  const getRoleBadge = (role: string | null) => {
    switch (role) {
      case 'superadmin':
        return <Badge variant="destructive" className="text-xs">SuperAdmin</Badge>;
      case 'admin':
        return <Badge variant="default" className="text-xs bg-purple-600">Admin</Badge>;
      case 'verifier':
        return <Badge variant="secondary" className="text-xs bg-blue-600 text-white">Verificador</Badge>;
      case 'user':
        return <Badge variant="outline" className="text-xs">Usuario</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">Sin rol</Badge>;
    }
  };

  const getFullName = () => {
    if (user.first_name && user.last_name) {
      return `${user.first_name} ${user.last_name}`;
    }
    return user.email.split('@')[0];
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Detalles del Usuario</DialogTitle>
          <DialogDescription>
            Información completa de {getFullName()}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Información básica */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-gray-900">Información Personal</h4>
              <div className="flex items-center gap-2">
                {getRoleBadge(user.role)}
                <Badge 
                  variant={user.is_active ? "default" : "destructive"}
                  className="text-xs"
                >
                  {user.is_active ? "Activo" : "Inactivo"}
                </Badge>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-500">Nombre:</span>
                <p className="mt-1">{user.first_name || "No especificado"}</p>
              </div>
              <div>
                <span className="font-medium text-gray-500">Apellido:</span>
                <p className="mt-1">{user.last_name || "No especificado"}</p>
              </div>
              <div>
                <span className="font-medium text-gray-500">Email:</span>
                <p className="mt-1">{user.email}</p>
              </div>
              <div>
                <span className="font-medium text-gray-500">Teléfono:</span>
                <p className="mt-1">{user.phone || "No especificado"}</p>
              </div>
            </div>
          </div>

          {/* Información organizacional */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Información Organizacional</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-500">Rol:</span>
                <p className="mt-1 capitalize">{user.role || "Sin rol"}</p>
              </div>
              <div>
                <span className="font-medium text-gray-500">Sucursal:</span>
                <p className="mt-1">{user.branch_name || "Sin asignar"}</p>
              </div>
              <div>
                <span className="font-medium text-gray-500">Fecha de registro:</span>
                <p className="mt-1">
                  {user.created_at 
                    ? new Date(user.created_at).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })
                    : "No disponible"
                  }
                </p>
              </div>
              <div>
                <span className="font-medium text-gray-500">Estado:</span>
                <p className="mt-1">{user.is_active ? "Activo" : "Inactivo"}</p>
              </div>
            </div>
          </div>

          {/* Estadísticas de actividad */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Estadísticas de Actividad</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {user.total_checkins || 0}
                </div>
                <div className="text-sm text-blue-600">Check-ins realizados</div>
              </div>
              <div className="bg-green-50 p-3 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {user.available_spins || 0}
                </div>
                <div className="text-sm text-green-600">Giros disponibles</div>
              </div>
            </div>
          </div>

          {/* ID técnico */}
          <div className="pt-4 border-t">
            <div className="text-xs text-gray-500">
              <span className="font-medium">ID del sistema:</span> {user.id}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
          >
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
