import React, { useEffect, useRef, useState } from 'react';
import { Camera, X, ScanLine, AlertCircle, Keyboard, CheckCircle2 } from 'lucide-react';

export default function CameraScanner({ open, onClose, onDetected, title = 'Camera scanner', hint = 'Point the camera at a barcode or QR code.' }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const timerRef = useRef(null);
  const [error, setError] = useState('');
  const [supported, setSupported] = useState(false);
  const [manual, setManual] = useState('');
  const [scannedCode, setScannedCode] = useState('');
  const scannedRef = useRef('');

  useEffect(() => {
    if (!open) return undefined;
    let cancelled = false;
    const start = async () => {
      setError('');
      setManual('');
      setScannedCode('');
      scannedRef.current = '';
      setSupported('BarcodeDetector' in window);
      if (!navigator.mediaDevices?.getUserMedia) {
        setError('Camera access is not available in this browser. Use the manual barcode field below.');
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach(track => track.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        if ('BarcodeDetector' in window) {
          let detector;
          try {
            detector = new window.BarcodeDetector({ formats: ['code_128', 'ean_13', 'ean_8', 'upc_a', 'upc_e', 'qr_code', 'data_matrix'] });
          } catch {
            detector = new window.BarcodeDetector();
          }
          timerRef.current = window.setInterval(async () => {
            if (!videoRef.current || videoRef.current.readyState < 2 || scannedRef.current) return;
            try {
              const codes = await detector.detect(videoRef.current);
              const value = codes?.[0]?.rawValue?.trim();
              if (value) {
                scannedRef.current = value;
                setScannedCode(value);
              }
            } catch {
              // Detection can fail for individual frames; keep the camera open.
            }
          }, 450);
        }
      } catch (e) {
        setError(e?.name === 'NotAllowedError'
          ? 'Camera permission was blocked. Allow camera access for localhost and try again.'
          : 'Unable to open the camera. Use the manual field below.');
      }
    };
    start();
    return () => {
      cancelled = true;
      if (timerRef.current) window.clearInterval(timerRef.current);
      timerRef.current = null;
      streamRef.current?.getTracks().forEach(track => track.stop());
      streamRef.current = null;
      if (videoRef.current) videoRef.current.srcObject = null;
    };
  }, [open]);


  if (!open) return null;

  const submit = (value) => {
    const code = String(value || '').trim();
    if (!code) return;
    onDetected?.(code);
    onClose?.();
  };

  return (
    <div className="fixed inset-0 z-[80] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl border border-slate-200" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <div className="text-[10px] uppercase tracking-widest font-bold text-sky-600">Live scan</div>
            <h2 className="text-xl font-extrabold mt-1">{title}</h2>
            <p className="text-xs text-slate-500 mt-1">{hint}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-50 text-slate-500" title="Close camera">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="relative overflow-hidden rounded-xl bg-slate-950 aspect-video border border-slate-200">
            <video ref={videoRef} className="w-full h-full object-cover" muted playsInline autoPlay />
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="w-[72%] h-28 border-2 border-sky-400/90 rounded-xl shadow-[0_0_0_9999px_rgba(15,23,42,0.28)]" />
            </div>
            <div className="absolute left-3 top-3 rounded-full bg-slate-950/80 text-white px-2.5 py-1 text-[10px] font-bold flex items-center gap-1.5">
              <Camera className="w-3 h-3" /> Camera active
            </div>
          </div>

          {scannedCode && (
            <div className="flex items-center justify-between border border-emerald-200 bg-emerald-50 rounded-xl px-4 py-3">
              <div className="flex items-center gap-2 min-w-0">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <div className="min-w-0">
                  <div className="text-[10px] uppercase tracking-wider text-emerald-700 font-bold">Detected</div>
                  <div className="font-mono text-sm font-extrabold truncate">{scannedCode}</div>
                </div>
              </div>
              <button onClick={() => submit(scannedCode)} className="rounded-lg bg-slate-900 text-white px-3.5 py-2 text-xs font-bold">Use code</button>
            </div>
          )}

          {error && (
            <div className="flex gap-2 items-start rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-3 text-xs text-amber-800">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {!supported && !error && (
            <div className="text-[11px] text-slate-500 bg-slate-50 border border-slate-200 rounded-xl p-3">
              Automatic barcode detection is not exposed by this browser. The live camera is still available for visual verification; enter the code below or use a dedicated scanner.
            </div>
          )}

          <div className="border-t border-slate-100 pt-4">
            <label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1.5"><Keyboard className="w-3.5 h-3.5" /> Manual fallback</label>
            <div className="flex gap-2 mt-2">
              <input
                value={manual}
                onChange={e => setManual(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && submit(manual)}
                placeholder="Type or paste barcode / box ID"
                className="ops-field flex-1 font-mono"
                autoComplete="off"
              />
              <button onClick={() => submit(manual)} disabled={!manual.trim()} className="ops-primary inline-flex items-center gap-2 disabled:opacity-40">
                <ScanLine className="w-4 h-4" />Use code
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
