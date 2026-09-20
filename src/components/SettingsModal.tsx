import React, { useState } from 'react';
import {
  X,
  Camera,
  Shield,
  Video,
  HardDrive,
  Bell,
  Wifi,
  Lock,
  Calendar,
  BatteryCharging,
  Smartphone,
  Info,
  Check,
  KeyRound,
  Fingerprint,
  Download,
} from 'lucide-react';
import { AppSettings, DeviceRole } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSaveSettings: (settings: AppSettings) => void;
  onChangeRole: (role: DeviceRole) => void;
}

type SettingsCategory =
  | 'CAMERA'
  | 'MOTION'
  | 'RECORDING'
  | 'STORAGE'
  | 'SECURITY'
  | 'POWER'
  | 'SCHEDULES'
  | 'ABOUT';

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  onChangeRole,
}) => {
  const [activeCategory, setActiveCategory] = useState<SettingsCategory>('CAMERA');
  const [localSettings, setLocalSettings] = useState<AppSettings>(settings);
  const [pinInput, setPinInput] = useState(settings.pinCode || '1234');

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveSettings({ ...localSettings, pinCode: pinInput });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-800 bg-neutral-950 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white">System Settings</h3>
            <p className="text-xs text-neutral-400">
              Configure camera hardware, motion thresholds, keystore security, and power rules
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Category Navigation Sidebar */}
          <div className="w-full md:w-56 bg-neutral-950 border-r border-neutral-800 p-2 overflow-y-auto space-y-1">
            {(
              [
                { id: 'CAMERA', label: 'Camera Hardware', icon: Camera },
                { id: 'MOTION', label: 'Motion Detection', icon: Shield },
                { id: 'RECORDING', label: 'Recording Modes', icon: Video },
                { id: 'STORAGE', label: 'Storage Quota', icon: HardDrive },
                { id: 'SECURITY', label: 'Security & App Lock', icon: Lock },
                { id: 'POWER', label: 'Battery & Power', icon: BatteryCharging },
                { id: 'SCHEDULES', label: 'Monitoring Schedules', icon: Calendar },
                { id: 'ABOUT', label: 'About SecureCam', icon: Info },
              ] as const
            ).map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveCategory(item.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors text-left ${
                    activeCategory === item.id
                      ? 'bg-neutral-800 text-emerald-400 border border-neutral-700'
                      : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Settings Detail Pane */}
          <div className="flex-1 p-6 overflow-y-auto space-y-6 text-sm">
            {/* 1. CAMERA HARDWARE */}
            {activeCategory === 'CAMERA' && (
              <div className="space-y-4">
                <h4 className="font-bold text-white text-base">Camera & Sensor Settings</h4>

                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1">
                    Camera Name
                  </label>
                  <input
                    type="text"
                    value={localSettings.cameraName}
                    onChange={(e) =>
                      setLocalSettings({ ...localSettings, cameraName: e.target.value })
                    }
                    className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-neutral-400 mb-1">
                      Camera Lens
                    </label>
                    <div className="flex rounded-xl bg-neutral-950 p-1 border border-neutral-700">
                      <button
                        onClick={() =>
                          setLocalSettings({ ...localSettings, selectedLens: 'BACK' })
                        }
                        className={`flex-1 py-1.5 rounded-lg text-xs font-semibold ${
                          localSettings.selectedLens === 'BACK'
                            ? 'bg-emerald-600 text-white'
                            : 'text-neutral-400'
                        }`}
                      >
                        Back Camera
                      </button>
                      <button
                        onClick={() =>
                          setLocalSettings({ ...localSettings, selectedLens: 'FRONT' })
                        }
                        className={`flex-1 py-1.5 rounded-lg text-xs font-semibold ${
                          localSettings.selectedLens === 'FRONT'
                            ? 'bg-emerald-600 text-white'
                            : 'text-neutral-400'
                        }`}
                      >
                        Front Camera
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-neutral-400 mb-1">
                      Resolution
                    </label>
                    <select
                      value={localSettings.videoQuality}
                      onChange={(e) =>
                        setLocalSettings({
                          ...localSettings,
                          videoQuality: e.target.value as any,
                        })
                      }
                      className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white"
                    >
                      <option value="480p">480p (SD - Low Bandwidth)</option>
                      <option value="720p">720p (HD - Balanced)</option>
                      <option value="1080p">1080p (Full HD)</option>
                      <option value="Device max">Device Maximum (4K where supported)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-neutral-400 mb-1">
                      Target FPS
                    </label>
                    <select
                      value={localSettings.targetFps}
                      onChange={(e) =>
                        setLocalSettings({
                          ...localSettings,
                          targetFps: Number(e.target.value) as any,
                        })
                      }
                      className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white"
                    >
                      <option value={15}>15 FPS (Conserve Battery)</option>
                      <option value={24}>24 FPS (Cinematic)</option>
                      <option value={30}>30 FPS (Smooth Standard)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-neutral-400 mb-1">
                      Audio Capture
                    </label>
                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="checkbox"
                        checked={localSettings.audioEnabled}
                        onChange={(e) =>
                          setLocalSettings({
                            ...localSettings,
                            audioEnabled: e.target.checked,
                          })
                        }
                        className="rounded border-neutral-700 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="text-xs text-neutral-300">Transmit ambient microphone audio</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 2. MOTION DETECTION */}
            {activeCategory === 'MOTION' && (
              <div className="space-y-4">
                <h4 className="font-bold text-white text-base">Motion Detection Engine</h4>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={localSettings.motionDetectionEnabled}
                    onChange={(e) =>
                      setLocalSettings({
                        ...localSettings,
                        motionDetectionEnabled: e.target.checked,
                      })
                    }
                    className="rounded border-neutral-700 text-emerald-600"
                  />
                  <span className="text-xs font-semibold text-white">
                    Enable Local Motion Detection (Zero Cloud Overhead)
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1">
                    Sensitivity Preset
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {(['LOW', 'MEDIUM', 'HIGH', 'CUSTOM'] as const).map((lvl) => (
                      <button
                        key={lvl}
                        onClick={() =>
                          setLocalSettings({ ...localSettings, motionSensitivity: lvl })
                        }
                        className={`py-2 rounded-xl text-xs font-bold border transition-colors ${
                          localSettings.motionSensitivity === lvl
                            ? 'bg-emerald-600/20 border-emerald-500 text-emerald-400'
                            : 'bg-neutral-950 border-neutral-700 text-neutral-400'
                        }`}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-neutral-400 mb-1">
                      Minimum Movement Duration (ms)
                    </label>
                    <input
                      type="number"
                      step={100}
                      min={100}
                      max={2000}
                      value={localSettings.minMovementDurationMs}
                      onChange={(e) =>
                        setLocalSettings({
                          ...localSettings,
                          minMovementDurationMs: Number(e.target.value),
                        })
                      }
                      className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white"
                    />
                    <span className="text-[11px] text-neutral-500">
                      Ignores transient lighting flickers under this duration
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-neutral-400 mb-1">
                      Motion Cooldown Period (Seconds)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={30}
                      value={localSettings.motionCooldownSeconds}
                      onChange={(e) =>
                        setLocalSettings({
                          ...localSettings,
                          motionCooldownSeconds: Number(e.target.value),
                        })
                      }
                      className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white"
                    />
                    <span className="text-[11px] text-neutral-500">
                      Delay before declaring motion event concluded
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* 3. RECORDING MODES */}
            {activeCategory === 'RECORDING' && (
              <div className="space-y-4">
                <h4 className="font-bold text-white text-base">Video Recording & Buffering</h4>

                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1">
                    Recording Mode
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {(['MANUAL', 'MOTION ONLY', 'CONTINUOUS', 'SCHEDULED'] as const).map(
                      (mode) => (
                        <button
                          key={mode}
                          onClick={() =>
                            setLocalSettings({ ...localSettings, recordingMode: mode })
                          }
                          className={`py-2 px-1 text-center rounded-xl text-xs font-semibold border transition-colors ${
                            localSettings.recordingMode === mode
                              ? 'bg-blue-600/20 border-blue-500 text-blue-400'
                              : 'bg-neutral-950 border-neutral-700 text-neutral-400'
                          }`}
                        >
                          {mode}
                        </button>
                      )
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-neutral-400 mb-1">
                      Pre-Motion Rolling Buffer (Req 19)
                    </label>
                    <select
                      value={localSettings.preMotionBufferSeconds}
                      onChange={(e) =>
                        setLocalSettings({
                          ...localSettings,
                          preMotionBufferSeconds: Number(e.target.value) as any,
                        })
                      }
                      className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white"
                    >
                      <option value={0}>OFF (No buffer)</option>
                      <option value={5}>5 seconds pre-buffer</option>
                      <option value={10}>10 seconds pre-buffer (Recommended)</option>
                      <option value={15}>15 seconds pre-buffer</option>
                      <option value={30}>30 seconds pre-buffer</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-neutral-400 mb-1">
                      Post-Motion Recording (Req 20)
                    </label>
                    <select
                      value={localSettings.postMotionBufferSeconds}
                      onChange={(e) =>
                        setLocalSettings({
                          ...localSettings,
                          postMotionBufferSeconds: Number(e.target.value) as any,
                        })
                      }
                      className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white"
                    >
                      <option value={10}>10 seconds post-recording</option>
                      <option value={20}>20 seconds post-recording</option>
                      <option value={30}>30 seconds post-recording</option>
                      <option value={60}>60 seconds post-recording</option>
                      <option value={120}>120 seconds post-recording</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* 4. STORAGE QUOTA */}
            {activeCategory === 'STORAGE' && (
              <div className="space-y-4">
                <h4 className="font-bold text-white text-base">Storage Management</h4>

                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1">
                    Maximum App Storage Limit (Req 23)
                  </label>
                  <div className="grid grid-cols-5 gap-2">
                    {([1, 5, 10, 20, 50] as const).map((gb) => (
                      <button
                        key={gb}
                        onClick={() =>
                          setLocalSettings({ ...localSettings, storageLimitGb: gb })
                        }
                        className={`py-2.5 rounded-xl font-bold text-xs border transition-colors ${
                          localSettings.storageLimitGb === gb
                            ? 'bg-emerald-600/20 border-emerald-500 text-emerald-400'
                            : 'bg-neutral-950 border-neutral-700 text-neutral-400'
                        }`}
                      >
                        {gb} GB
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-neutral-400 space-y-2">
                  <span className="font-semibold text-white block">Auto-Purge Strategy</span>
                  <p>
                    When total recording and photo storage exceeds {localSettings.storageLimitGb} GB,
                    SecureCam automatically removes the oldest unprotected recordings.
                  </p>
                  <p className="text-emerald-400">
                    Files marked as &quot;PROTECTED&quot; in the library are permanently exempt from auto-deletion.
                  </p>
                </div>
              </div>
            )}

            {/* 5. SECURITY & APP LOCK */}
            {activeCategory === 'SECURITY' && (
              <div className="space-y-4">
                <h4 className="font-bold text-white text-base">Security & Android Keystore</h4>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={localSettings.pinLockEnabled}
                    onChange={(e) =>
                      setLocalSettings({ ...localSettings, pinLockEnabled: e.target.checked })
                    }
                    className="rounded border-neutral-700 text-emerald-600"
                  />
                  <span className="text-xs font-semibold text-white">
                    Require PIN Lock to view live stream or library
                  </span>
                </div>

                {localSettings.pinLockEnabled && (
                  <div>
                    <label className="block text-xs font-medium text-neutral-400 mb-1">
                      Set 4-Digit Security PIN
                    </label>
                    <input
                      type="password"
                      maxLength={4}
                      value={pinInput}
                      onChange={(e) => setPinInput(e.target.value)}
                      className="w-32 text-center text-lg font-mono tracking-widest bg-neutral-950 border border-neutral-700 rounded-xl py-1.5 text-white"
                    />
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={localSettings.biometricEnabled}
                    onChange={(e) =>
                      setLocalSettings({ ...localSettings, biometricEnabled: e.target.checked })
                    }
                    className="rounded border-neutral-700 text-emerald-600"
                  />
                  <span className="text-xs text-neutral-300">
                    Enable BiometricPrompt (Fingerprint / Face Unlock where supported)
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-neutral-400 space-y-2">
                  <span className="font-semibold text-white block">Cryptographic Integrity</span>
                  <p>
                    All pairing credentials and device authorization tokens are encrypted with AES-256-GCM using the hardware-backed Android KeyStore.
                  </p>
                </div>
              </div>
            )}

            {/* 6. POWER & BATTERY */}
            {activeCategory === 'POWER' && (
              <div className="space-y-4">
                <h4 className="font-bold text-white text-base">Battery & Power Optimization</h4>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={localSettings.autoBootStart}
                    onChange={(e) =>
                      setLocalSettings({ ...localSettings, autoBootStart: e.target.checked })
                    }
                    className="rounded border-neutral-700 text-emerald-600"
                  />
                  <span className="text-xs text-neutral-200">
                    Start monitoring automatically after phone reboots (BootReceiver)
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={localSettings.monitorOnlyWhileCharging}
                    onChange={(e) =>
                      setLocalSettings({
                        ...localSettings,
                        monitorOnlyWhileCharging: e.target.checked,
                      })
                    }
                    className="rounded border-neutral-700 text-emerald-600"
                  />
                  <span className="text-xs text-neutral-200">
                    Monitor only while device is connected to charger
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1">
                    Pause monitoring when battery drops below:
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {([10, 15, 20, 25] as const).map((pct) => (
                      <button
                        key={pct}
                        onClick={() =>
                          setLocalSettings({
                            ...localSettings,
                            pauseMonitoringBelowBattery: pct,
                          })
                        }
                        className={`py-2 rounded-xl text-xs font-bold border ${
                          localSettings.pauseMonitoringBelowBattery === pct
                            ? 'bg-emerald-600/20 border-emerald-500 text-emerald-400'
                            : 'bg-neutral-950 border-neutral-700 text-neutral-400'
                        }`}
                      >
                        {pct}%
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 7. MONITORING SCHEDULES */}
            {activeCategory === 'SCHEDULES' && (
              <div className="space-y-4">
                <h4 className="font-bold text-white text-base">Monitoring Schedules</h4>
                <div className="space-y-3">
                  <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-white">Weekday Security Rule</div>
                      <div className="text-neutral-400 font-mono">
                        Mon - Fri • 18:00 – 07:00 (Next Day)
                      </div>
                    </div>
                    <span className="text-emerald-400 font-semibold bg-emerald-950/80 px-2 py-0.5 rounded">
                      Armed
                    </span>
                  </div>

                  <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-white">Weekend 24-Hour Watch</div>
                      <div className="text-neutral-400 font-mono">Sat - Sun • 24 Hours Active</div>
                    </div>
                    <span className="text-emerald-400 font-semibold bg-emerald-950/80 px-2 py-0.5 rounded">
                      Armed
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* 8. ABOUT */}
            {activeCategory === 'ABOUT' && (
              <div className="space-y-4 text-xs text-neutral-300">
                <h4 className="font-bold text-white text-base">About SecureCam</h4>
                <p>
                  SecureCam is a complete, production-ready Android security camera and monitoring ecosystem.
                </p>
                <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-xl space-y-2 font-mono text-[11px]">
                  <div>Application: SecureCam Android</div>
                  <div>Architecture: Kotlin • Jetpack Compose • CameraX • Room • WebRTC</div>
                  <div>Signaling: Node.js • WebSocket • TLS • JWT</div>
                  <div>Video Relay: WebRTC P2P with STUN & coturn TURN</div>
                  <div>Persistence: Room SQLite + Android KeyStore</div>
                </div>

                <div className="pt-2">
                  <a
                    href="/SecureCam-Android-Project.tar.gz"
                    download="SecureCam-Android-Project.tar.gz"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-all shadow-sm"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Complete Android Project (.tar.gz)</span>
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-neutral-800 bg-neutral-950 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="py-2 px-4 rounded-xl text-xs font-semibold text-neutral-400 hover:text-white"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="py-2 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm"
          >
            <Check className="w-4 h-4" />
            <span>Save Settings</span>
          </button>
        </div>
      </div>
    </div>
  );
};
