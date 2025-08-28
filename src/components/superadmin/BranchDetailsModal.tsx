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
import { MapPinIcon, UsersIcon, ClockIcon, CalendarIcon } from "@heroicons/react/24/outline";

type BranchWithStats = {
  id: string;
  name: string;
  address: string | null;
  is_active: boolean | null;
  created_at: string | null;
  updated_at: string | null;
  user_profiles: { count: number }[];
  check_ins: { count: number }[];
};

interface BranchDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  branch: BranchWithStats | null;
}

export default function BranchDetailsModal({ 
  open, 
  onOpenChange, 
  branch 
}: BranchDetailsModalProps) {
  if (!branch) return null;

  const employeeCount = branch.user_profiles?.[0]?.count || 0;
  const checkInsCount = branch.check_ins?.[0]?.count || 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPinIcon className="w-5 h-5 text-purple-600" />
            Detalles de la Sucursal
          </DialogTitle>
          <DialogDescription>
            Información completa de {branch.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Información básica */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-gray-900">Información General</h4>
              <div className="flex items-center gap-2">
                <Badge 
                  variant={branch.is_active ? "default" : "destructive"}
                  className="text-xs"
                >
                  {branch.is_active ? "Activa" : "Inactiva"}
                </Badge>
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-500">Nombre:</span>
                <p className="mt-1 text-gray-900">{branch.name}</p>
              </div>
              <div>
                <span className="font-medium text-gray-500">Dirección:</span>
                <p className="mt-1 text-gray-900">{branch.address || "No especificada"}</p>
              </div>
            </div>
          </div>

          {/* Estadísticas de actividad */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Estadísticas de Actividad</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <UsersIcon className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">Empleados</span>
                </div>
                <div className="text-2xl font-bold text-blue-600">
                  {employeeCount}
                </div>
                <div className="text-xs text-blue-600">
                  Usuarios asignados
                </div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <ClockIcon className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-green-800">Check-ins</span>
                </div>
                <div className="text-2xl font-bold text-green-600">
                  {checkInsCount}
                </div>
                <div className="text-xs text-green-600">
                  Visitas registradas
                </div>
              </div>
            </div>
          </div>

          {/* Información de fechas */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Información del Sistema</h4>
            <div className="grid grid-cols-1 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-gray-500" />
                <div>
                  <span className="font-medium text-gray-500">Fecha de creación:</span>
                  <p className="text-gray-900">
                    {branch.created_at 
                      ? new Date(branch.created_at).toLocaleDateString('es-ES', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })
                      : "No disponible"
                    }
                  </p>
                </div>
              </div>
              {branch.updated_at && branch.updated_at !== branch.created_at && (
                <div className="flex items-center gap-2">
                  <ClockIcon className="w-4 h-4 text-gray-500" />
                  <div>
                    <span className="font-medium text-gray-500">Última actualización:</span>
                    <p className="text-gray-900">
                      {new Date(branch.updated_at).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ID técnico */}
          <div className="pt-4 border-t">
            <div className="text-xs text-gray-500">
              <span className="font-medium">ID del sistema:</span> {branch.id}
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
