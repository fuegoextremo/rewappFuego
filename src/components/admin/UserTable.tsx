
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
import { Pencil, Trash2, Mail, User as UserIcon, Chrome } from "lucide-react";
import Link from "next/link";

interface UserTableProps {
  users: UserWithDetails[];
}

const ProviderIcon = ({ provider }: { provider: string | undefined }) => {
  switch (provider) {
    case "email":
      return <Mail className="h-5 w-5" title="Email" />;
    case "google":
      return <Chrome className="h-5 w-5 text-red-500" title="Google" />;
    // Add other providers like facebook if needed
    default:
      return <UserIcon className="h-5 w-5 text-gray-400" title="Desconocido" />;
  }
};

export default function UserTable({ users }: UserTableProps) {
  return (
    <div className="rounded-lg border shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Usuario</TableHead>
            <TableHead>Contacto</TableHead>
            <TableHead>Estadísticas</TableHead>
            <TableHead>Código Único</TableHead>
            <TableHead>Registro</TableHead>
            <TableHead className="text-center">Login</TableHead>
            <TableHead>
              <span className="sr-only">Acciones</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell className="font-medium">
                <div className="font-bold">{user.first_name} {user.last_name}</div>
                <Badge variant="outline">{user.role}</Badge>
              </TableCell>
              <TableCell>
                <div>{user.email}</div>
                <div className="text-sm text-gray-500">{user.phone}</div>
              </TableCell>
              <TableCell>
                <div>Visitas: {user.check_ins[0]?.count ?? 0}</div>
                <div>Cupones: {user.coupons[0]?.count ?? 0}</div>
              </TableCell>
              <TableCell>
                <Badge variant="secondary">{user.unique_code}</Badge>
              </TableCell>
              <TableCell>
                {format(new Date(user.created_at!), "dd/MM/yyyy")}
              </TableCell>
              <TableCell className="flex justify-center">
                <ProviderIcon provider={user.provider} />
              </TableCell>
              <TableCell className="space-x-2 text-right">
                <Link href={`/admin/users/${user.id}`}>
                  <Button variant="outline" size="icon" asChild>
                    <Pencil className="h-4 w-4" />
                  </Button>
                </Link>
                <Button variant="destructive" size="icon">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
