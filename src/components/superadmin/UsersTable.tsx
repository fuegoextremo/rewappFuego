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
  UsersIcon, 
  EyeIcon,
  PowerIcon,
  KeyIcon,
  GiftIcon
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
import { 
  deleteUser, 
  toggleUserStatus,
  type UserWithProfile 
} from "@/app/superadmin/users/actions";
import UserForm from "./UserForm";
// Reutilizamos los modales adaptados para superadmin
import SuperAdminGrantSpinsModal from "./SuperAdminGrantSpinsModal";
import ResetPasswordModal from "./ResetPasswordModal";
import UserDetailsModal from "./UserDetailsModal";

interface Branch {
  id: string;
  name: string;
  is_active: boolean | null;
}

interface UsersTableProps {
  users: UserWithProfile[];
  branches: Branch[];
  onUserUpdated?: () => void;
}

export default function UsersTable({ users, branches, onUserUpdated }: UsersTableProps) {
  const [selectedUser, setSelectedUser] = useState<UserWithProfile | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [resetPasswordOpen, setResetPasswordOpen] = useState(false);
  const [grantSpinsOpen, setGrantSpinsOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const { toast } = useToast();

  const handleViewDetails = (user: UserWithProfile) => {
    setSelectedUser(user);
    setDetailsOpen(true);
  };

  const handleEdit = (user: UserWithProfile) => {
    setSelectedUser(user);
    setFormMode("edit");
    setFormOpen(true);
  };

  const handleDelete = (user: UserWithProfile) => {
    setSelectedUser(user);
    setDeleteDialogOpen(true);
  };

  const handleResetPassword = (user: UserWithProfile) => {
    setSelectedUser(user);
    setResetPasswordOpen(true);
  };

  const handleGrantSpins = (user: UserWithProfile) => {
    setSelectedUser(user);
    setGrantSpinsOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedUser) return;
    
    try {
      const result = await deleteUser(selectedUser.id);
      if (result.success) {
        toast({
          title: "¡Éxito!",
          description: result.message,
        });
      } else {
        throw new Error(result.error);
      }
      setDeleteDialogOpen(false);
      setSelectedUser(null);
      onUserUpdated?.();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo eliminar el usuario",
        variant: "destructive",
      });
    }
  };

  const handleToggleStatus = async (user: UserWithProfile) => {
    try {
      const result = await toggleUserStatus(user.id, user.is_active || false);
      if (result.success) {
        toast({
          title: "¡Éxito!",
          description: result.message,
        });
      } else {
        throw new Error(result.error);
      }
      onUserUpdated?.();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo cambiar el estado",
        variant: "destructive",
      });
    }
  };

  const getRoleBadge = (role: string | null) => {
    switch (role) {
      case 'superadmin':
        return <Badge variant="destructive" className="text-xs">SuperAdmin</Badge>;
      case 'admin':
        return <Badge variant="default" className="text-xs bg-purple-600">Admin</Badge>;
      case 'verifier':
        return <Badge variant="secondary" className="text-xs bg-blue-600 text-white">Verificador</Badge>;
      case 'client':
        return <Badge variant="outline" className="text-xs">Cliente</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">Sin rol</Badge>;
    }
  };

  if (users.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <div className="mx-auto w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
          <UsersIcon className="w-6 h-6 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-1">No hay usuarios</h3>
        <p className="text-sm text-gray-500">Comienza creando el primer usuario.</p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50/50">
              <TableHead className="font-semibold">Usuario</TableHead>
              <TableHead className="font-semibold">Email</TableHead>
              <TableHead className="font-semibold">Rol</TableHead>
              <TableHead className="font-semibold">Sucursal</TableHead>
              <TableHead className="font-semibold">Check-ins</TableHead>
              <TableHead className="font-semibold">Giros</TableHead>
              <TableHead className="font-semibold">Estado</TableHead>
              <TableHead className="text-right font-semibold">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id} className="hover:bg-gray-50/50 transition-colors">
                <TableCell className="font-medium text-gray-900">
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${user.is_active ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                    <div>
                      <div className="font-medium">
                        {user.first_name && user.last_name 
                          ? `${user.first_name} ${user.last_name}`
                          : user.email.split('@')[0]
                        }
                      </div>
                      {user.phone && (
                        <div className="text-xs text-gray-500">{user.phone}</div>
                      )}
                    </div>
                  </div>
                </TableCell>
                
                <TableCell className="text-gray-600 text-sm">
                  {user.email}
                </TableCell>

                <TableCell>
                  {getRoleBadge(user.role)}
                </TableCell>
                
                <TableCell className="text-gray-600 text-sm">
                  {user.branch_name || "Sin asignar"}
                </TableCell>

                <TableCell>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                    {user.total_checkins || 0} visitas
                  </span>
                </TableCell>

                <TableCell>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700">
                    {user.available_spins || 0} disponibles
                  </span>
                </TableCell>
                
                <TableCell>
                  <Badge 
                    variant={user.is_active ? "default" : "destructive"}
                    className="font-medium"
                  >
                    {user.is_active ? "Activo" : "Inactivo"}
                  </Badge>
                </TableCell>
                
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600"
                      title="Ver detalles"
                      onClick={() => handleViewDetails(user)}
                    >
                      <EyeIcon className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 hover:bg-green-50 hover:text-green-600"
                      title="Editar usuario"
                      onClick={() => handleEdit(user)}
                    >
                      <PencilIcon className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 hover:bg-yellow-50 hover:text-yellow-600"
                      title="Resetear contraseña"
                      onClick={() => handleResetPassword(user)}
                    >
                      <KeyIcon className="h-4 w-4" />
                    </Button>
                    {user.role === 'client' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 hover:bg-purple-50 hover:text-purple-600"
                        title="Otorgar giros"
                        onClick={() => handleGrantSpins(user)}
                      >
                        <GiftIcon className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`h-8 w-8 p-0 ${
                        user.is_active 
                          ? 'hover:bg-orange-50 hover:text-orange-600' 
                          : 'hover:bg-green-50 hover:text-green-600'
                      }`}
                      title={user.is_active ? "Desactivar" : "Activar"}
                      onClick={() => handleToggleStatus(user)}
                    >
                      <PowerIcon className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                      title="Eliminar usuario"
                      onClick={() => handleDelete(user)}
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
      <UserForm
        open={formOpen}
        onOpenChange={(open: boolean) => {
          setFormOpen(open);
          if (!open) onUserUpdated?.();
        }}
        user={selectedUser || undefined}
        mode={formMode}
        branches={branches}
      />

      {/* Modal de reseteo de contraseña */}
      <ResetPasswordModal
        open={resetPasswordOpen}
        onOpenChange={setResetPasswordOpen}
        user={selectedUser}
        onSuccess={() => {
          toast({
            title: "¡Éxito!",
            description: "Contraseña reseteada exitosamente",
          });
        }}
      />

      {/* Modal de otorgar giros */}
      <SuperAdminGrantSpinsModal
        open={grantSpinsOpen}
        onOpenChange={setGrantSpinsOpen}
        user={selectedUser}
        onSuccess={(spins: number) => {
          toast({
            title: "¡Éxito!",
            description: `${spins} giros otorgados exitosamente`,
          });
          onUserUpdated?.();
        }}
      />

      {/* Modal de detalles de usuario */}
      <UserDetailsModal
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        user={selectedUser}
      />

      {/* Diálogo de confirmación de eliminación */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción desactivará al usuario &quot;{selectedUser?.email}&quot;.
              El usuario no podrá acceder al sistema pero sus datos se conservarán.
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
