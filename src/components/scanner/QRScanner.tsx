"use client";

import { useEffect, useRef } from 'react';
import { Html5Qrcode, Html5QrcodeScannerState } from 'html5-qrcode';

interface QRScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onScanFailure?: (error: string) => void;
  isPaused: boolean;
}

const QRScanner = ({ onScanSuccess, onScanFailure, isPaused }: QRScannerProps) => {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerId = "qr-scanner-container";

  useEffect(() => {
    // Inicializa la instancia del escáner una sola vez.
    if (!scannerRef.current) {
      // El modo 'verbose: false' reduce el logging en la consola.
      scannerRef.current = new Html5Qrcode(scannerContainerId, { verbose: false });
    }
    const scanner = scannerRef.current;

    // Callback de éxito que detiene el escáner antes de notificar al componente padre.
    const successCallback = (decodedText: string) => {
      if (scanner.getState() === Html5QrcodeScannerState.SCANNING) {
        scanner.stop().then(() => {
          onScanSuccess(decodedText);
        }).catch(err => {
          console.error("QRScanner: Falló al detener el escáner después del éxito.", err);
          // Aún así, notifica el éxito para que la app continúe.
          onScanSuccess(decodedText);
        });
      }
    };

    // El callback de error puede ser muy ruidoso, por lo que lo ignoramos.
    const errorCallback = () => {
      // No hacer nada para evitar el spam en la consola.
    };

    const startScanner = () => {
      // No iniciar si ya está escaneando.
      if (scanner.getState() === Html5QrcodeScannerState.SCANNING) {
        return;
      }
      
      scanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        successCallback,
        errorCallback
      ).catch(err => {
        if (onScanFailure) {
          onScanFailure(`No se pudo iniciar el escáner: ${err}`);
        }
      });
    };

    if (isPaused) {
      // Si está en pausa, asegúrate de que el escáner esté detenido.
      if (scanner.getState() === Html5QrcodeScannerState.SCANNING) {
        scanner.stop().catch(err => console.error("QRScanner: Falló al detener en pausa.", err));
      }
    } else {
      startScanner();
    }

    // Función de limpieza para detener el escáner cuando el componente se desmonte.
    return () => {
      if (scannerRef.current && scannerRef.current.getState() === Html5QrcodeScannerState.SCANNING) {
        scannerRef.current.stop().catch(err => {
          console.error("QRScanner: Falló al detener el escáner en la limpieza.", err);
        });
      }
    };
  }, [isPaused, onScanSuccess, onScanFailure]);

  return <div id={scannerContainerId} className="w-full max-w-md mx-auto rounded-lg overflow-hidden" />;
};

export default QRScanner;
