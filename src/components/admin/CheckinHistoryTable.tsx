
"use client";

import { useState } from "react";
import { Tables } from "@/types/database";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
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
import { CheckCircle, Calendar, MapPin, User, Trash2, Loader2 } from "lucide-react";
import { deleteCheckin } from "@/app/admin/users/[id]/actions";
import { useToast } from "@/hooks/use-toast";

// Define the type for a check-in with joined data
export type CheckInWithDetails = Tables<"check_ins"> & {
  branches: Pick<Tables<"branches">, "name"> | null;
  user_profiles: Pick<Tables<"user_profiles">, "first_name" | "last_name"> | null;
};

interface CheckinHistoryTableProps {
  checkins: CheckInWithDetails[];
  userId: string;
  onCheckinDeleted?: () => void;
}

function formatDateTime(timestamp: string) {
  return new Date(timestamp).toLocaleString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export default function CheckinHistoryTable({ checkins, userId, onCheckinDeleted }: CheckinHistoryTableProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [checkinToDelete, setCheckinToDelete] = useState<CheckInWithDetails | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const handleDeleteClick = (checkin: CheckInWithDetails) => {
    setCheckinToDelete(checkin);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!checkinToDelete) return;

    setIsDeleting(true);
    try {
      const result = await deleteCheckin(checkinToDelete.id, userId);
      
      if (result.success) {
        toast({ title: "Check-in eliminado correctamente" });
        onCheckinDeleted?.();
        setDeleteDialogOpen(false);
      } else {
        toast({ title: "Error", description: result.error || "Error al eliminar el check-in", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Error inesperado al eliminar", variant: "destructive" });
    } finally {
      setIsDeleting(false);
      setCheckinToDelete(null);
    }
  };

  if (checkins.length === 0) {
    return (
      <div className="border rounded-lg">
        <div className="text-center py-12">
          <div className="mx-auto w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
            <CheckCircle className="w-6 h-6 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">No hay visitas registradas</h3>
          <p className="text-gray-500">Las visitas del usuario aparecerán aquí cuando se registren.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha y Hora</TableHead>
              <TableHead>Sucursal</TableHead>
              <TableHead>Verificado por</TableHead>
              <TableHead className="w-16 text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {checkins.map((checkin) => (
              <TableRow key={checkin.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-blue-600" />
                    <span className="text-sm text-gray-900">
                      {formatDateTime(checkin.created_at!)}
                    </span>
                  </div>
                </TableCell>
                
                <TableCell>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-gray-900">
                      {checkin.branches?.name ?? "Sucursal no especificada"}
                    </span>
                  </div>
                </TableCell>
                
                <TableCell>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-purple-600" />
                    <span className="text-sm text-gray-900">
                      {checkin.user_profiles?.first_name} {checkin.user_profiles?.last_name ?? "N/A"}
                    </span>
                  </div>
                </TableCell>

                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                    onClick={() => handleDeleteClick(checkin)}
                    title="Eliminar check-in"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar Check-in</AlertDialogTitle>
            <AlertDialogDescription>
              Esta accion eliminara el check-in del{" "}
              <strong>{checkinToDelete ? formatDateTime(checkinToDelete.created_at!) : ""}</strong>
              {" "}en{" "}
              <strong>{checkinToDelete?.branches?.name || "sucursal desconocida"}</strong>.
              <br /><br />
              El contador de racha se decrementara en 1. Esta accion no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Eliminando...
                </>
              ) : (
                "Eliminar"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
