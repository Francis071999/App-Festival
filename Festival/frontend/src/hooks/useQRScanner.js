import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

export const useQRScanner = (onScanSuccess) => {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState(null);
  const scannerRef = useRef(null);

  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  const startScanner = async (elementId) => {
    try {
      setError(null);
      const scanner = new Html5Qrcode(elementId);
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 240, height: 240 } },
        (decodedText) => {
          stopScanner();
          onScanSuccess(decodedText);
        },
        (errorMessage) => {
          // Errores de escaneo por frame ignorados intencionalmente
        }
      );
      setIsScanning(true);
    } catch (err) {
      console.error(err);
      setError("No se pudo acceder a la cámara. Verifique permisos o HTTPS.");
      setIsScanning(false);
    }
  };

  const stopScanner = () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      scannerRef.current.stop().then(() => {
        scannerRef.current.clear();
        setIsScanning(false);
      }).catch((err) => console.error("Error al detener cámara:", err));
    } else {
      setIsScanning(false);
    }
  };

  return { isScanning, startScanner, stopScanner, error };
};