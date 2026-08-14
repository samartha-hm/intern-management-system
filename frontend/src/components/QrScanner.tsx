import React, { useEffect, useRef, useState } from 'react';
import { Spin, message } from 'antd';
import { Html5Qrcode } from 'html5-qrcode';

interface QrScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onScanError?: (error: string) => void;
  autoStart?: boolean;
}

const QrScanner: React.FC<QrScannerProps> = ({
  onScanSuccess,
  onScanError,
  autoStart = true
}) => {
  const scannerRef = useRef<HTMLDivElement | null>(null);
  const html5QrcodeRef = useRef<Html5Qrcode | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  // Initialize scanner and start if autoStart
  useEffect(() => {
    const scannerElement = scannerRef.current;
    if (!scannerElement) return;

    const initScanner = async () => {
      try {
        const devices = await Html5Qrcode.getCameras();
        if (devices.length === 0) {
          throw new Error('No cameras found');
        }
        // Prefer rear/environment camera
        const rearCamera = devices.find((device: any) =>
          device.label.toLowerCase().includes('back') ||
          device.label.toLowerCase().includes('rear') ||
          device.facingMode === 'environment'
        );
        const selectedDevice = rearCamera ?? devices[0];
        const selectedDeviceId = (selectedDevice as any)?.id || (selectedDevice as any)?.deviceId;
        // Create scanner instance
        html5QrcodeRef.current = new Html5Qrcode(scannerElement.id);
        // Start scanning
        await html5QrcodeRef.current.start(
          { deviceId: { exact: selectedDeviceId } },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            disableFlip: true,
          },
          (decodedText: string) => {
            // Success callback
            setIsScanning(true);
            onScanSuccess(decodedText);
          },
          (error: any) => {
            // Error callback (scanning error, not camera error)
            if (onScanError) {
              onScanError(error);
            } else {
              console.warn('QR scan error', error);
            }
          }
        );
        setIsScanning(true);
      } catch (err: any) {
        console.error('Failed to initialize QR scanner', err);
        message.error(`Unable to start camera: ${err.message}`);
        if (onScanError) {
          onScanError(err.message);
        }
      }
    };

    if (autoStart) {
      initScanner();
    }

    // Cleanup on unmount
    return () => {
      if (html5QrcodeRef.current) {
        html5QrcodeRef.current
          .stop()
          .then(() => {
            html5QrcodeRef.current = null;
            setIsScanning(false);
          })
          .catch((err: any) => {
            console.error('Error stopping scanner', err);
          });
      }
    };
  }, [onScanSuccess, onScanError, autoStart]);

  if (!scannerRef.current) {
    return <div>Loading scanner...</div>;
  }

  return (
    <div
      ref={scannerRef}
      id="qr-scanner-container"
      style={{
        width: '100%',
        height: '100%',
        background: '#fafafa',
        borderRadius: 8,
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {isScanning && (
        <div
          style={{
            position: 'absolute',
            top: 12,
            left: 12,
            background: 'rgba(0,0,0,0.6)',
            color: '#fff',
            padding: '4px 8px',
            borderRadius: 4,
            fontSize: 12,
            pointerEvents: 'none',
          }}
        >
          Scanning...
        </div>
      )}
      {/* Optional: show a spinner if initializing but not yet scanning */}
      {!isScanning && autoStart && (
        <Spin style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: 20 }} />
      )}
    </div>
  );
};

export default QrScanner;