
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
import { Trash2, Gift } from "lucide-react";

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
    return (
      <div className="border rounded-lg">
        <div className="text-center py-12">
          <div className="mx-auto w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
            <Gift className="w-6 h-6 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">No hay cupones</h3>
          <p className="text-gray-500">Los cupones ganados por el usuario aparecerán aquí.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Premio</TableHead>
            <TableHead>Fecha de Obtención</TableHead>
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
                  <div className="flex items-center gap-2">
                    <Gift className="h-4 w-4 text-blue-600" />
                    <div>
                      <div className="font-medium text-gray-900">{coupon.prizes?.name ?? "Premio no especificado"}</div>
                      <div className="text-xs text-gray-500 truncate">{coupon.prizes?.description ?? ""}</div>
                    </div>
                  </div>
                </TableCell>
                
                <TableCell>
                  <span className="text-sm text-gray-600">
                    {format(new Date(coupon.created_at!), "dd/MM/yyyy HH:mm")}
                  </span>
                </TableCell>
                
                <TableCell>
                  <span className="text-sm text-gray-600">
                    {coupon.expires_at ? format(new Date(coupon.expires_at), "dd/MM/yyyy") : "No expira"}
                  </span>
                </TableCell>
                
                <TableCell>
                  <Badge variant={status.variant}>{status.text}</Badge>
                </TableCell>
                
                <TableCell className="text-right">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                        disabled={isPending}
                        title="Eliminar cupón"
                      >
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
