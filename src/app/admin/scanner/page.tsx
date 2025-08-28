"use client";

import { useState, useTransition, useCallback, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SimpleQRScanner from '@/components/scanner/SimpleQRScanner';
import RecentScanActivity from '@/components/scanner/RecentScanActivity';
import Breadcrumbs from '@/components/shared/Breadcrumbs';
import { processCheckin, redeemCoupon } from './actions';
import { getRecentScanActivity, ScanActivity } from './queries';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type ScanMode = "checkin" | "redeem";

function ScannerCard({
  mode,
  isScanning,
  isPending,
  result,
  handleScanSuccess,
  resetScanner
}: {
  mode: ScanMode;
  isScanning: boolean;
  isPending: boolean;
  result: { success: boolean; message: string } | null;
  handleScanSuccess: (decodedText: string) => void;
  resetScanner: () => void;
}) {
  return (
    <Card className="w-full">
      <CardHeader className="text-center pb-4">
        <CardTitle className="text-lg">
          {mode === 'checkin' ? 'Escanear QR de Check-in' : 'Escanear QR de Premio'}
        </CardTitle>
        <p className="text-sm text-gray-600">
          {mode === 'checkin' 
            ? 'Apunta la cámara al código QR del cliente para registrar su visita'
            : 'Apunta la cámara al código QR del premio para validar la redención'
          }
        </p>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center space-y-4 min-h-[400px]">
        {isScanning && !isPending && (
          <div className="w-full max-w-md">
            <SimpleQRScanner
              onScanSuccess={handleScanSuccess}
              onScanFailure={(error: string) => console.error(error)}
              isPaused={!isScanning || isPending}
            />
          </div>
        )}

        {isPending && (
          <div className="flex flex-col items-center justify-center space-y-4">
            <span className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-gray-600" />
            <p className="text-lg font-medium">Procesando...</p>
            <p className="text-sm text-gray-500">Validando información del código QR</p>
          </div>
        )}

        {result && !isPending && (
          <div className={`p-6 rounded-lg text-center max-w-md w-full ${
            result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
          }`}>
            <h3 className={`font-bold text-lg mb-2 ${
              result.success ? 'text-green-800' : 'text-red-800'
            }`}>
              {result.success ? 'Operación Exitosa' : 'Operación Fallida'}
            </h3>
            <p className={`mb-4 ${result.success ? 'text-green-700' : 'text-red-700'}`}>
              {result.message}
            </p>
            <button
              onClick={resetScanner}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
            >
              Escanear de nuevo
            </button>
          </div>
        )}

        {!isScanning && !isPending && !result && (
          <div className="text-center space-y-4">
            <div className="w-24 h-24 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">📱</span>
            </div>
            <div>
              <p className="text-gray-600 mb-2">Scanner listo</p>
              <button
                onClick={resetScanner}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Iniciar escaneo
              </button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function ScannerPage() {
  const [mode, setMode] = useState<ScanMode>("checkin");
  const [isScanning, setIsScanning] = useState(true);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const [recentActivities, setRecentActivities] = useState<ScanActivity[]>([]);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  // Cargar actividad reciente al montar el componente
  useEffect(() => {
    loadRecentActivities();
  }, []);

  const loadRecentActivities = async () => {
    try {
      const activities = await getRecentScanActivity(5);
      setRecentActivities(activities);
    } catch (error) {
      console.error('Error loading recent activities:', error);
    }
  };

  const handleScanSuccess = useCallback((decodedText: string) => {
    // Prevenir múltiples transiciones si el escáner emite varios eventos de éxito
    if (isPending) return;

    setIsScanning(false);
    setResult(null);

    startTransition(async () => {
      try {
        const response = mode === "checkin"
          ? await processCheckin(decodedText)
          : await redeemCoupon(decodedText);
        
        setResult(response);
        toast({
          title: response.success ? "Éxito" : "Error",
          description: response.message,
          variant: response.success ? "default" : "destructive",
        });

        // Recargar actividades recientes después de un escaneo exitoso
        if (response.success) {
          await loadRecentActivities();
        }

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Ocurrió un error desconocido.";
        setResult({ success: false, message: errorMessage });
        toast({
          title: "Error Inesperado",
          description: errorMessage,
          variant: "destructive",
        });
      }
    });
  }, [mode, toast, isPending]);

  const resetScanner = useCallback(() => {
    setIsScanning(true);
    setResult(null);
  }, []);

  const scannerProps = {
    mode,
    isScanning,
    isPending,
    result,
    handleScanSuccess,
    resetScanner,
  };

  const breadcrumbItems = [
    { label: 'Scanner', current: true }
  ]

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Breadcrumbs */}
      <Breadcrumbs items={breadcrumbItems} />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Centro de Escaneo</h1>
          <p className="text-gray-600">Procesa check-ins de clientes y redención de premios</p>
        </div>
      </div>

      {/* Scanner Tabs */}
      <Tabs value={mode} onValueChange={(value) => setMode(value as ScanMode)} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="checkin">Check-in de Cliente</TabsTrigger>
          <TabsTrigger value="redeem">Canjear Premio</TabsTrigger>
        </TabsList>
        <TabsContent value="checkin" className="mt-6">
          <ScannerCard {...scannerProps} />
        </TabsContent>
        <TabsContent value="redeem" className="mt-6">
          <ScannerCard {...scannerProps} />
        </TabsContent>
      </Tabs>

      {/* Actividad reciente */}
      <RecentScanActivity activities={recentActivities} />
    </div>
  );
}
