
"use client";

import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { UserWithDetails } from "@/app/admin/users/page";
import { 
  Pencil, 
  Trash2, 
  Mail, 
  User as UserIcon, 
  Chrome, 
  Users,
  CheckCircle,
  Gift
} from "lucide-react";
import Link from "next/link";

interface UserTableProps {
  users: UserWithDetails[];
}

const ProviderIcon = ({ provider }: { provider: string | undefined }) => {
  switch (provider) {
    case "email":
      return <Mail className="h-4 w-4 text-blue-600" />;
    case "google":
      return <Chrome className="h-4 w-4 text-red-500" />;
    default:
      return <UserIcon className="h-4 w-4 text-gray-400" />;
  }
};

const RoleBadge = ({ role }: { role: string | null }) => {
  switch (role) {
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

export default function UserTable({ users }: UserTableProps) {
  if (users.length === 0) {
    return (
      <div className="border rounded-lg">
        <div className="text-center py-12">
          <div className="mx-auto w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
            <Users className="w-6 h-6 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">No hay usuarios</h3>
          <p className="text-gray-500">Los usuarios aparecerán aquí cuando se registren.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Usuario</TableHead>
            <TableHead>Contacto</TableHead>
            <TableHead>Rol</TableHead>
            <TableHead>Estadísticas</TableHead>
            <TableHead>Código Único</TableHead>
            <TableHead>Registro</TableHead>
            <TableHead className="text-center">Proveedor</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell className="font-medium">
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${user.is_active ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                  <div>
                    <div className="font-medium text-gray-900">
                      {user.first_name && user.last_name 
                        ? `${user.first_name} ${user.last_name}`
                        : user.email?.split('@')[0] || 'Usuario'
                      }
                    </div>
                    {user.phone && (
                      <div className="text-xs text-gray-500">{user.phone}</div>
                    )}
                  </div>
                </div>
              </TableCell>
              
              <TableCell>
                <div className="text-sm text-gray-900">{user.email}</div>
                {user.birth_date && (
                  <div className="text-xs text-gray-500">
                    Nació: {format(new Date(user.birth_date), "dd/MM/yyyy")}
                  </div>
                )}
              </TableCell>

              <TableCell>
                <RoleBadge role={user.role} />
              </TableCell>
              
              <TableCell>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-gray-600">{user.check_ins[0]?.count ?? 0}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Gift className="h-4 w-4 text-blue-600" />
                    <span className="text-gray-600">{user.coupons[0]?.count ?? 0}</span>
                  </div>
                </div>
              </TableCell>
              
              <TableCell>
                <span className="font-mono text-sm text-gray-600">
                  #{user.unique_code}
                </span>
              </TableCell>
              
              <TableCell>
                <span className="text-sm text-gray-600">
                  {format(new Date(user.created_at!), "dd/MM/yyyy")}
                </span>
              </TableCell>
              
              <TableCell className="text-center">
                <div className="flex justify-center">
                  <ProviderIcon provider={user.provider} />
                </div>
              </TableCell>
              
              <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                  <Link href={`/admin/users/${user.id}`}>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600"
                      title="Editar usuario"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                    title="Eliminar usuario"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
