import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { QrCode, Camera, CameraOff } from 'lucide-react';
import api from '../../api/axios';
import { PageHeader } from '../../components/common/Common';

const QR_ELEMENT_ID = 'qr-reader';

const QRScanner = () => {
  const navigate = useNavigate();
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [scanning, setScanning] = useState(false);
  const [manualCode, setManualCode] = useState('');

  useEffect(() => {
    return () => {
      scannerRef.current?.stop().catch(() => {});
    };
  }, []);

  const lookupAsset = async (rawValue: string) => {
    try {
      let code = rawValue;
      try {
        const parsed = JSON.parse(rawValue);
        code = parsed.assetId || parsed.id || rawValue;
      } catch {
        // not JSON - treat rawValue as a raw assetId/code
      }
      const { data } = await api.get(`/assets/lookup/${encodeURIComponent(code)}`);
      toast.success(`Found: ${data.data.name}`);
      navigate(`/assets/${data.data._id}`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Asset not found for this QR code');
    }
  };

  const startScanning = async () => {
    setScanning(true);
    const scanner = new Html5Qrcode(QR_ELEMENT_ID);
    scannerRef.current = scanner;

    try {
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        async (decodedText) => {
          await scanner.stop();
          setScanning(false);
          await lookupAsset(decodedText);
        },
        () => {
          // ignore per-frame scan failures (no QR in view)
        }
      );
    } catch (err) {
      toast.error('Could not access camera. Try manual entry instead.');
      setScanning(false);
    }
  };

  const stopScanning = async () => {
    await scannerRef.current?.stop().catch(() => {});
    setScanning(false);
  };

  return (
    <div className="max-w-xl mx-auto">
      <PageHeader title="QR Scanner" subtitle="Scan an asset's QR code to view its details instantly" />

      <div className="card p-6">
        <div
          id={QR_ELEMENT_ID}
          className="mx-auto mb-4 aspect-square w-full max-w-sm overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-700"
        />

        {!scanning ? (
          <button onClick={startScanning} className="btn-primary w-full flex items-center justify-center gap-2">
            <Camera size={16} /> Start Camera Scan
          </button>
        ) : (
          <button onClick={stopScanning} className="btn-secondary w-full flex items-center justify-center gap-2">
            <CameraOff size={16} /> Stop Scanning
          </button>
        )}

        <div className="mt-6 border-t border-gray-100 dark:border-gray-700 pt-4">
          <p className="mb-2 text-sm font-medium flex items-center gap-2">
            <QrCode size={16} /> Or enter Asset ID manually
          </p>
          <div className="flex gap-2">
            <input
              className="input-field"
              placeholder="e.g. AST-2026-0001"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
            />
            <button onClick={() => manualCode && lookupAsset(manualCode)} className="btn-primary shrink-0">
              Look Up
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRScanner;
