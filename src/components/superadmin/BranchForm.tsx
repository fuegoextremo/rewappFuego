"use client";

// eslint-disable-next-line @next/next/no-assign-module-variable
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
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { createBranch, updateBranch } from "@/app/superadmin/branches/actions";

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

interface BranchFormProps {
  open: boolean;
  onOpenChange: ((open: boolean) => void) | undefined;
  branch?: BranchWithStats | null;
  mode: "create" | "edit";
}

export default function BranchForm(props: BranchFormProps) {
  const { open, onOpenChange, branch, mode } = props;
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    is_active: true,
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Actualizar el formulario cuando cambie la sucursal o el modo
  useEffect(() => {
    console.log('BranchForm useEffect:', { mode, branch, open });
    if (mode === "edit" && branch) {
      console.log('Setting form data for edit:', branch);
      setFormData({
        name: branch.name || "",
        address: branch.address || "",
        is_active: branch.is_active ?? true,
      });
    } else if (mode === "create") {
      console.log('Setting form data for create');
      setFormData({
        name: "",
        address: "",
        is_active: true,
      });
    }
  }, [branch, mode, open]); // Incluir 'open' para resetear cuando se abre/cierra

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (mode === "create") {
        await createBranch(formData);
      } else if (branch?.id) {
        await updateBranch(branch.id, formData);
      }
      
      toast({
        title: "¡Éxito!",
        description: mode === "create" 
          ? "Sucursal creada correctamente" 
          : "Sucursal actualizada correctamente",
      });
      
      setFormData({
        name: "",
        address: "",
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
        name: branch?.name || "",
        address: branch?.address || "",
        is_active: branch?.is_active ?? true,
      });
    }
    onOpenChange?.(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Crear Nueva Sucursal" : "Editar Sucursal"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create" 
              ? "Completa los datos para crear una nueva sucursal en el sistema."
              : "Modifica los datos de la sucursal seleccionada."
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Nombre */}
          <div className="space-y-2">
            <Label htmlFor="name">Nombre de la Sucursal *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ej: Sucursal Centro"
              required
            />
          </div>

          {/* Dirección */}
          <div className="space-y-2">
            <Label htmlFor="address">Dirección</Label>
            <Textarea
              id="address"
              value={formData.address || ""}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Dirección completa de la sucursal"
              rows={3}
            />
          </div>

          {/* Estado Activo */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="is_active">Sucursal Activa</Label>
              <p className="text-sm text-gray-500">
                Las sucursales inactivas no aparecen en la aplicación móvil
              </p>
            </div>
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked: boolean) => setFormData({ ...formData, is_active: checked })}
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
              className="bg-purple-600 hover:bg-purple-700"
            >
              {isLoading 
                ? "Guardando..." 
                : mode === "create" 
                  ? "Crear Sucursal" 
                  : "Guardar Cambios"
              }
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
