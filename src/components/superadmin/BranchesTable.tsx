"use client";

import { useState } from "react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  PencilIcon, 
  TrashIcon, 
  MapPinIcon, 
  EyeIcon,
  PowerIcon 
} from "@heroicons/react/24/outline";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { deleteBranch, toggleBranchStatus } from "@/app/superadmin/branches/actions";
import BranchForm from "./BranchForm";

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

interface BranchesTableProps {
  branches: BranchWithStats[];
  onBranchUpdated?: () => void;
}

export default function BranchesTable({ branches, onBranchUpdated }: BranchesTableProps) {
  const [selectedBranch, setSelectedBranch] = useState<BranchWithStats | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const { toast } = useToast();

  const handleEdit = (branch: BranchWithStats) => {
    setSelectedBranch(branch);
    setFormMode("edit");
    setFormOpen(true);
  };

  const handleDelete = (branch: BranchWithStats) => {
    setSelectedBranch(branch);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedBranch) return;
    
    try {
      await deleteBranch(selectedBranch.id);
      toast({
        title: "¡Éxito!",
        description: "Sucursal marcada como inactiva correctamente",
      });
      setDeleteDialogOpen(false);
      setSelectedBranch(null);
      onBranchUpdated?.(); // Recargar la lista
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo eliminar la sucursal",
        variant: "destructive",
      });
    }
  };

  const handleToggleStatus = async (branch: BranchWithStats) => {
    try {
      await toggleBranchStatus(branch.id, branch.is_active || false);
      toast({
        title: "¡Éxito!",
        description: `Sucursal ${branch.is_active ? 'desactivada' : 'activada'} correctamente`,
      });
      onBranchUpdated?.(); // Recargar la lista
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo cambiar el estado",
        variant: "destructive",
      });
    }
  };

  if (branches.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <div className="mx-auto w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
          <MapPinIcon className="w-6 h-6 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-1">No hay sucursales</h3>
        <p className="text-sm text-gray-500">Comienza creando tu primera sucursal.</p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50/50">
              <TableHead className="font-semibold">Sucursal</TableHead>
              <TableHead className="font-semibold">Dirección</TableHead>
              <TableHead className="font-semibold">Personal</TableHead>
              <TableHead className="font-semibold">Check-ins</TableHead>
              <TableHead className="font-semibold">Estado</TableHead>
              <TableHead className="font-semibold">Fecha Creación</TableHead>
              <TableHead className="text-right font-semibold">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {branches.map((branch) => (
              <TableRow key={branch.id} className="hover:bg-gray-50/50 transition-colors">
                <TableCell className="font-medium text-gray-900">
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${branch.is_active ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                    <span>{branch.name}</span>
                  </div>
                </TableCell>
                
                <TableCell className="text-gray-600 max-w-xs">
                  <div className="flex items-center space-x-1">
                    <MapPinIcon className="w-4 h-4 text-gray-400" />
                    <span className="truncate">
                      {branch.address || "Sin dirección"}
                    </span>
                  </div>
                </TableCell>
                
                <TableCell>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                    {branch.user_profiles?.[0]?.count || 0} empleados
                  </span>
                </TableCell>
                
                <TableCell>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700">
                    {branch.check_ins?.[0]?.count || 0} visitas
                  </span>
                </TableCell>
                
                <TableCell>
                  <Badge 
                    variant={branch.is_active ? "default" : "destructive"}
                    className="font-medium"
                  >
                    {branch.is_active ? "Activa" : "Inactiva"}
                  </Badge>
                </TableCell>
                
                <TableCell className="text-gray-600 text-sm">
                  {new Date(branch.created_at!).toLocaleDateString('es-ES')}
                </TableCell>
                
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600"
                      title="Ver detalles"
                    >
                      <EyeIcon className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 hover:bg-green-50 hover:text-green-600"
                      title="Editar sucursal"
                      onClick={() => handleEdit(branch)}
                    >
                      <PencilIcon className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`h-8 w-8 p-0 ${
                        branch.is_active 
                          ? 'hover:bg-orange-50 hover:text-orange-600' 
                          : 'hover:bg-green-50 hover:text-green-600'
                      }`}
                      title={branch.is_active ? "Desactivar" : "Activar"}
                      onClick={() => handleToggleStatus(branch)}
                    >
                      <PowerIcon className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                      title="Eliminar sucursal"
                      onClick={() => handleDelete(branch)}
                    >
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Formulario de edición */}
      <BranchForm
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) onBranchUpdated?.(); // Recargar cuando se cierre
        }}
        branch={selectedBranch || undefined}
        mode={formMode}
      />

      {/* Diálogo de confirmación de eliminación */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción marcará la sucursal &quot;{selectedBranch?.name}&quot; como inactiva.
              {selectedBranch && (selectedBranch.user_profiles?.[0]?.count || 0) > 0 && (
                <span className="block mt-2 text-orange-600 font-medium">
                  ⚠️ Esta sucursal tiene {selectedBranch.user_profiles[0].count} empleado(s) asignado(s).
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Sí, desactivar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
