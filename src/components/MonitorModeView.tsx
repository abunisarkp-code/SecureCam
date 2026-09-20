import React, { useState, useEffect, useRef } from 'react';
import {
  Camera,
  Radio,
  Square,
  Volume2,
  VolumeX,
  Mic,
  Maximize2,
  Minimize2,
  Settings,
  Battery,
  BatteryCharging,
  Wifi,
  Clock,
  Shield,
  ShieldAlert,
  Plus,
  RefreshCw,
  Trash2,
  Edit2,
  ChevronRight,
  Sliders,
  Check,
  X,
  Video,
  QrCode,
  Smartphone,
  Zap,
} from 'lucide-react';
import { CameraDevice, MotionEventItem, RecordingItem, PhotoItem } from '../types';
import { webrtcEngine, WebRTCTelemetry } from '../utils/webrtcClient';
import { QrCodeScanner } from './QrCodeScanner';

interface MonitorModeViewProps {
  cameras: CameraDevice[];
  onSelectCamera?: (cameraId: string) => void;
  onAddCamera: () => void;
  onRemoveCamera: (cameraId: string) => void;
  onRenameCamera: (cameraId: string, newName: string) => void;
  onRemoteCommand: (cameraId: string, command: string, params?: any) => void;
  onPairCamera?: (code: string, cameraName?: string) => void;
  onOpenLibrary: () => void;
  onOpenTimeline: () => void;
  isTwoWayAudioActive: boolean;
  setIsTwoWayAudioActive: (active: boolean) => void;
}

