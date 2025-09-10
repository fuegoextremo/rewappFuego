"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
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
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { getStockRecoveryPreview, recoverExpiredStock, StockRecoveryPreview } from "../../app/admin/prizes/actions";
import { RotateCcw, Package, AlertTriangle, CheckCircle } from "lucide-react";

export default function StockRecoveryManager() {
  const [preview, setPreview] = useState<StockRecoveryPreview[]>([]);
  const [loading, setLoading] = useState(false);
  const [recovering, setRecovering] = useState(false);
  const { toast } = useToast();

  const loadPreview = async () => {
    setLoading(true);
    try {
      const data = await getStockRecoveryPreview();
      setPreview(data);
    } catch (error) {
      console.error('Error loading preview:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo cargar la vista previa de recuperación"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRecover = async () => {
    setRecovering(true);
    try {
      const result = await recoverExpiredStock();
      
      if (result.success) {
        toast({
          title: "✅ Stock Recuperado",
          description: result.message
        });
        // Recargar preview después de recuperar
        await loadPreview();
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.message
        });
      }
    } catch (error) {
      console.error('Error recovering stock:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error interno al recuperar stock"
      });
    } finally {
      setRecovering(false);
    }
  };

  const totalRecoverable = preview.reduce((sum, item) => sum + item.expired_coupons, 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Package className="h-5 w-5 text-blue-600" />
            <div>
              <CardTitle className="text-lg">Recuperación de Stock</CardTitle>
              <CardDescription>
                Recupera inventario de cupones expirados no redimidos
              </CardDescription>
            </div>
          </div>
          <Button 
            onClick={loadPreview} 
            disabled={loading}
            variant="outline"
            size="sm"
          >
            {loading ? "Cargando..." : "Ver Recuperables"}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {preview.length === 0 && !loading && (
          <div className="text-center py-8 text-gray-500">
            <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-gray-400" />
            <p>Click &quot;Ver Recuperables&quot; para analizar cupones expirados</p>
          </div>
        )}

        {preview.length === 0 && loading && (
          <div className="text-center py-8 text-gray-500">
            <div className="animate-spin h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-2"></div>
            <p>Analizando cupones expirados...</p>
          </div>
        )}

        {preview.length > 0 && (
          <>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-blue-900">
                    📦 {totalRecoverable} unidades de stock recuperables
                  </h4>
                  <p className="text-sm text-blue-700">
                    De cupones expirados no redimidos en {preview.length} premio(s)
                  </p>
                </div>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      className="bg-blue-600 hover:bg-blue-700"
                      disabled={recovering || totalRecoverable === 0}
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      {recovering ? "Recuperando..." : "Recuperar Todo"}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle className="flex items-center space-x-2">
                        <RotateCcw className="h-5 w-5 text-blue-600" />
                        <span>Confirmar Recuperación de Stock</span>
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta acción va a:
                        <br />
                        <br />
                        <strong>✅ Recuperar {totalRecoverable} unidades de stock</strong>
                        <br />
                        <strong>🗑️ Eliminar {totalRecoverable} cupones expirados</strong>
                        <br />
                        <br />
                        Los cupones expirados se eliminarán permanentemente ya que no tienen valor.
                        ¿Continuar?
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={handleRecover}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        Sí, Recuperar Stock
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>

            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Premio</TableHead>
                    <TableHead className="text-center">Stock Actual</TableHead>
                    <TableHead className="text-center">Cupones Expirados</TableHead>
                    <TableHead className="text-center">Stock Final</TableHead>
                    <TableHead className="text-center">Ganancia</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {preview.map((item) => (
                    <TableRow key={item.prize_id}>
                      <TableCell className="font-medium">
                        {item.prize_name}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="bg-gray-50">
                          {item.current_stock}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                          {item.expired_coupons}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="default" className="bg-green-600">
                          {item.stock_after_recovery}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center space-x-1">
                          <span className="text-green-600 font-medium">
                            +{item.expired_coupons}
                          </span>
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded">
              <strong>ℹ️ Nota:</strong> Esta función recupera stock de cupones que:
              <br />
              • ❌ Están expirados (fecha vencida)
              • ❌ No han sido redimidos por usuarios
              • 🎰 Pertenecen a premios de ruleta (tipo &quot;roulette&quot;)
              <br />
              Los premios por racha (tipo &quot;streak&quot;) tienen stock ilimitado y no necesitan recuperación.
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
