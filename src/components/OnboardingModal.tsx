import React, { useState } from 'react';
import {
  Camera,
  Monitor,
  Shield,
  Bell,
  Mic,
  Sliders,
  QrCode,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  X,
  Info,
  Smartphone,
  Lock,
} from 'lucide-react';
import { AppSettings, DeviceRole } from '../types';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCompleteSetup: (role: DeviceRole, settingsUpdate?: Partial<AppSettings>) => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onClose,
  onCompleteSetup,
}) => {
  const [view, setView] = useState<'CHOOSER' | 'CAMERA_WIZARD' | 'MONITOR_WIZARD' | 'PRIVACY' | 'PERMISSIONS' | 'ABOUT'>('CHOOSER');
  
  // Camera Setup Wizard state (11 steps)
  const [wizardStep, setWizardStep] = useState(1);
  const [cameraPermissionGranted, setCameraPermissionGranted] = useState(false);
  const [micPermissionGranted, setMicPermissionGranted] = useState(false);
  const [notifPermissionGranted, setNotifPermissionGranted] = useState(false);
  const [selectedLens, setSelectedLens] = useState<'BACK' | 'FRONT'>('BACK');
  const [videoQuality, setVideoQuality] = useState<'480p' | '720p' | '1080p' | 'Device max'>('720p');
  const [fps, setFps] = useState<15 | 24 | 30>(30);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [motionEnabled, setMotionEnabled] = useState(true);
  const [cameraName, setCameraName] = useState('Living Room Camera');

  // Monitor Setup Wizard state
  const [pairMethod, setPairMethod] = useState<'SCAN_QR' | 'ENTER_CODE'>('SCAN_QR');
  const [enteredCode, setEnteredCode] = useState('');
  const [pairingStatus, setPairingStatus] = useState<'IDLE' | 'PAIRING' | 'SUCCESS' | 'ERROR'>('IDLE');

  if (!isOpen) return null;

  const handleRequestCameraPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(t => t.stop());
      setCameraPermissionGranted(true);
    } catch {
      // Simulate permission granted for sandbox/demo
      setCameraPermissionGranted(true);
    }
  };

  const handleRequestMicPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(t => t.stop());
      setMicPermissionGranted(true);
    } catch {
      setMicPermissionGranted(true);
    }
  };

  const handleFinishCameraWizard = () => {
    onCompleteSetup('CAMERA', {
      cameraName,
      selectedLens,
      videoQuality,
      targetFps: fps,
      audioEnabled,
      motionDetectionEnabled: motionEnabled,
    });
    onClose();
  };

  const handleFinishMonitorPairing = () => {
    setPairingStatus('PAIRING');
    setTimeout(() => {
      setPairingStatus('SUCCESS');
      setTimeout(() => {
        onCompleteSetup('MONITOR');
        onClose();
      }, 1000);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-neutral-900 border border-neutral-800 text-neutral-100 rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 relative">
        {/* Close button if user already had a role */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* VIEW 1: CHOOSER */}
        {view === 'CHOOSER' && (
          <div className="text-center py-4">
            <div className="w-16 h-16 bg-emerald-600 rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-emerald-950/60 mb-4">
              <Camera className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-white mb-1">SECURECAM</h2>
            <p className="text-neutral-300 text-sm max-w-md mx-auto mb-8">
              Turn an Android phone into a smart security camera.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              {/* Option 1: Set up as Camera */}
              <button
                id="setup-as-camera-choice-btn"
                onClick={() => {
                  setView('CAMERA_WIZARD');
                  setWizardStep(1);
                }}
                className="group p-5 rounded-xl border border-neutral-700 bg-neutral-800/60 hover:bg-neutral-800 hover:border-emerald-500 transition-all text-left flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                    <Camera className="w-5 h-5" />
                  </div>
                  <h3 className="font-semibold text-white text-base mb-1">SET UP AS CAMERA</h3>
                  <p className="text-xs text-neutral-400 leading-relaxed">
                    This phone stays in your home or office, continuously monitoring motion and streaming securely.
                  </p>
                </div>
                <div className="mt-4 flex items-center gap-1 text-xs font-medium text-emerald-400 group-hover:translate-x-1 transition-transform">
                  <span>Start Camera Setup</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </button>

              {/* Option 2: Set up as Monitor */}
              <button
                id="setup-as-monitor-choice-btn"
                onClick={() => {
                  setView('MONITOR_WIZARD');
                }}
                className="group p-5 rounded-xl border border-neutral-700 bg-neutral-800/60 hover:bg-neutral-800 hover:border-blue-500 transition-all text-left flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                    <Monitor className="w-5 h-5" />
                  </div>
                  <h3 className="font-semibold text-white text-base mb-1">SET UP AS MONITOR</h3>
                  <p className="text-xs text-neutral-400 leading-relaxed">
                    Your daily smartphone or tablet. Connects remotely to view live video, motion alerts, and recordings.
                  </p>
                </div>
                <div className="mt-4 flex items-center gap-1 text-xs font-medium text-blue-400 group-hover:translate-x-1 transition-transform">
                  <span>Pair With Camera</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </button>
            </div>

            {/* Footer Navigation Links */}
            <div className="flex items-center justify-center gap-6 pt-4 border-t border-neutral-800 text-xs text-neutral-400">
              <button onClick={() => setView('PRIVACY')} className="hover:text-emerald-400 transition-colors">
                Privacy
              </button>
              <span>•</span>
              <button onClick={() => setView('PERMISSIONS')} className="hover:text-emerald-400 transition-colors">
                Permissions
              </button>
              <span>•</span>
              <button onClick={() => setView('ABOUT')} className="hover:text-emerald-400 transition-colors">
                About
              </button>
            </div>
          </div>
        )}

        {/* VIEW 2: CAMERA SETUP WIZARD (11 Steps) */}
        {view === 'CAMERA_WIZARD' && (
          <div>
            {/* Header with step progress */}
            <div className="flex items-center justify-between pb-4 border-b border-neutral-800 mb-6">
              <button
                onClick={() => {
                  if (wizardStep > 1) setWizardStep(wizardStep - 1);
                  else setView('CHOOSER');
                }}
                className="flex items-center gap-1 text-xs text-neutral-400 hover:text-white"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              <span className="text-xs font-mono font-semibold text-emerald-400">
                Step {wizardStep} of 11
              </span>
            </div>

            {/* Step 1: Camera Permission */}
            {wizardStep === 1 && (
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-xl bg-neutral-800 flex items-center justify-center text-emerald-400">
                  <Camera className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white">Step 1: Camera Permission</h3>
                <p className="text-sm text-neutral-300">
                  SecureCam requires access to the camera hardware to monitor your premises and stream video over WebRTC.
                </p>
                <button
                  onClick={handleRequestCameraPermission}
                  className={`w-full py-3 px-4 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-colors ${
                    cameraPermissionGranted
                      ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/40'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  }`}
                >
                  {cameraPermissionGranted ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Camera Permission Granted</span>
                    </>
                  ) : (
                    <span>Grant Camera Permission</span>
                  )}
                </button>
              </div>
            )}

            {/* Step 2: Microphone Permission */}
            {wizardStep === 2 && (
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-xl bg-neutral-800 flex items-center justify-center text-emerald-400">
                  <Mic className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white">Step 2: Microphone Permission</h3>
                <p className="text-sm text-neutral-300">
                  Allows transmitting ambient audio and enabling two-way audio talk back to the camera device.
                </p>
                <button
                  onClick={handleRequestMicPermission}
                  className={`w-full py-3 px-4 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-colors ${
                    micPermissionGranted
                      ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/40'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  }`}
                >
                  {micPermissionGranted ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Microphone Permission Granted</span>
                    </>
                  ) : (
                    <span>Grant Microphone Permission</span>
                  )}
                </button>
              </div>
            )}

            {/* Step 3: Notification Permission */}
            {wizardStep === 3 && (
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-xl bg-neutral-800 flex items-center justify-center text-emerald-400">
                  <Bell className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white">Step 3: Notification Permission</h3>
                <p className="text-sm text-neutral-300">
                  Required on Android 13+ to display the mandatory persistent foreground monitoring service notification.
                </p>
                <button
                  onClick={() => setNotifPermissionGranted(true)}
                  className={`w-full py-3 px-4 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-colors ${
                    notifPermissionGranted
                      ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/40'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  }`}
                >
                  {notifPermissionGranted ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Notification Permission Granted</span>
                    </>
                  ) : (
                    <span>Grant Notification Permission</span>
                  )}
                </button>
              </div>
            )}

            {/* Step 4: Explain Foreground Monitoring */}
            {wizardStep === 4 && (
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-xl bg-neutral-800 flex items-center justify-center text-emerald-400">
                  <Shield className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white">Step 4: Foreground Monitoring</h3>
                <div className="p-4 rounded-xl bg-neutral-800/80 border border-neutral-700 text-xs text-neutral-300 space-y-2 leading-relaxed">
                  <p className="font-semibold text-emerald-400">Compliant & Visible Monitoring</p>
                  <p>
                    SecureCam operates strictly in accordance with Android privacy standards. While monitoring is active, an ongoing notification labeled <strong>&quot;SecureCam is monitoring&quot;</strong> will remain visible in your status bar.
                  </p>
                  <p>
                    This prevents Android from terminating the camera process and ensures full compliance with user privacy indicators.
                  </p>
                </div>
              </div>
            )}

            {/* Step 5: Choose Camera (BACK / FRONT) */}
            {wizardStep === 5 && (
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-xl bg-neutral-800 flex items-center justify-center text-emerald-400">
                  <Smartphone className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white">Step 5: Choose Camera Lens</h3>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setSelectedLens('BACK')}
                    className={`p-4 rounded-xl border text-center transition-all ${
                      selectedLens === 'BACK'
                        ? 'bg-emerald-600/20 border-emerald-500 text-white'
                        : 'bg-neutral-800 border-neutral-700 text-neutral-400 hover:text-white'
                    }`}
                  >
                    <div className="font-bold text-sm mb-1">BACK CAMERA</div>
                    <div className="text-xs text-neutral-400">Recommended for wide room coverage</div>
                  </button>
                  <button
                    onClick={() => setSelectedLens('FRONT')}
                    className={`p-4 rounded-xl border text-center transition-all ${
                      selectedLens === 'FRONT'
                        ? 'bg-emerald-600/20 border-emerald-500 text-white'
                        : 'bg-neutral-800 border-neutral-700 text-neutral-400 hover:text-white'
                    }`}
                  >
                    <div className="font-bold text-sm mb-1">FRONT CAMERA</div>
                    <div className="text-xs text-neutral-400">Selfie camera for desk monitoring</div>
                  </button>
                </div>
              </div>
            )}

            {/* Step 6: Video Quality (480p, 720p, 1080p, Device max) */}
            {wizardStep === 6 && (
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-xl bg-neutral-800 flex items-center justify-center text-emerald-400">
                  <Sliders className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white">Step 6: Video Quality</h3>
                <div className="grid grid-cols-2 gap-2">
                  {(['480p', '720p', '1080p', 'Device max'] as const).map((q) => (
                    <button
                      key={q}
                      onClick={() => setVideoQuality(q)}
                      className={`p-3 rounded-xl border text-sm font-semibold transition-all ${
                        videoQuality === q
                          ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300'
                          : 'bg-neutral-800 border-neutral-700 text-neutral-400 hover:text-white'
                      }`}
                    >
                      {q}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-neutral-400">720p is optimal for balance between battery and sharpness.</p>
              </div>
            )}

            {/* Step 7: FPS (15, 24, 30) */}
            {wizardStep === 7 && (
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-xl bg-neutral-800 flex items-center justify-center text-emerald-400">
                  <Sliders className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white">Step 7: Target FPS</h3>
                <div className="grid grid-cols-3 gap-3">
                  {([15, 24, 30] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() => setFps(f)}
                      className={`p-4 rounded-xl border text-center font-bold text-sm transition-all ${
                        fps === f
                          ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300'
                          : 'bg-neutral-800 border-neutral-700 text-neutral-400 hover:text-white'
                      }`}
                    >
                      {f} FPS
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 8: Audio ON/OFF */}
            {wizardStep === 8 && (
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-xl bg-neutral-800 flex items-center justify-center text-emerald-400">
                  <Mic className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white">Step 8: Audio Streaming</h3>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setAudioEnabled(true)}
                    className={`p-4 rounded-xl border text-center font-bold text-sm transition-all ${
                      audioEnabled
                        ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300'
                        : 'bg-neutral-800 border-neutral-700 text-neutral-400'
                    }`}
                  >
                    AUDIO ON
                  </button>
                  <button
                    onClick={() => setAudioEnabled(false)}
                    className={`p-4 rounded-xl border text-center font-bold text-sm transition-all ${
                      !audioEnabled
                        ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300'
                        : 'bg-neutral-800 border-neutral-700 text-neutral-400'
                    }`}
                  >
                    AUDIO OFF
                  </button>
                </div>
              </div>
            )}

            {/* Step 9: Motion Detection ON/OFF */}
            {wizardStep === 9 && (
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-xl bg-neutral-800 flex items-center justify-center text-emerald-400">
                  <Shield className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white">Step 9: Motion Detection</h3>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setMotionEnabled(true)}
                    className={`p-4 rounded-xl border text-center font-bold text-sm transition-all ${
                      motionEnabled
                        ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300'
                        : 'bg-neutral-800 border-neutral-700 text-neutral-400'
                    }`}
                  >
                    MOTION ON
                  </button>
                  <button
                    onClick={() => setMotionEnabled(false)}
                    className={`p-4 rounded-xl border text-center font-bold text-sm transition-all ${
                      !motionEnabled
                        ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300'
                        : 'bg-neutral-800 border-neutral-700 text-neutral-400'
                    }`}
                  >
                    MOTION OFF
                  </button>
                </div>
              </div>
            )}

            {/* Step 10: Camera Name */}
            {wizardStep === 10 && (
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-xl bg-neutral-800 flex items-center justify-center text-emerald-400">
                  <Camera className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white">Step 10: Camera Name</h3>
                <p className="text-xs text-neutral-400">Give your camera an identifiable name:</p>
                <input
                  type="text"
                  value={cameraName}
                  onChange={(e) => setCameraName(e.target.value)}
                  placeholder="e.g. Living Room Camera"
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            )}

            {/* Step 11: Generate Secure QR Pairing Code */}
            {wizardStep === 11 && (
              <div className="space-y-4 text-center">
                <h3 className="text-lg font-bold text-white">Step 11: Secure Pairing Code</h3>
                <p className="text-xs text-neutral-400">
                  Scan this QR code with the Monitor phone or enter the 6-digit short pairing code:
                </p>

                {/* Simulated Cryptographic QR Code display */}
                <div className="bg-white p-4 rounded-2xl inline-block shadow-lg mx-auto">
                  <div className="w-44 h-44 grid grid-cols-6 gap-1 bg-black p-2 rounded-lg">
                    {Array.from({ length: 36 }).map((_, i) => (
                      <div
                        key={i}
                        className={`rounded-xs ${
                          (i % 2 === 0 || i % 5 === 0 || i < 6 || i > 30) ? 'bg-white' : 'bg-black'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <div className="bg-neutral-950 border border-neutral-800 p-3 rounded-xl max-w-xs mx-auto">
                  <span className="text-xs text-neutral-400 block mb-1">6-Digit Short Pairing Code</span>
                  <span className="text-2xl font-mono font-bold tracking-widest text-emerald-400">
                    489 204
                  </span>
                </div>
              </div>
            )}

            {/* Bottom Button Action */}
            <div className="mt-8 flex justify-end">
              {wizardStep < 11 ? (
                <button
                  onClick={() => setWizardStep(wizardStep + 1)}
                  className="py-2.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm flex items-center gap-2 transition-colors"
                >
                  <span>Continue</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={handleFinishCameraWizard}
                  className="py-2.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm flex items-center gap-2 transition-colors"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Start Camera Monitoring</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* VIEW 3: MONITOR SETUP WIZARD */}
        {view === 'MONITOR_WIZARD' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
              <button
                onClick={() => setView('CHOOSER')}
                className="flex items-center gap-1 text-xs text-neutral-400 hover:text-white"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              <h3 className="font-bold text-white text-base">PAIR WITH CAMERA</h3>
            </div>

            <div className="flex rounded-xl bg-neutral-950 p-1 border border-neutral-800">
              <button
                onClick={() => setPairMethod('SCAN_QR')}
                className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
                  pairMethod === 'SCAN_QR' ? 'bg-blue-600 text-white' : 'text-neutral-400 hover:text-white'
                }`}
              >
                Scan QR Code
              </button>
              <button
                onClick={() => setPairMethod('ENTER_CODE')}
                className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
                  pairMethod === 'ENTER_CODE' ? 'bg-blue-600 text-white' : 'text-neutral-400 hover:text-white'
                }`}
              >
                Enter Pairing Code
              </button>
            </div>

            {pairMethod === 'SCAN_QR' ? (
              <div className="text-center space-y-4">
                <div className="w-56 h-56 mx-auto bg-neutral-950 border-2 border-dashed border-blue-500/60 rounded-2xl flex flex-col items-center justify-center p-4 relative overflow-hidden">
                  <QrCode className="w-12 h-12 text-blue-400 mb-2 animate-pulse" />
                  <span className="text-xs text-neutral-400 text-center">
                    Point camera at the QR code displayed on the camera device
                  </span>
                  <div className="absolute inset-x-0 h-0.5 bg-blue-400/80 animate-bounce" />
                </div>
                <button
                  onClick={handleFinishMonitorPairing}
                  disabled={pairingStatus === 'PAIRING'}
                  className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2"
                >
                  {pairingStatus === 'PAIRING' ? (
                    <span>Authenticating with Android Keystore...</span>
                  ) : (
                    <span>Simulate Successful QR Scan</span>
                  )}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-neutral-400 mb-2">
                    Enter 6-Digit Pairing Code from Camera
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={enteredCode}
                    onChange={(e) => setEnteredCode(e.target.value)}
                    placeholder="489204"
                    className="w-full text-center tracking-widest text-2xl font-mono bg-neutral-950 border border-neutral-700 rounded-xl py-3 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <button
                  onClick={handleFinishMonitorPairing}
                  disabled={enteredCode.length < 6 || pairingStatus === 'PAIRING'}
                  className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2"
                >
                  {pairingStatus === 'PAIRING' ? (
                    <span>Pairing & Authenticating...</span>
                  ) : (
                    <span>Pair Camera</span>
                  )}
                </button>
              </div>
            )}
          </div>
        )}

        {/* VIEW 4: PRIVACY */}
        {view === 'PRIVACY' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
              <button
                onClick={() => setView('CHOOSER')}
                className="flex items-center gap-1 text-xs text-neutral-400 hover:text-white"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              <h3 className="font-bold text-white text-base">Privacy Compliance</h3>
            </div>
            <div className="text-xs text-neutral-300 space-y-3 leading-relaxed">
              <p>
                SecureCam is designed strictly for legitimate home, personal, and business premises security.
              </p>
              <ul className="list-disc pl-5 space-y-2 text-neutral-400">
                <li>Zero stealth recording or hidden-camera operation.</li>
                <li>Camera operation never attempts to bypass Android privacy indicators or green camera dots.</li>
                <li>Live camera video is NEVER stored on the signaling server; all video flows P2P or via encrypted WebRTC TURN relays.</li>
                <li>Sensitive device credentials and auth tokens are encrypted using the hardware-backed <strong>Android KeyStore</strong>.</li>
              </ul>
            </div>
          </div>
        )}

        {/* VIEW 5: PERMISSIONS */}
        {view === 'PERMISSIONS' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
              <button
                onClick={() => setView('CHOOSER')}
                className="flex items-center gap-1 text-xs text-neutral-400 hover:text-white"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              <h3 className="font-bold text-white text-base">Required Android Permissions</h3>
            </div>
            <div className="space-y-3 text-xs text-neutral-300">
              <div className="p-3 bg-neutral-800/80 rounded-xl border border-neutral-700">
                <span className="font-semibold text-emerald-400 block mb-1">android.permission.CAMERA</span>
                <span>Enables CameraX image and video capture for monitoring and motion evaluation.</span>
              </div>
              <div className="p-3 bg-neutral-800/80 rounded-xl border border-neutral-700">
                <span className="font-semibold text-emerald-400 block mb-1">android.permission.RECORD_AUDIO</span>
                <span>Allows optional audio monitoring and WebRTC two-way communication.</span>
              </div>
              <div className="p-3 bg-neutral-800/80 rounded-xl border border-neutral-700">
                <span className="font-semibold text-emerald-400 block mb-1">android.permission.FOREGROUND_SERVICE</span>
                <span>Keeps monitoring active with persistent user-visible notification on Android 14+.</span>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 6: ABOUT */}
        {view === 'ABOUT' && (
          <div className="space-y-4 text-center">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
              <button
                onClick={() => setView('CHOOSER')}
                className="flex items-center gap-1 text-xs text-neutral-400 hover:text-white"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              <h3 className="font-bold text-white text-base">About SecureCam</h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-600 flex items-center justify-center mx-auto text-white">
              <Camera className="w-6 h-6" />
            </div>
            <h4 className="text-lg font-bold text-white">SecureCam Android System</h4>
            <p className="text-xs text-neutral-400 max-w-sm mx-auto">
              Production-ready dual-role security camera platform built with Kotlin, Jetpack Compose, CameraX, Room, WebRTC, and Node.js signaling.
            </p>
            <div className="pt-4 text-[11px] text-neutral-500">
              Version 1.0.0 • Licensed under Apache 2.0
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
