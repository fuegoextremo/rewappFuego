
"use client";

import { Tables } from "@/types/database";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Define the type for a check-in with joined data
export type CheckInWithDetails = Tables<"check_ins"> & {
  branches: Pick<Tables<"branches">, "name"> | null;
  user_profiles: Pick<Tables<"user_profiles">, "first_name" | "last_name"> | null;
};

interface CheckinHistoryTableProps {
  checkins: CheckInWithDetails[];
}

export default function CheckinHistoryTable({ checkins }: CheckinHistoryTableProps) {
  if (checkins.length === 0) {
    return <p>Este usuario aún no tiene visitas registradas.</p>;
  }

  return (
    <div className="rounded-lg border shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Fecha</TableHead>
            <TableHead>Sucursal</TableHead>
            <TableHead>Verificado por</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {checkins.map((checkin) => (
            <TableRow key={checkin.id}>
              <TableCell>
                {format(new Date(checkin.created_at!), "dd/MM/yyyy HH:mm")}
              </TableCell>
              <TableCell>{checkin.branches?.name ?? "N/A"}</TableCell>
              <TableCell>
                {checkin.user_profiles?.first_name} {checkin.user_profiles?.last_name ?? "N/A"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
