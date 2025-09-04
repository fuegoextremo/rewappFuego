"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { 
  createUser, 
  updateUser, 
  type UserWithProfile,
  type CreateUserData,
  type UpdateUserData 
} from "@/app/superadmin/users/actions";

interface Branch {
  id: string;
  name: string;
  is_active: boolean | null;
}

interface UserFormProps {
  open: boolean;
  onOpenChange: ((open: boolean) => void) | undefined;
  user?: UserWithProfile;
  mode: "create" | "edit";
  branches: Branch[];
}

export default function UserForm(props: UserFormProps) {
  const { open, onOpenChange, user, mode, branches } = props;
  const [formData, setFormData] = useState<CreateUserData>({
    email: "",
    password: "",
    first_name: "",
    last_name: "",
    phone: "",
    role: "client",
    branch_id: "",
    is_active: true,
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Actualizar formulario cuando cambie el usuario o el modo
  useEffect(() => {
    if (mode === "edit" && user) {
      setFormData({
        email: user.email,
        password: "", // No mostrar contraseña actual
        first_name: user.first_name || "",
        last_name: user.last_name || "",
        phone: user.phone || "",
        role: (user.role as CreateUserData['role']) || "client",
        branch_id: user.branch_id || "",
        is_active: user.is_active ?? true,
      });
    } else if (mode === "create") {
      setFormData({
        email: "",
        password: "",
        first_name: "",
        last_name: "",
        phone: "",
        role: "client",
        branch_id: "",
        is_active: true,
      });
    }
  }, [user, mode, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (mode === "create") {
        // Validar campos requeridos para creación
        if (!formData.email || !formData.password || !formData.first_name || !formData.last_name) {
          throw new Error("Todos los campos marcados con * son requeridos");
        }

        const result = await createUser(formData);
        if (!result.success) {
          throw new Error(result.error);
        }
        
        toast({
          title: "¡Éxito!",
          description: result.message,
        });
      } else if (user?.id) {
        // Para edición, no enviamos email ni password
        const updateData: UpdateUserData = {
          first_name: formData.first_name,
          last_name: formData.last_name,
          phone: formData.phone || undefined,
          role: formData.role,
          branch_id: formData.branch_id || undefined,
          is_active: formData.is_active,
        };

        const result = await updateUser(user.id, updateData);
        if (!result.success) {
          throw new Error(result.error);
        }
        
        toast({
          title: "¡Éxito!",
          description: result.message,
        });
      }
      
      // Resetear formulario
      setFormData({
        email: "",
        password: "",
        first_name: "",
        last_name: "",
        phone: "",
        role: "client",
        branch_id: "",
        is_active: true,
      });
      onOpenChange?.(false);
      
    } catch (error) {
      console.error('Error en handleSubmit:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Ha ocurrido un error inesperado",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setFormData({
        email: "",
        password: "",
        first_name: "",
        last_name: "",
        phone: "",
        role: "client",
        branch_id: "",
        is_active: true,
      });
    }
    onOpenChange?.(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Crear Nuevo Usuario" : "Editar Usuario"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create" 
              ? "Completa los datos para crear un nuevo usuario en el sistema."
              : "Modifica los datos del usuario seleccionado."
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="usuario@empresa.com"
                required
                disabled={mode === "edit"} // No permitir cambiar email en edición
              />
              {mode === "edit" && (
                <p className="text-xs text-gray-500">El email no se puede modificar</p>
              )}
            </div>

            {/* Password - Solo en modo crear */}
            {mode === "create" && (
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña *</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Mínimo 6 caracteres"
                  required
                  minLength={6}
                />
              </div>
            )}

            {/* Nombre */}
            <div className="space-y-2">
              <Label htmlFor="first_name">Nombre *</Label>
              <Input
                id="first_name"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                placeholder="Juan"
                required
              />
            </div>

            {/* Apellido */}
            <div className="space-y-2">
              <Label htmlFor="last_name">Apellido *</Label>
              <Input
                id="last_name"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                placeholder="Pérez"
                required
              />
            </div>

            {/* Teléfono */}
            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+52 555 123 4567"
              />
            </div>

            {/* Rol */}
            <div className="space-y-2">
              <Label htmlFor="role">Rol *</Label>
              <Select
                value={formData.role}
                onValueChange={(value: CreateUserData['role']) => 
                  setFormData({ ...formData, role: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar rol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="client">Cliente</SelectItem>
                  <SelectItem value="verifier">Verificador</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="superadmin">SuperAdministrador</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="branch">Sucursal</Label>
              <Select
                value={formData.branch_id || "none"}
                onValueChange={(value) => 
                  setFormData({ ...formData, branch_id: value === "none" ? "" : value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar sucursal (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin sucursal asignada</SelectItem>
                  {branches.map((branch) => (
                    <SelectItem key={branch.id} value={branch.id}>
                      {branch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Estado Activo */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="is_active">Usuario Activo</Label>
              <p className="text-sm text-gray-500">
                Los usuarios inactivos no pueden acceder al sistema
              </p>
            </div>
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked: boolean) => 
                setFormData({ ...formData, is_active: checked })
              }
            />
          </div>

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange?.(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isLoading 
                ? "Guardando..." 
                : mode === "create" 
                  ? "Crear Usuario" 
                  : "Guardar Cambios"
              }
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
