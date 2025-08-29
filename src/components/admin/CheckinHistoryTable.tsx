
"use client";

import { Tables } from "@/types/database";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CheckCircle, Calendar, MapPin, User } from "lucide-react";

// Define the type for a check-in with joined data
export type CheckInWithDetails = Tables<"check_ins"> & {
  branches: Pick<Tables<"branches">, "name"> | null;
  user_profiles: Pick<Tables<"user_profiles">, "first_name" | "last_name"> | null;
};

interface CheckinHistoryTableProps {
  checkins: CheckInWithDetails[];
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

export default function CheckinHistoryTable({ checkins }: CheckinHistoryTableProps) {
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
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Fecha y Hora</TableHead>
            <TableHead>Sucursal</TableHead>
            <TableHead>Verificado por</TableHead>
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
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
