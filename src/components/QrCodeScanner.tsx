import React, { useEffect, useRef, useState, useCallback } from 'react';
import jsQR from 'jsqr';
import { Camera, Flashlight, AlertCircle, RefreshCw, X } from 'lucide-react';

interface QrCodeScannerProps {
  onScan: (code: string) => void;
  onCancel?: () => void;
}

export const QrCodeScanner: React.FC<QrCodeScannerProps> = ({ onScan, onCancel }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [hasCameraError, setHasCameraError] = useState<string | null>(null);
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);
  const [scannedCode, setScannedCode] = useState<string | null>(null);

  const stopCamera = useCallback(() => {
    if (animFrameIdRef.current) {
      cancelAnimationFrame(animFrameIdRef.current);
      animFrameIdRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  const startCamera = useCallback(async () => {
    setHasCameraError(null);
    setScannedCode(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }

      // Check torch capability
      const videoTrack = stream.getVideoTracks()[0];
      const capabilities = (videoTrack?.getCapabilities?.() as any) || {};
      if (capabilities.torch) {
        setTorchSupported(true);
      }

      scanLoop();
    } catch (err: any) {
      console.warn('QR Scanner camera start error:', err);
      setHasCameraError(
        err.name === 'NotAllowedError'
          ? 'Camera permission denied. Please allow camera access to scan QR codes.'
          : 'Could not access device camera for scanning.'
      );
    }
  }, []);

  const toggleTorch = async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (!track) return;

    try {
      const nextState = !isTorchOn;
      await (track as any).applyConstraints({
        advanced: [{ torch: nextState }],
      });
      setIsTorchOn(nextState);
    } catch (_) {}
  };

  const scanLoop = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
      animFrameIdRef.current = requestAnimationFrame(scanLoop);
      return;
    }

    const width = video.videoWidth;
    const height = video.videoHeight;

    if (width > 0 && height > 0) {
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (ctx) {
        ctx.drawImage(video, 0, 0, width, height);
        const imageData = ctx.getImageData(0, 0, width, height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'dontInvert',
        });

        if (code && code.data) {
          const raw = code.data.trim();
          let parsedCode = '';

          // 1. Check if JSON payload
          if (raw.startsWith('{')) {
            try {
              const obj = JSON.parse(raw);
              if (obj.code) parsedCode = String(obj.code);
            } catch (_) {}
          }

          // 2. Check if URL with ?pair=...
          if (!parsedCode && raw.includes('pair=')) {
            try {
              const url = new URL(raw);
              const param = url.searchParams.get('pair');
              if (param) parsedCode = param;
            } catch (_) {
              const match = raw.match(/pair=([a-zA-Z0-9]+)/);
              if (match) parsedCode = match[1];
            }
          }

          // 3. Raw 6-digit or alphanumeric code
          if (!parsedCode) {
            const digits = raw.replace(/\D/g, '');
            if (digits.length === 6) {
              parsedCode = digits;
            } else if (raw.length <= 12) {
              parsedCode = raw;
            }
          }

          if (parsedCode) {
            setScannedCode(parsedCode);
            // Haptic vibration feedback
            try {
              if (navigator.vibrate) navigator.vibrate([80, 40, 80]);
            } catch (_) {}

            stopCamera();
            onScan(parsedCode);
            return;
          }
        }
      }
    }

    animFrameIdRef.current = requestAnimationFrame(scanLoop);
  };

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, [startCamera, stopCamera]);

  return (
    <div className="flex flex-col items-center w-full space-y-3">
      <div className="relative w-full aspect-square max-w-[320px] bg-black rounded-2xl overflow-hidden border-2 border-emerald-500/60 shadow-2xl">
        {/* Real Live Video */}
        <video
          ref={videoRef}
          playsInline
          muted
          autoPlay
          className="w-full h-full object-cover"
        />

        {/* Hidden Canvas for QR Extraction */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Viewfinder Target Graphic */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-8">
          <div className="relative w-48 h-48 border-2 border-emerald-400/80 rounded-2xl">
            {/* Corner accents */}
            <div className="absolute -top-1 -left-1 w-5 h-5 border-t-4 border-l-4 border-emerald-400 rounded-tl" />
            <div className="absolute -top-1 -right-1 w-5 h-5 border-t-4 border-r-4 border-emerald-400 rounded-tr" />
            <div className="absolute -bottom-1 -left-1 w-5 h-5 border-b-4 border-l-4 border-emerald-400 rounded-bl" />
            <div className="absolute -bottom-1 -right-1 w-5 h-5 border-b-4 border-r-4 border-emerald-400 rounded-br" />

            {/* Laser scanning bar animation */}
            <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent animate-pulse absolute top-1/2 -translate-y-1/2 shadow-lg shadow-emerald-400/50" />
          </div>
        </div>

        {/* Torch toggle if available */}
        {torchSupported && (
          <button
            onClick={toggleTorch}
            className={`absolute top-3 right-3 p-2 rounded-xl backdrop-blur-md transition-colors ${
              isTorchOn ? 'bg-amber-400 text-black' : 'bg-black/60 text-white border border-white/20'
            }`}
            title="Toggle Flashlight"
          >
            <Flashlight className="w-4 h-4" />
          </button>
        )}

        {/* Scanned Badge */}
        {scannedCode && (
          <div className="absolute inset-0 bg-emerald-950/80 backdrop-blur-sm flex flex-col items-center justify-center text-white p-4">
            <span className="text-xs uppercase tracking-widest text-emerald-300 font-bold mb-1">
              QR Code Detected!
            </span>
            <span className="text-2xl font-mono font-black text-emerald-400">{scannedCode}</span>
            <span className="text-xs text-neutral-300 mt-2">Connecting peer-to-peer stream...</span>
          </div>
        )}

        {/* Camera Error Display */}
        {hasCameraError && (
          <div className="absolute inset-0 bg-neutral-900/95 flex flex-col items-center justify-center p-5 text-center space-y-3">
            <AlertCircle className="w-8 h-8 text-amber-400" />
            <p className="text-xs text-neutral-300 leading-relaxed">{hasCameraError}</p>
            <button
              onClick={startCamera}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry Camera</span>
            </button>
          </div>
        )}
      </div>

      <div className="text-center text-xs text-neutral-400">
        Align the Camera phone's QR code within the frame to pair automatically.
      </div>
    </div>
  );
};
