'use client';

import { useEffect, useRef, useState } from 'react';

interface SimpleQRScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onScanFailure?: (error: string) => void;
  isPaused: boolean;
}

// Interface para qr-scanner ya que no tiene tipos oficiales
interface QRScannerInstance {
  start: () => Promise<void>;
  destroy: () => void;
}

// Versión simplificada que usa qr-scanner
const SimpleQRScanner = ({ onScanSuccess, onScanFailure, isPaused }: SimpleQRScannerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scannerRef = useRef<QRScannerInstance | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const initScanner = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Primero verificar y solicitar permisos de cámara
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      
      // Detener el stream temporal (qr-scanner manejará su propio stream)
      stream.getTracks().forEach(track => track.stop());

      // Importar dinámicamente qr-scanner después de confirmar permisos
      const QrScanner = (await import('qr-scanner')).default;
      
      if (!videoRef.current) return;

      const scanner = new QrScanner(
        videoRef.current,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (result: any) => {
          stopScanner();
          onScanSuccess(result.data);
        },
        {
          highlightScanRegion: true,
          highlightCodeOutline: true,
          preferredCamera: 'environment',
        }
      );

      scannerRef.current = scanner;
      await scanner.start();
      setIsLoading(false);
      setError(null);
    } catch (err) {
      console.error('Error initializing scanner:', err);
      let errorMsg = 'Error al inicializar el escáner.';
      
      if (err instanceof Error) {
        // Errores específicos de permisos/dispositivo
        if (err.name === 'NotAllowedError') {
          errorMsg = 'Permisos de cámara denegados. Por favor, permite el acceso a la cámara.';
        } else if (err.name === 'NotFoundError') {
          errorMsg = 'No se encontró una cámara en el dispositivo.';
        } else if (err.name === 'NotSupportedError') {
          errorMsg = 'La cámara no es compatible con este dispositivo.';
        } else if (err.message.includes('fetch')) {
          // Error de carga de módulo qr-scanner
          errorMsg = 'Error al cargar el módulo de escaneo. Verifica tu conexión.';
        } else {
          // Mostrar mensaje del error para debugging
          errorMsg = `Error: ${err.message}`;
        }
      }
      
      setError(errorMsg);
      setIsLoading(false);
      if (onScanFailure) {
        onScanFailure(errorMsg);
      }
    }
  };

  const stopScanner = () => {
    if (scannerRef.current) {
      scannerRef.current.destroy();
      scannerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  useEffect(() => {
    if (!isPaused) {
      // Pequeño delay para asegurar que el componente esté completamente montado
      const timer = setTimeout(() => {
        initScanner();
      }, 100);
      
      return () => {
        clearTimeout(timer);
        stopScanner();
      };
    } else {
      stopScanner();
    }

    return () => {
      stopScanner();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPaused]); // Solo depende de isPaused

  if (error) {
    return (
      <div className="p-4 text-center">
        <p className="text-red-600 mb-2">{error}</p>
        <button 
          onClick={() => {
            setError(null);
            initScanner();
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="relative w-full max-w-md mx-auto">
      {isLoading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-gray-100 rounded-lg">
          <div className="text-center">
            <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600 mb-2"></div>
            <p className="text-sm font-medium">Iniciando cámara...</p>
            <p className="text-xs text-gray-600 mt-1">Permite el acceso si se solicita</p>
          </div>
        </div>
      )}
      <video
        ref={videoRef}
        className="w-full h-64 object-cover rounded-lg bg-black"
        playsInline
        muted
      />
      {!isLoading && !error && (
        <div className="absolute top-2 left-2 right-2 text-center">
          <p className="bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
            Apunta la cámara hacia el código QR
          </p>
        </div>
      )}
    </div>
  );
};

export default SimpleQRScanner;
