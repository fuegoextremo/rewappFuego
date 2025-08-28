
"use client";

import { useTransition } from "react";
import { Tables } from "@/types/database";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { deleteCoupon } from "@/app/admin/users/[id]/actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

// Define the type for a coupon with joined prize data
export type CouponWithDetails = Tables<"coupons"> & {
  prizes: Pick<Tables<"prizes">, "name" | "description"> | null;
};

interface CouponHistoryTableProps {
  coupons: CouponWithDetails[];
  userId: string;
}

const getCouponStatus = (coupon: CouponWithDetails): { text: string; variant: "default" | "secondary" | "destructive" } => {
  if (coupon.is_redeemed) {
    return { text: "Canjeado", variant: "default" };
  }
  if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
    return { text: "Caducado", variant: "destructive" };
  }
  return { text: "Activo", variant: "secondary" };
};

export default function CouponHistoryTable({ coupons, userId }: CouponHistoryTableProps) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleDelete = (couponId: string) => {
    startTransition(async () => {
      const result = await deleteCoupon(couponId, userId);
      if (result.error) {
        toast({ title: "Error", description: result.error, variant: "destructive" });
      } else {
        toast({ title: "Éxito", description: result.message });
      }
    });
  };

  if (coupons.length === 0) {
    return <p>Este usuario aún no tiene cupones.</p>;
  }

  return (
    <div className="rounded-lg border shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Premio</TableHead>
            <TableHead>Caducidad</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {coupons.map((coupon) => {
            const status = getCouponStatus(coupon);
            return (
              <TableRow key={coupon.id}>
                <TableCell>
                  <div className="font-medium">{coupon.prizes?.name ?? "N/A"}</div>
                  <div className="text-sm text-gray-500 truncate">{coupon.prizes?.description ?? ""}</div>
                </TableCell>
                <TableCell>
                  {coupon.expires_at ? format(new Date(coupon.expires_at), "dd/MM/yyyy") : "No expira"}
                </TableCell>
                <TableCell>
                  <Badge variant={status.variant}>{status.text}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="icon" disabled={isPending}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta acción no se puede deshacer. Se eliminará permanentemente el cupón de este usuario.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(coupon.id)}>
                          Sí, eliminar cupón
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