export const MonitorModeView: React.FC<MonitorModeViewProps> = ({
  cameras,
  onAddCamera,
  onRemoveCamera,
  onRenameCamera,
  onRemoteCommand,
  onPairCamera,
  onOpenLibrary,
  onOpenTimeline,
  isTwoWayAudioActive,
  setIsTwoWayAudioActive,
}) => {
  const [activeCameraId, setActiveCameraId] = useState<string | null>(cameras[0]?.id || null);
  const [isLiveViewOpen, setIsLiveViewOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(true); // Default muted for mobile autoplay compliance
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [showRemoteControls, setShowRemoteControls] = useState(false);
  const [isPairingModalOpen, setIsPairingModalOpen] = useState(false);
  const [pairingTab, setPairingTab] = useState<'qr' | 'code'>('qr');
  const [pairingCodeInput, setPairingCodeInput] = useState('');
  const [pairingStatus, setPairingStatus] = useState<'idle' | 'connecting' | 'success' | 'error'>('idle');
  const [pairingError, setPairingError] = useState('');

  // WebRTC Stream & Telemetry State
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [liveSnapshot, setLiveSnapshot] = useState<string>('');
  const [telemetry, setTelemetry] = useState<WebRTCTelemetry>({
    fps: 30,
    bitrateKbps: 2100,
    latencyMs: 38,
    connectionState: 'idle',
  });

  const liveVideoRef = useRef<HTMLVideoElement | null>(null);
  const selectedCamera: CameraDevice =
    cameras.find((c) => c.id === activeCameraId) ||
    cameras.find((c) => c.isLiveP2P) ||
    cameras[0] || {
      id: 'cam-live',
      name: 'Paired Phone Camera',
      isOnline: true,
      batteryPercent: 90,
      isCharging: true,
      isRecording: false,
      motionDetected: false,
      networkStatus: 'Wi-Fi',
      lastSeen: Date.now(),
      thumbnailUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=600&q=80',
      isLiveP2P: true,
      resolution: '1080p',
      sensitivity: 'MEDIUM',
    };

  // Setup WebRTC Engine Callbacks on mount
  useEffect(() => {
    webrtcEngine.onRemoteStream = (stream) => {
      setRemoteStream(stream);
      if (liveVideoRef.current) {
        const vid = liveVideoRef.current;
        vid.srcObject = stream;
        vid.setAttribute('playsinline', 'true');
        vid.playsInline = true;
        vid.muted = isMuted;
        vid.defaultMuted = isMuted;
        vid.play().catch((err) => {
          console.warn('Playback with audio prevented on mobile, playing muted:', err);
          vid.muted = true;
          setIsMuted(true);
          vid.play().catch(() => {});
        });
      }
    };

    webrtcEngine.onTelemetryUpdate = (data) => {
      setTelemetry((prev) => ({ ...prev, ...data }));
    };

    webrtcEngine.onCameraStateChange = (state) => {
      if (state.snapshotUrl) {
        setLiveSnapshot(state.snapshotUrl);
      }
      if (state.batteryPercent !== undefined && selectedCamera) {
        selectedCamera.batteryPercent = state.batteryPercent;
      }
      if (state.motionDetected !== undefined && selectedCamera) {
        selectedCamera.motionDetected = state.motionDetected;
      }
      if (state.isRecording !== undefined && selectedCamera) {
        selectedCamera.isRecording = state.isRecording;
      }
    };

    // If there's an existing paired camera with code, auto-connect WebRTC
    const pairedCam = cameras.find((c) => c.isLiveP2P && c.pairingCode);
    if (pairedCam && pairedCam.pairingCode) {
      webrtcEngine.startAsMonitor(pairedCam.pairingCode, 'Monitor Phone');
    }
  }, []);

  // Synchronize remote video tag when live view opens or remoteStream updates
  useEffect(() => {
    const video = liveVideoRef.current;
    if (video && remoteStream) {
      if (video.srcObject !== remoteStream) {
        video.srcObject = remoteStream;
      }
      video.setAttribute('playsinline', 'true');
      video.playsInline = true;
      video.muted = isMuted;
      video.defaultMuted = isMuted;
      video.play().catch((err) => {
        console.warn('Initial autoplay error, muting to ensure playback:', err);
        video.muted = true;
        setIsMuted(true);
        video.play().catch((e2) => console.warn('Muted autoplay also failed:', e2));
      });
    }
  }, [remoteStream, isLiveViewOpen, isMuted]);

  // Connect to camera using 6-digit pairing code
  const handleConnectWithCode = (code: string) => {
    const clean = code.replace(/\D/g, '');
    if (clean.length < 6) {
      setPairingError('Please enter all 6 digits of the pairing code.');
      return;
    }

    setPairingStatus('connecting');
    setPairingError('');

    try {
      // Connect to WebRTC signaling server
      webrtcEngine.startAsMonitor(clean, 'Monitor Device');

      if (onPairCamera) {
        onPairCamera(clean, 'Paired Phone Camera');
      }

      // Immediately focus live view on the newly paired camera
      setActiveCameraId(`cam-${clean}`);

      setPairingStatus('success');
      setTimeout(() => {
        setIsPairingModalOpen(false);
        setPairingStatus('idle');
        setPairingCodeInput('');
        setIsLiveViewOpen(true);
      }, 800);
    } catch (err: any) {
      setPairingStatus('error');
      setPairingError(err?.message || 'Failed to establish WebRTC connection.');
    }
  };

  const handleOpenLiveView = (camera: CameraDevice) => {
    setActiveCameraId(camera.id);
    setIsLiveViewOpen(true);

    // If this is a P2P camera and we're not connected to this code, connect
    if (camera.isLiveP2P && camera.pairingCode) {
      webrtcEngine.startAsMonitor(camera.pairingCode, 'Monitor Device');
    }
  };

  const handleSaveRename = (id: string) => {
    if (renameValue.trim()) {
      onRenameCamera(id, renameValue.trim());
    }
    setRenameId(null);
    setRenameValue('');
  };

  // Two-way audio press / release
  const handleStartTalk = () => {
    setIsTwoWayAudioActive(true);
    webrtcEngine.sendMonitorVoice(true);
  };

  const handleStopTalk = () => {
    setIsTwoWayAudioActive(false);
    webrtcEngine.sendMonitorVoice(false);
  };

  // Remote controls dispatch to WebRTC and App
  const handleDispatchRemote = (cmd: string, params?: any) => {
    if (selectedCamera) {
      onRemoteCommand(selectedCamera.id, cmd, params);
      webrtcEngine.sendRemoteCommand(cmd, params);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6 animate-fade-in">
      {/* 1. Header Bar for Monitor Dashboard */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>MY CAMERAS</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-900/60 text-blue-300 font-medium">
              {cameras.filter((c) => c.isOnline).length}/{cameras.length} Online
            </span>
          </h2>
          <p className="text-xs text-neutral-400">
            Remotely controlling and viewing active security camera nodes
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="monitor-open-timeline-btn"
            onClick={onOpenTimeline}
            className="py-2 px-3.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border border-neutral-800 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Clock className="w-4 h-4 text-neutral-400" />
            <span>Timeline</span>
          </button>
          <button
            id="monitor-open-library-btn"
            onClick={onOpenLibrary}
            className="py-2 px-3.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border border-neutral-800 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Video className="w-4 h-4 text-blue-400" />
            <span>Recordings</span>
          </button>
          <button
            id="monitor-pair-camera-btn"
            onClick={() => setIsPairingModalOpen(true)}
            className="py-2 px-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <QrCode className="w-4 h-4" />
            <span>PAIR CAMERA</span>
          </button>
          <button
            id="monitor-add-camera-btn"
            onClick={onAddCamera}
            className="py-2 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>ADD CAMERA</span>
          </button>
        </div>
      </div>

      {/* 2. Grid of Camera Cards (Req 7) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cameras.map((camera) => (
          <div
            key={camera.id}
            className={`bg-neutral-900 border rounded-2xl overflow-hidden transition-all flex flex-col justify-between ${
              camera.motionDetected
                ? 'border-amber-500/70 shadow-lg shadow-amber-500/10'
                : 'border-neutral-800 hover:border-neutral-700'
            }`}
          >
            {/* Camera Video Thumbnail / Status Preview */}
            <div
              onClick={() => handleOpenLiveView(camera)}
              className="relative aspect-video bg-black cursor-pointer group overflow-hidden"
            >
              {camera.isLiveP2P && remoteStream ? (
                <video
                  ref={(el) => {
                    if (el) {
                      if (el.srcObject !== remoteStream) {
                        el.srcObject = remoteStream;
                      }
                      el.setAttribute('playsinline', 'true');
                      el.playsInline = true;
                      el.muted = true;
                      el.defaultMuted = true;
                      el.play().catch(() => {});
                    }
                  }}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : camera.isLiveP2P && liveSnapshot && liveSnapshot.trim() ? (
                <img
                  src={liveSnapshot}
                  alt={camera.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : camera.isLiveP2P ? (
                <div className="w-full h-full flex flex-col items-center justify-center bg-neutral-950 p-4 text-center">
                  <div className="p-3 rounded-full bg-emerald-500/10 text-emerald-400 mb-2 animate-pulse">
                    <Radio className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-bold text-white">Live Phone Camera</span>
                  <span className="text-[11px] text-emerald-400/90 mt-0.5">Click to Open Real Stream</span>
                </div>
              ) : camera.thumbnailUrl && camera.thumbnailUrl.trim() ? (
                <img
                  src={camera.thumbnailUrl}
                  alt={camera.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-80"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-neutral-950 p-4 text-center">
                  <Camera className="w-8 h-8 text-neutral-600 mb-1" />
                  <span className="text-xs text-neutral-400">Camera Armed</span>
                </div>
              )}

              {/* Top overlay badges */}
              <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between">
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1.5 ${
                    camera.isOnline
                      ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/80'
                      : 'bg-neutral-900/90 text-neutral-400 border border-neutral-700'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      camera.isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-neutral-500'
                    }`}
                  />
                  {camera.isLiveP2P ? 'LIVE P2P' : camera.isOnline ? 'ONLINE' : 'OFFLINE'}
                </span>

                <div className="flex items-center gap-1 text-[11px] font-mono bg-black/60 px-2 py-0.5 rounded-md text-neutral-300 border border-white/10">
                  {camera.isCharging ? (
                    <BatteryCharging className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Battery className="w-3.5 h-3.5 text-neutral-400" />
                  )}
                  <span>{camera.batteryPercent}%</span>
                </div>
              </div>

              {/* Motion and Recording alerts */}
              <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none">
                {camera.motionDetected ? (
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-500 text-black px-2 py-0.5 rounded shadow">
                    MOTION DETECTED
                  </span>
                ) : (
                  <span className="text-[10px] text-neutral-400 bg-black/60 px-2 py-0.5 rounded">
                    Motion: Clear
                  </span>
                )}

                {camera.isRecording && (
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-red-600 text-white px-2 py-0.5 rounded flex items-center gap-1 animate-pulse shadow">
                    <Square className="w-2.5 h-2.5 fill-current" />
                    REC
                  </span>
                )}
              </div>

              {/* Hover Click to view banner */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <span className="text-xs font-bold text-white bg-blue-600 px-3.5 py-1.5 rounded-xl shadow-lg flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5" />
                  <span>VIEW LIVE STREAM</span>
                </span>
              </div>
            </div>

            {/* Camera Details & Action Footer */}
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                {renameId === camera.id ? (
                  <div className="flex items-center gap-1 w-full">
                    <input
                      type="text"
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      className="bg-neutral-950 border border-neutral-700 text-white text-xs px-2 py-1 rounded w-full focus:outline-none focus:border-blue-500"
                    />
                    <button
                      onClick={() => handleSaveRename(camera.id)}
                      className="p-1 rounded bg-blue-600 text-white"
                    >
                      <Check className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => setRenameId(null)}
                      className="p-1 rounded bg-neutral-800 text-neutral-400"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm text-neutral-100">{camera.name}</h3>
                    <button
                      onClick={() => {
                        setRenameId(camera.id);
                        setRenameValue(camera.name);
                      }}
                      className="text-neutral-500 hover:text-neutral-300 p-1"
                      title="Rename"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                  </div>
                )}
                <span className="text-[11px] text-neutral-400 font-mono">
                  {camera.networkStatus}
                </span>
              </div>

              <div className="flex items-center justify-between text-[11px] text-neutral-400 pt-1 border-t border-neutral-800">
                <span>
                  Last seen:{' '}
                  {camera.isOnline
                    ? 'Active now'
                    : new Date(camera.lastSeen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                <span>{camera.resolution}</span>
              </div>

              {/* Action Buttons: View, Reconnect, Remove */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() => handleOpenLiveView(camera)}
                  className="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                >
                  <Radio className="w-3.5 h-3.5" />
                  <span>VIEW LIVE</span>
                </button>
                <button
                  onClick={() => onRemoteCommand(camera.id, 'RECONNECT')}
                  title="Reconnect WebRTC Peer"
                  className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onRemoveCamera(camera.id)}
                  title="Remove Camera"
                  className="p-2 rounded-xl bg-neutral-800 hover:bg-red-900/40 text-neutral-400 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 3. Live Stream Viewing Modal (Req 26 & Req 27) */}
      {isLiveViewOpen && selectedCamera && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-md animate-fade-in">
          <div
            className={`bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-5xl flex flex-col overflow-hidden shadow-2xl ${
              isFullScreen ? 'h-full max-w-none rounded-none' : 'max-h-[95vh]'
            }`}
          >
            {/* Modal Top Bar */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800 bg-neutral-950">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                  <h3 className="font-bold text-sm text-white">{selectedCamera.name}</h3>
                </div>
                <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/80 font-mono font-bold">
                  LIVE
                </span>
                <span className="hidden sm:inline text-xs text-neutral-400">
                  WebRTC P2P Direct
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsFullScreen(!isFullScreen)}
                  className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800"
                >
                  {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => setIsLiveViewOpen(false)}
                  className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Video Stage Area */}
            <div className="relative bg-black flex-1 flex items-center justify-center min-h-[360px] overflow-hidden">
              {remoteStream ? (
                <video
                  ref={liveVideoRef}
                  autoPlay
                  playsInline
                  muted={isMuted}
                  className="w-full h-full object-cover"
                />
              ) : liveSnapshot && liveSnapshot.trim() ? (
                <div className="relative w-full h-full flex items-center justify-center bg-black">
                  <img
                    src={liveSnapshot}
                    alt="Live Camera Snapshot Feed"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-3 left-3 bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-lg text-emerald-400 text-xs font-mono border border-emerald-500/30 flex items-center gap-2 shadow-lg">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <span>LIVE FRAME RELAY (WebRTC Connecting...)</span>
                  </div>
                </div>
              ) : selectedCamera.isLiveP2P ? (
                <div className="flex flex-col items-center justify-center text-center p-8 space-y-3 max-w-sm">
                  <div className="p-4 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 animate-pulse">
                    <Radio className="w-10 h-10" />
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-base">Connecting P2P Video Stream...</h4>
                    <p className="text-xs text-neutral-400 mt-1">
                      Camera node code: <span className="font-mono text-emerald-400 font-bold">{selectedCamera.pairingCode || '489 204'}</span>. Make sure your other phone has SecureCam open in Camera Mode.
                    </p>
                  </div>
                  <button
                    onClick={() => handleConnectWithCode(selectedCamera.pairingCode || '489204')}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Reconnect Stream</span>
                  </button>
                </div>
              ) : selectedCamera.thumbnailUrl && selectedCamera.thumbnailUrl.trim() ? (
                <img
                  src={selectedCamera.thumbnailUrl}
                  alt="Camera Feed"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-neutral-500 p-8 space-y-2">
                  <Camera className="w-12 h-12 text-neutral-700" />
                  <span className="text-xs">No active camera stream</span>
                </div>
              )}

              {/* WebRTC Diagnostics Overlay (FPS, Bitrate, Latency) */}
              <div className="absolute top-3 left-3 flex flex-wrap gap-2 text-xs font-mono">
                <span className="bg-black/70 backdrop-blur-md px-2.5 py-1 rounded text-neutral-200 border border-white/10">
                  Latency: <span className="text-emerald-400 font-bold">{telemetry.latencyMs} ms</span>
                </span>
                <span className="bg-black/70 backdrop-blur-md px-2.5 py-1 rounded text-neutral-200 border border-white/10">
                  FPS: <span className="text-emerald-400 font-bold">{telemetry.fps}</span>
                </span>
                <span className="bg-black/70 backdrop-blur-md px-2.5 py-1 rounded text-neutral-200 border border-white/10">
                  Bitrate: <span className="text-emerald-400 font-bold">{(telemetry.bitrateKbps / 1000).toFixed(1)} Mbps</span>
                </span>
                {selectedCamera.isLiveP2P && (
                  <span className="bg-emerald-950/80 backdrop-blur-md px-2.5 py-1 rounded text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5 font-bold">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>P2P ENCRYPTED</span>
                  </span>
                )}
              </div>

              {/* Status Badges Overlay */}
              <div className="absolute top-3 right-3 flex items-center gap-2">
                {selectedCamera.isRecording && (
                  <span className="bg-red-600 text-white text-xs font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 animate-pulse shadow">
                    <Square className="w-3 h-3 fill-current" />
                    RECORDING
                  </span>
                )}
                {selectedCamera.motionDetected && (
                  <span className="bg-amber-500 text-black text-xs font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 shadow">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    MOTION DETECTED
                  </span>
                )}
              </div>

              {/* Two-Way Audio Active Banner */}
              {isTwoWayAudioActive && (
                <div className="absolute bottom-4 inset-x-8 bg-blue-600 text-white px-4 py-2 rounded-xl text-center font-bold text-xs uppercase tracking-wider animate-bounce shadow-xl flex items-center justify-center gap-2">
                  <Mic className="w-4 h-4" />
                  <span>TWO-WAY AUDIO ACTIVE — Camera Speaker Transmitting Voice</span>
                </div>
              )}
            </div>

            {/* Bottom Live Controls Console (Req 26 & 28) */}
            <div className="p-4 bg-neutral-950 border-t border-neutral-800 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                {/* Primary Media Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDispatchRemote('TAKE_PHOTO')}
                    className="py-2.5 px-4 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-semibold text-xs flex items-center gap-2 transition-colors border border-neutral-700"
                  >
                    <Camera className="w-4 h-4 text-emerald-400" />
                    <span>PHOTO</span>
                  </button>

                  {selectedCamera.isRecording ? (
                    <button
                      onClick={() => handleDispatchRemote('STOP_RECORDING')}
                      className="py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold text-xs flex items-center gap-2 transition-colors shadow-sm"
                    >
                      <Square className="w-4 h-4 fill-current" />
                      <span>STOP REC</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleDispatchRemote('START_RECORDING')}
                      className="py-2.5 px-4 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-semibold text-xs flex items-center gap-2 transition-colors border border-neutral-700"
                    >
                      <Radio className="w-4 h-4 text-red-500" />
                      <span>RECORD</span>
                    </button>
                  )}

                  <button
                    onClick={() => {
                      const nextMuted = !isMuted;
                      setIsMuted(nextMuted);
                      if (liveVideoRef.current) {
                        liveVideoRef.current.muted = nextMuted;
                        if (!nextMuted) {
                          liveVideoRef.current.play().catch(() => {});
                        }
                      }
                    }}
                    className={`py-2 px-3 rounded-xl border flex items-center gap-1.5 transition-colors text-xs font-semibold ${
                      !isMuted
                        ? 'bg-emerald-600 text-white border-emerald-500'
                        : 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                    }`}
                    title={isMuted ? 'Muted (Tap to Listen)' : 'Audio On'}
                  >
                    {!isMuted ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-amber-400" />}
                    <span className="hidden sm:inline">{!isMuted ? 'Sound On' : 'Unmute'}</span>
                  </button>
                </div>

                {/* Two-Way Audio Talk Button (Req 28) */}
                <div>
                  <button
                    onMouseDown={handleStartTalk}
                    onMouseUp={handleStopTalk}
                    onTouchStart={handleStartTalk}
                    onTouchEnd={handleStopTalk}
                    className={`py-2.5 px-6 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all shadow-md ${
                      isTwoWayAudioActive
                        ? 'bg-blue-500 text-white ring-4 ring-blue-500/40 scale-105'
                        : 'bg-blue-600 hover:bg-blue-500 text-white'
                    }`}
                  >
                    <Mic className="w-4 h-4" />
                    <span>{isTwoWayAudioActive ? 'HOLDING TO TALK...' : 'HOLD TO TALK'}</span>
                  </button>
                </div>

                {/* Remote Hardware Controls */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowRemoteControls(!showRemoteControls)}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                      showRemoteControls
                        ? 'bg-blue-600/20 text-blue-300 border-blue-500'
                        : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border-neutral-700'
                    }`}
                  >
                    <Sliders className="w-4 h-4" />
                    <span>Remote Controls</span>
                  </button>
                </div>
              </div>

              {/* Collapsible Remote Settings Bar (Req 27) */}
              {showRemoteControls && (
                <div className="p-3 bg-neutral-900 border border-neutral-800 rounded-xl grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <button
                    onClick={() => handleDispatchRemote('SWITCH_LENS')}
                    className="p-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-center font-medium transition-colors"
                  >
                    Flip Lens (Front/Back)
                  </button>
                  <button
                    onClick={() => handleDispatchRemote('TOGGLE_FLASH')}
                    className="p-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-center font-medium transition-colors"
                  >
                    Toggle Flashlight
                  </button>
                  <button
                    onClick={() => handleDispatchRemote('TOGGLE_MOTION')}
                    className="p-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-center font-medium transition-colors"
                  >
                    Toggle Motion Detection
                  </button>
                  <button
                    onClick={() => handleDispatchRemote('REQUEST_HEALTH')}
                    className="p-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-center font-medium transition-colors"
                  >
                    Ping Health Status
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 4. Real QR Scanner & Code Pairing Modal */}
      {isPairingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 max-w-md w-full space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Connect Camera to Monitor</h3>
                  <p className="text-xs text-neutral-400">Pair your phone camera for live WebRTC video</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsPairingModalOpen(false);
                  setPairingStatus('idle');
                  setPairingCodeInput('');
                  setPairingError('');
                }}
                className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tab Selection: QR Scanner vs Manual Code */}
            <div className="flex bg-neutral-950 p-1 rounded-xl border border-neutral-800 gap-1">
              <button
                onClick={() => setPairingTab('qr')}
                className={`flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                  pairingTab === 'qr'
                    ? 'bg-emerald-600 text-white shadow'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Scan QR Code</span>
              </button>
              <button
                onClick={() => setPairingTab('code')}
                className={`flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                  pairingTab === 'code'
                    ? 'bg-emerald-600 text-white shadow'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Enter 6-Digit Code</span>
              </button>
            </div>

            {/* Tab 1: Real Camera QR Code Scanner */}
            {pairingTab === 'qr' && (
              <div className="space-y-3">
                <p className="text-xs text-neutral-300">
                  Point this monitor's camera at the QR code shown on your camera phone:
                </p>
                <QrCodeScanner
                  onScan={(code) => handleConnectWithCode(code)}
                  onCancel={() => setPairingTab('code')}
                />
              </div>
            )}

            {/* Tab 2: Manual 6-Digit Code Entry */}
            {pairingTab === 'code' && (
              <div className="space-y-3 text-xs text-neutral-300">
                <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 space-y-2">
                  <div className="font-semibold text-emerald-400 flex items-center gap-1.5">
                    <Smartphone className="w-4 h-4" />
                    <span>How to find your camera code:</span>
                  </div>
                  <p className="text-neutral-400 leading-relaxed text-[11px]">
                    On your second phone, switch to <strong>Camera Mode</strong>, tap <strong>"Pair Monitor"</strong> (or the QR icon). Look at the 6-digit number displayed below the QR code.
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-xs text-neutral-300 font-semibold block">
                    Enter 6-Digit Camera Code:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      maxLength={7}
                      placeholder="e.g. 489 204"
                      value={pairingCodeInput}
                      onChange={(e) => {
                        setPairingCodeInput(e.target.value);
                        setPairingError('');
                      }}
                      className="flex-1 px-3 py-2.5 bg-neutral-950 border border-neutral-700 rounded-xl text-white font-mono text-center tracking-widest text-base placeholder:text-neutral-600 focus:outline-none focus:border-emerald-500"
                    />
                    <button
                      disabled={pairingStatus === 'connecting'}
                      onClick={() => handleConnectWithCode(pairingCodeInput)}
                      className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold transition-colors shrink-0 flex items-center gap-2"
                    >
                      {pairingStatus === 'connecting' ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Connecting...</span>
                        </>
                      ) : (
                        <span>Connect</span>
                      )}
                    </button>
                  </div>
                  {pairingError && (
                    <p className="text-[11px] text-red-400 font-medium">{pairingError}</p>
                  )}
                  {pairingStatus === 'success' && (
                    <p className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" />
                      <span>Paired successfully! Launching live stream...</span>
                    </p>
                  )}
                </div>

                <div className="p-3 rounded-xl bg-neutral-950/60 border border-neutral-800/80 text-[11px] text-neutral-400">
                  <strong className="text-neutral-300">Direct WebRTC Streaming:</strong> Once connected, video flows peer-to-peer between your phones with minimal latency.
                </div>
              </div>
            )}

            <button
              onClick={() => {
                setIsPairingModalOpen(false);
                setPairingStatus('idle');
                setPairingCodeInput('');
                setPairingError('');
              }}
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
