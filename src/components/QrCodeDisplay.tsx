import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { Copy, Check, QrCode as QrIcon, Link, ShieldCheck } from 'lucide-react';

interface QrCodeDisplayProps {
  code: string;
  cameraName: string;
  onClose?: () => void;
}

export const QrCodeDisplay: React.FC<QrCodeDisplayProps> = ({ code, cameraName, onClose }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Format code e.g. "489 204"
  const cleanCode = code.replace(/\s+/g, '');
  const formattedCode = cleanCode.length === 6 
    ? `${cleanCode.slice(0, 3)} ${cleanCode.slice(3)}` 
    : cleanCode;

  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
  const pairingLink = `${currentOrigin}/?pair=${cleanCode}&role=MONITOR`;

  // Direct URL encoded in QR code so standard iOS/Android camera can tap-to-open directly
  const qrPayload = pairingLink;

  useEffect(() => {
    if (canvasRef.current) {
      QRCode.toCanvas(
        canvasRef.current,
        qrPayload,
        {
          width: 220,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#ffffff',
          },
          errorCorrectionLevel: 'M',
        },
        (error) => {
          if (error) console.error('QR code generation error:', error);
        }
      );
    }
  }, [qrPayload]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(cleanCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(pairingLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      {/* Real Canvas QR Code */}
      <div className="p-3 bg-white rounded-2xl shadow-xl border border-neutral-200">
        <canvas ref={canvasRef} className="rounded-xl block" />
      </div>

      {/* 6-Digit Code Box */}
      <div className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 flex items-center justify-between">
        <div>
          <span className="text-[10px] text-neutral-400 uppercase tracking-wider block font-semibold">
            6-Digit Pairing Code
          </span>
          <span className="text-2xl font-mono font-extrabold tracking-widest text-emerald-400">
            {formattedCode}
          </span>
        </div>
        <button
          onClick={handleCopyCode}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold border border-neutral-700 transition-colors"
        >
          {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copiedCode ? 'Copied!' : 'Copy'}</span>
        </button>
      </div>

      {/* Direct Pairing Link Button */}
      <button
        onClick={handleCopyLink}
        className="w-full py-2 px-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-xs text-neutral-300 hover:text-white flex items-center justify-center gap-2 transition-colors"
      >
        {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Link className="w-3.5 h-3.5" />}
        <span>{copiedLink ? 'Link Copied to Clipboard!' : 'Copy Direct Link for Other Phone'}</span>
      </button>

      <div className="flex items-center gap-1.5 text-[11px] text-neutral-400 text-center">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
        <span>Scan this QR code with the Monitor phone camera to stream video directly!</span>
      </div>

      {/* Note about Google AI Studio Security Cookie screen */}
      <div className="w-full bg-neutral-900/80 border border-neutral-800 rounded-xl p-3 text-[11px] text-neutral-300 space-y-1.5 text-left">
        <div className="font-semibold text-neutral-200 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block shrink-0" />
          <span>If phone shows "Action required to load your app":</span>
        </div>
        <p className="text-neutral-400 leading-relaxed">
          1. Tap the <strong className="text-neutral-200">Compass (Safari)</strong> or <strong className="text-neutral-200">⋮ (Three dots)</strong> icon on your phone and select <strong className="text-emerald-400">"Open in Browser / Chrome"</strong> (camera scanners block pop-ups).
        </p>
        <p className="text-neutral-400 leading-relaxed">
          2. Tap <span className="text-white font-medium bg-neutral-800 px-1.5 py-0.5 rounded">Authenticate in new window</span> to log in with your Google account.
        </p>
      </div>
    </div>
  );
};
