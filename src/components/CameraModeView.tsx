import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Camera,
  Play,
  Square,
  Dot,
  BatteryCharging,
  HardDrive,
  Wifi,
  Flashlight,
  RefreshCw,
  Sliders,
  Volume2,
  VolumeX,
  Shield,
  ShieldAlert,
  QrCode,
  Radio,
  Clock,
  Mic,
  Eye,
  Settings,
} from 'lucide-react';
import { AppSettings, MotionEventItem, MotionZone, PhotoItem, RecordingItem } from '../types';
import { BrowserMotionDetector } from '../utils/motionDetector';
import { webrtcEngine } from '../utils/webrtcClient';
import { QrCodeDisplay } from './QrCodeDisplay';

interface CameraModeViewProps {
  settings: AppSettings;
  zones: MotionZone[];
  onNewEvent: (event: MotionEventItem) => void;
  onNewRecording: (recording: RecordingItem) => void;
  onNewPhoto: (photo: PhotoItem) => void;
  onOpenZones: () => void;
  onOpenSettings: () => void;
  isTwoWayAudioActive?: boolean;
}

export const CameraModeView: React.FC<CameraModeViewProps> = ({
  settings,
  zones,
  onNewEvent,
  onNewRecording,
  onNewPhoto,
  onOpenZones,
  onOpenSettings,
  isTwoWayAudioActive = false,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasSimRef = useRef<HTMLCanvasElement>(null);
  const motionDetectorRef = useRef<BrowserMotionDetector | null>(null);
  const activeStreamRef = useRef<MediaStream | null>(null);
  const handleStopRecordingRef = useRef<() => void>(() => {});
  const handleTakePhotoRef = useRef<() => void>(() => {});
  const handleToggleTorchRef = useRef<() => void>(() => {});

  const [isMonitoring, setIsMonitoring] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [motionDetected, setMotionDetected] = useState(false);
  const [currentMotionZone, setCurrentMotionZone] = useState<string | null>(null);
  const [motionRatio, setMotionRatio] = useState(0);
  const [isFrontCamera, setIsFrontCamera] = useState(settings.selectedLens === 'FRONT');
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [audioMuted, setAudioMuted] = useState(!settings.audioEnabled);
  const [showQrModal, setShowQrModal] = useState(false);
  const [batteryLevel, setBatteryLevel] = useState(88);
  const [isCharging, setIsCharging] = useState(true);
  const [cameraStreamAvailable, setCameraStreamAvailable] = useState(false);
  const [pairingCode] = useState<string>(() => {
    const saved = localStorage.getItem('securecam_camera_pairing_code');
    if (saved && saved.length >= 6) return saved;
    // Generate clean 6-digit code e.g. 489204
    const newCode = Math.floor(100000 + Math.random() * 900000).toString();
    localStorage.setItem('securecam_camera_pairing_code', newCode);
    return newCode;
  });

  // Query real battery if supported
  useEffect(() => {
    if ('getBattery' in navigator) {
      (navigator as any).getBattery?.().then((bat: any) => {
        setBatteryLevel(Math.round(bat.level * 100));
        setIsCharging(bat.charging);
        bat.onlevelchange = () => setBatteryLevel(Math.round(bat.level * 100));
        bat.onchargingchange = () => setIsCharging(bat.charging);
      }).catch(() => {});
    }
  }, []);

  // Broadcast WebRTC Telemetry & Live Snapshots to paired monitors
  useEffect(() => {
    const broadcastTelemetry = () => {
      const vid = videoRef.current;
      const sim = canvasSimRef.current;
      let snapshotUrl = '';

      if (vid && vid.videoWidth > 0 && vid.readyState >= 2) {
        try {
          const offCanvas = document.createElement('canvas');
          offCanvas.width = 480;
          offCanvas.height = Math.round(480 * (vid.videoHeight / vid.videoWidth)) || 270;
          const offCtx = offCanvas.getContext('2d');
          if (offCtx) {
            offCtx.drawImage(vid, 0, 0, offCanvas.width, offCanvas.height);
            snapshotUrl = offCanvas.toDataURL('image/jpeg', 0.6);
          }
        } catch (_) {}
      } else if (sim) {
        try {
          snapshotUrl = sim.toDataURL('image/jpeg', 0.5);
        } catch (_) {}
      }

      webrtcEngine.sendTelemetry({
        battery: batteryLevel,
        isCharging,
        motionDetected,
        isRecording,
        snapshotUrl: snapshotUrl || undefined,
      });
    };

    broadcastTelemetry();
    const interval = window.setInterval(broadcastTelemetry, 1500);
    return () => clearInterval(interval);
  }, [batteryLevel, isCharging, motionDetected, isRecording]);

  // Handle remote commands received from Monitor device
  useEffect(() => {
    webrtcEngine.onRemoteCommandReceived = (command: string) => {
      if (command === 'SWITCH_LENS') {
        setIsFrontCamera((prev) => !prev);
      } else if (command === 'START_RECORDING') {
        setIsRecording(true);
      } else if (command === 'STOP_RECORDING') {
        handleStopRecordingRef.current();
      } else if (command === 'TAKE_PHOTO') {
        handleTakePhotoRef.current();
      } else if (command === 'TOGGLE_FLASH') {
        handleToggleTorchRef.current();
      }
    };
  }, []);

  // Initialize Motion Detector instance
  useEffect(() => {
    motionDetectorRef.current = new BrowserMotionDetector();
  }, []);

  // Initialize Real Camera Stream & publish to WebRTC
  useEffect(() => {
    let stream: MediaStream | null = null;
    let isCancelled = false;

    async function initCamera() {
      try {
        const constraints: MediaStreamConstraints = {
          video: {
            facingMode: isFrontCamera ? 'user' : 'environment',
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: !audioMuted,
        };

        try {
          stream = await navigator.mediaDevices.getUserMedia(constraints);
        } catch (mediaErr) {
          console.warn('getUserMedia with audio failed, falling back to video-only stream:', mediaErr);
          stream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: isFrontCamera ? 'user' : 'environment',
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
            audio: false,
          });
        }

        if (isCancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        activeStreamRef.current = stream;
        if (videoRef.current) {
          const vid = videoRef.current;
          vid.srcObject = stream;
          vid.setAttribute('playsinline', 'true');
          vid.playsInline = true;
          vid.muted = true;
          vid.defaultMuted = true;
          vid.play().catch((playErr) => console.warn('Camera video play error:', playErr));
          setCameraStreamAvailable(true);
        }

        // Start WebRTC camera engine with real stream
        webrtcEngine.startAsCamera(pairingCode, settings.cameraName, stream);
      } catch (err) {
        console.warn('Real webcam not accessible, running built-in canvas camera simulator:', err);
        setCameraStreamAvailable(false);
      }
    }

    initCamera();

    return () => {
      isCancelled = true;
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      activeStreamRef.current = null;
    };
  }, [isFrontCamera, audioMuted, pairingCode, settings.cameraName]);

  // Synthetic Camera Canvas Stream Generator if real webcam is blocked in iframe
  useEffect(() => {
    if (cameraStreamAvailable) return;

    const canvas = canvasSimRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let personX = 200;
    let personDir = 2;

    const drawSimulatedFrame = () => {
      const w = canvas.width;
      const h = canvas.height;

      // Background room gradient
      const grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, '#1c1917');
      grad.addColorStop(1, '#0c0a09');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Room outline & doorway
      ctx.strokeStyle = '#292524';
      ctx.lineWidth = 2;
      ctx.strokeRect(80, 80, w - 160, h - 160);

      // Simulated doorway
      ctx.fillStyle = '#262626';
      ctx.fillRect(140, 100, 180, 320);

      // Simulated moving subject if monitoring is active
      if (isMonitoring) {
        personX += personDir;
        if (personX > 320 || personX < 160) {
          personDir = -personDir;
        }

        // Draw walking silhouette
        ctx.fillStyle = '#10b981';
        ctx.beginPath();
        ctx.arc(personX, 220, 24, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(personX - 16, 244, 32, 70);
      }

      // Security overlay timestamp
      const now = new Date();
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.fillRect(20, h - 50, 480, 36);
      ctx.fillStyle = '#10b981';
      ctx.font = 'bold 16px monospace';
      ctx.fillText(
        `SECURECAM [CAM_01] • ${now.toLocaleDateString()} ${now.toLocaleTimeString()}`,
        32,
        h - 26
      );

      animId = requestAnimationFrame(drawSimulatedFrame);
    };

    drawSimulatedFrame();

    // Attach stream to video tag & publish to WebRTC
    try {
      const stream = canvas.captureStream(30);
      activeStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
      webrtcEngine.startAsCamera(pairingCode, settings.cameraName, stream);
    } catch (_e) {}

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [cameraStreamAvailable, isMonitoring]);

  // Handle Motion Detection Loop
  useEffect(() => {
    if (!isMonitoring || !settings.motionDetectionEnabled) return;

    const interval = setInterval(() => {
      const video = videoRef.current;
      const detector = motionDetectorRef.current;
      if (!video || !detector) return;

      const result = detector.detect(
        video,
        settings.motionSensitivity,
        zones,
        settings.motionCooldownSeconds * 1000,
        settings.minMovementDurationMs
      );

      setMotionRatio(result.motionRatio);
      setMotionDetected(result.hasMotion);
      setCurrentMotionZone(result.triggeredZone ? result.triggeredZone.name : null);

      // Motion just started: auto-capture snapshot & trigger auto-recording
      if (result.motionJustStarted) {
        const snapshotUrl = detector.captureSnapshot(video, true);
        const eventId = `evt-${Date.now()}`;
        const zoneName = result.triggeredZone ? result.triggeredZone.name : 'Full Frame';

        onNewEvent({
          id: eventId,
          cameraId: 'cam-local',
          cameraName: settings.cameraName,
          timestamp: Date.now(),
          durationSeconds: 12,
          zoneName,
          thumbnailUrl: snapshotUrl || 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600',
          isSynced: true,
        });

        // Also save snapshot photo
        onNewPhoto({
          id: `photo-${Date.now()}`,
          cameraId: 'cam-local',
          cameraName: settings.cameraName,
          timestamp: Date.now(),
          photoUrl: snapshotUrl || 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600',
          isFavorite: false,
          hasTimestampOverlay: true,
        });

        // Auto-start video recording if configured for MOTION ONLY
        if (settings.recordingMode === 'MOTION ONLY' && !isRecording) {
          setIsRecording(true);
        }
      }

      if (result.motionJustStopped) {
        if (settings.recordingMode === 'MOTION ONLY' && isRecording) {
          handleStopRecording();
        }
      }
    }, 150);

    return () => clearInterval(interval);
  }, [isMonitoring, settings, zones, isRecording]);

  // Recording Timer
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (isRecording) {
      timer = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      setRecordingSeconds(0);
    }
    return () => clearInterval(timer);
  }, [isRecording]);

  const handleStartRecording = () => {
    setIsRecording(true);
  };

  const handleStopRecording = useCallback(() => {
    if (!isRecording) return;
    setIsRecording(false);

    const video = videoRef.current;
    const detector = motionDetectorRef.current;
    const thumb = video && detector ? detector.captureSnapshot(video, true) : '';

    onNewRecording({
      id: `rec-${Date.now()}`,
      cameraId: 'cam-local',
      cameraName: settings.cameraName,
      startTime: Date.now() - recordingSeconds * 1000,
      durationSeconds: Math.max(recordingSeconds, 5),
      fileSizeBytes: Math.max(recordingSeconds * 1_200_000, 3_500_000),
      thumbnailUrl: thumb || 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600',
      recordingType: 'MOTION',
      isProtected: false,
      isFavorite: false,
    });
  }, [isRecording, recordingSeconds, settings.cameraName, onNewRecording]);

  const handleTakePhoto = useCallback(() => {
    const video = videoRef.current;
    const detector = motionDetectorRef.current;
    if (!video || !detector) return;

    const snap = detector.captureSnapshot(video, true);
    onNewPhoto({
      id: `photo-${Date.now()}`,
      cameraId: 'cam-local',
      cameraName: settings.cameraName,
      timestamp: Date.now(),
      photoUrl: snap || 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600',
      isFavorite: true,
      hasTimestampOverlay: true,
    });
  }, [settings.cameraName, onNewPhoto]);

  const handleToggleTorch = useCallback(async () => {
    setTorchEnabled((prev) => {
      const next = !prev;
      if (activeStreamRef.current) {
        const videoTrack = activeStreamRef.current.getVideoTracks()[0];
        if (videoTrack) {
          try {
            const capabilities = (videoTrack.getCapabilities?.() || {}) as any;
            if (capabilities.torch) {
              (videoTrack.applyConstraints as any)({
                advanced: [{ torch: next }],
              }).catch(() => {});
            }
          } catch (_) {}
        }
      }
      return next;
    });
  }, []);

  // Keep latest refs available for remote RPC listeners
  useEffect(() => {
    handleStopRecordingRef.current = handleStopRecording;
    handleTakePhotoRef.current = handleTakePhoto;
    handleToggleTorchRef.current = handleToggleTorch;
  }, [handleStopRecording, handleTakePhoto, handleToggleTorch]);

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-4 animate-fade-in">
      {/* 1. Android Foreground Service Ongoing Notification Banner */}
      {isMonitoring && (
        <div
          id="foreground-service-banner"
          className="bg-emerald-950/70 border border-emerald-800/80 text-emerald-100 rounded-xl px-4 py-3 flex flex-wrap items-center justify-between gap-3 shadow-sm"
        >
          <div className="flex items-center gap-3">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
            </span>
            <div>
              <p className="text-xs font-semibold text-emerald-300">
                Foreground Service Active • Notification: &quot;SecureCam is monitoring&quot;
              </p>
              <p className="text-[11px] text-neutral-400">
                CameraX active • Android WakeLock engaged • Motion analyzer running locally
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsMonitoring(false)}
              className="px-3 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold rounded-lg transition-colors border border-neutral-700"
            >
              STOP MONITORING
            </button>
            <button
              onClick={() => setShowQrModal(true)}
              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>Pairing Code</span>
            </button>
          </div>
        </div>
      )}

      {/* 2. Two-Way Audio Indicator Banner */}
      {isTwoWayAudioActive && (
        <div className="bg-blue-600/90 text-white rounded-xl px-4 py-2 flex items-center justify-between animate-pulse">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
            <Mic className="w-4 h-4" />
            <span>TWO-WAY AUDIO ACTIVE — Monitor Speaker Connected</span>
          </div>
          <span className="text-[11px] font-medium bg-blue-900/60 px-2 py-0.5 rounded">Live Talk</span>
        </div>
      )}

      {/* 3. Main Camera Preview Stage */}
      <div className="relative bg-black rounded-2xl overflow-hidden border border-neutral-800 shadow-2xl aspect-video max-h-[580px] flex items-center justify-center">
        {/* Real or Simulated Video */}
        <video
          ref={videoRef}
          muted
          playsInline
          autoPlay
          className="w-full h-full object-cover"
        />

        {/* Hidden Fallback Canvas for Simulator */}
        <canvas
          ref={canvasSimRef}
          width={1280}
          height={720}
          className="hidden"
        />

        {/* Active Visual Motion Zones Outline */}
        <div className="absolute inset-0 pointer-events-none">
          {zones
            .filter((z) => z.isEnabled)
            .map((zone) => (
              <div
                key={zone.id}
                style={{
                  left: `${zone.xPercent}%`,
                  top: `${zone.yPercent}%`,
                  width: `${zone.widthPercent}%`,
                  height: `${zone.heightPercent}%`,
                }}
                className={`absolute border-2 rounded-lg transition-colors ${
                  motionDetected && currentMotionZone === zone.name
                    ? 'border-red-500 bg-red-500/20 shadow-lg shadow-red-500/30'
                    : 'border-emerald-500/60 bg-emerald-500/5'
                }`}
              >
                <span className="absolute top-1 left-2 text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-black/70 text-emerald-300">
                  {zone.name}
                </span>
              </div>
            ))}
        </div>

        {/* Top Badges Overlay */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
          <div className="flex items-center gap-2">
            <span
              className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow ${
                isMonitoring ? 'bg-emerald-600 text-white' : 'bg-neutral-800/90 text-neutral-300'
              }`}
            >
              <Dot className="w-4 h-4 text-emerald-300 animate-ping" />
              {isMonitoring ? 'MONITORING ARMED' : 'STANDBY'}
            </span>

            {isRecording && (
              <span className="px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider bg-red-600 text-white flex items-center gap-1.5 animate-pulse shadow">
                <Square className="w-3 h-3 fill-current" />
                REC {String(Math.floor(recordingSeconds / 60)).padStart(2, '0')}:
                {String(recordingSeconds % 60).padStart(2, '0')}
              </span>
            )}

            {motionDetected && (
              <span className="px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider bg-amber-500 text-black flex items-center gap-1.5 shadow">
                <ShieldAlert className="w-3.5 h-3.5" />
                MOTION: {currentMotionZone || 'DETECTED'}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs font-mono bg-black/60 backdrop-blur-md px-3 py-1 rounded-lg text-neutral-300 border border-white/10">
            <span className="text-emerald-400 font-bold">{settings.videoQuality}</span>
            <span>•</span>
            <span>{settings.targetFps} FPS</span>
            <span>•</span>
            <BatteryCharging className="w-3.5 h-3.5 text-emerald-400 inline" />
            <span>{batteryLevel}%</span>
          </div>
        </div>

        {/* Bottom Status Overlay */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-none">
          <div className="bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 text-xs font-mono text-neutral-300 flex items-center gap-3">
            <span>Name: {settings.cameraName}</span>
            <span>Lens: {isFrontCamera ? 'Front' : 'Back'}</span>
            <span>Sensitivity: {settings.motionSensitivity}</span>
          </div>

          {/* Real-time Motion Delta Meter */}
          <div className="bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 flex items-center gap-2">
            <span className="text-[11px] text-neutral-400 font-medium">Motion Delta:</span>
            <div className="w-24 h-2 bg-neutral-800 rounded-full overflow-hidden">
              <div
                style={{ width: `${Math.min(motionRatio * 500, 100)}%` }}
                className={`h-full transition-all duration-100 ${
                  motionRatio > 0.035 ? 'bg-red-500' : 'bg-emerald-500'
                }`}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 4. Camera Control Button Bar */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
        {/* Main Monitoring Action */}
        <div className="flex items-center gap-2">
          {isMonitoring ? (
            <button
              id="stop-monitoring-btn"
              onClick={() => setIsMonitoring(false)}
              className="py-2.5 px-4 bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/40 rounded-xl font-semibold text-xs flex items-center gap-2 transition-colors"
            >
              <Square className="w-4 h-4" />
              <span>STOP MONITORING</span>
            </button>
          ) : (
            <button
              id="start-monitoring-btn"
              onClick={() => setIsMonitoring(true)}
              className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-semibold text-xs flex items-center gap-2 transition-colors shadow-sm"
            >
              <Play className="w-4 h-4" />
              <span>START MONITORING</span>
            </button>
          )}

          {/* Manual Recording Trigger */}
          {isRecording ? (
            <button
              id="stop-recording-btn"
              onClick={handleStopRecording}
              className="py-2.5 px-4 bg-red-600 hover:bg-red-500 text-white rounded-xl font-semibold text-xs flex items-center gap-2 transition-colors shadow-sm"
            >
              <Square className="w-4 h-4 fill-current" />
              <span>STOP RECORDING</span>
            </button>
          ) : (
            <button
              id="start-recording-btn"
              onClick={handleStartRecording}
              className="py-2.5 px-4 bg-neutral-800 hover:bg-neutral-700 text-neutral-100 rounded-xl font-semibold text-xs flex items-center gap-2 transition-colors border border-neutral-700"
            >
              <Radio className="w-4 h-4 text-red-400" />
              <span>START RECORDING</span>
            </button>
          )}

          {/* Take Photo Snapshot */}
          <button
            id="take-photo-btn"
            onClick={handleTakePhoto}
            className="py-2.5 px-4 bg-neutral-800 hover:bg-neutral-700 text-neutral-100 rounded-xl font-semibold text-xs flex items-center gap-2 transition-colors border border-neutral-700"
          >
            <Camera className="w-4 h-4 text-emerald-400" />
            <span>TAKE PHOTO</span>
          </button>
        </div>

        {/* Hardware Controls (Lens, Torch, Audio, Zones) */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsFrontCamera(!isFrontCamera)}
            title="Switch Front/Back Lens"
            className="p-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setTorchEnabled(!torchEnabled)}
            title="Toggle Flash / Torch"
            className={`p-2.5 rounded-xl border transition-colors ${
              torchEnabled
                ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border-neutral-700'
            }`}
          >
            <Flashlight className="w-4 h-4" />
          </button>
          <button
            onClick={() => setAudioMuted(!audioMuted)}
            title="Toggle Audio Capture"
            className={`p-2.5 rounded-xl border transition-colors ${
              !audioMuted
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-400 border-neutral-700'
            }`}
          >
            {!audioMuted ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
          <button
            id="camera-qr-pair-btn"
            onClick={() => setShowQrModal(true)}
            title="Pair with Monitor Device (QR / Code)"
            className="py-2.5 px-3 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 rounded-xl font-semibold text-xs flex items-center gap-1.5 border border-emerald-500/40 transition-colors"
          >
            <QrCode className="w-4 h-4" />
            <span>Pair Monitor</span>
          </button>
          <button
            onClick={onOpenZones}
            className="py-2.5 px-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-xl font-semibold text-xs flex items-center gap-1.5 border border-neutral-700 transition-colors"
          >
            <Eye className="w-4 h-4 text-emerald-400" />
            <span>Zones ({zones.length})</span>
          </button>
          <button
            onClick={onOpenSettings}
            className="p-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 transition-colors"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 5. Device Telemetry & Storage Status Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-neutral-300">
        <div className="p-3 bg-neutral-900 border border-neutral-800 rounded-xl">
          <div className="flex items-center justify-between text-neutral-400 text-xs mb-1">
            <span>Battery Status</span>
            <BatteryCharging className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-sm font-bold text-white font-mono">
            {batteryLevel}% • {isCharging ? 'Charging' : 'Discharging'}
          </div>
        </div>

        <div className="p-3 bg-neutral-900 border border-neutral-800 rounded-xl">
          <div className="flex items-center justify-between text-neutral-400 text-xs mb-1">
            <span>Storage Quota</span>
            <HardDrive className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <div className="text-sm font-bold text-white font-mono">
            1.4 GB / {settings.storageLimitGb} GB
          </div>
        </div>

        <div className="p-3 bg-neutral-900 border border-neutral-800 rounded-xl">
          <div className="flex items-center justify-between text-neutral-400 text-xs mb-1">
            <span>Network</span>
            <Wifi className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-sm font-bold text-white font-mono">
            Wi-Fi (192.168.1.104)
          </div>
        </div>

        <div className="p-3 bg-neutral-900 border border-neutral-800 rounded-xl">
          <div className="flex items-center justify-between text-neutral-400 text-xs mb-1">
            <span>Pre-Buffer</span>
            <Clock className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-sm font-bold text-white font-mono">
            {settings.preMotionBufferSeconds}s Rolling Buffer
          </div>
        </div>
      </div>

      {/* QR Pairing Code Modal */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 max-w-sm w-full text-center space-y-4">
            <h3 className="text-lg font-bold text-white">Camera Pairing Code</h3>
            <p className="text-xs text-neutral-400">
              Point your Monitor device's camera scanner at this QR code to connect and stream video instantly.
            </p>

            {/* Real Crisp SVG/Canvas QR Code with pairing payload */}
            <QrCodeDisplay
              code={pairingCode}
              cameraName={settings.cameraName}
              onClose={() => setShowQrModal(false)}
            />

            <button
              onClick={() => setShowQrModal(false)}
              className="w-full py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-semibold text-xs transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
