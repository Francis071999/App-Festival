// src/hooks/useQRScanner.js
import { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

export const useQRScanner = (elementId, onScanSuccess) => {
  const [isScanning, setIsScanning] = useState(false);
  const [cameras, setCameras] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState('');
  const [error, setError] = useState(null);
  
  const scannerRef = useRef(null);
  const lastScannedCodeRef = useRef('');
  const scanLockRef = useRef(false);

  useEffect(() => {
    Html5Qrcode.getCameras()
      .then((devices) => {
        if (devices && devices.length > 0) {
          setCameras(devices);
          // Priorizar cámara trasera ("back", "environment", "posterior")
          const backCam = devices.find(d => d.label.toLowerCase().includes('back') || d.label.toLowerCase().includes('trasera') || d.label.toLowerCase().includes('environment'));
          setSelectedCameraId(backCam ? backCam.id : devices[0].id);
        }
      })
      .catch((err) => {
        setError("No se pudo acceder a los dispositivos de cámara o permisos denegados.");
      });

    return () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  const startScanner = async () => {
    if (!selectedCameraId) {
      setError("No hay una cámara seleccionada o disponible.");
      return;
    }
    setError(null);

    try {
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode(elementId);
      }

      await scannerRef.current.start(
        selectedCameraId,
        {
          fps: 10,
          qrbox: { width: 220, height: 220 }
        },
        (decodedText) => {
          // Bloqueo temporal para evitar disparar múltiples llamadas seguidas para el mismo código
          if (scanLockRef.current || decodedText === lastScannedCodeRef.current) {
            return;
          }
          scanLockRef.current = true;
          lastScannedCodeRef.current = decodedText;

          onScanSuccess(decodedText);

          // Liberar el código tras 2.5 segundos para permitir un nuevo escaneo
          setTimeout(() => {
            lastScannedCodeRef.current = '';
            scanLockRef.current = false;
          }, 2500);
        },
        () => {} // Ignorar errores menores de cuadro sin QR
      );
      setIsScanning(true);
    } catch (err) {
      setError("Error al iniciar la cámara. Verifique los permisos HTTPS/local.");
      setIsScanning(false);
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current && isScanning) {
      try {
        await scannerRef.current.stop();
        setIsScanning(false);
      } catch (err) {
        console.error("Error al detener el escáner:", err);
      }
    }
  };

  const switchCamera = async (cameraId) => {
    setSelectedCameraId(cameraId);
    if (isScanning) {
      await stopScanner();
      setTimeout(startScanner, 300);
    }
  };

  return {
    isScanning,
    cameras,
    selectedCameraId,
    error,
    startScanner,
    stopScanner,
    switchCamera
  };
};