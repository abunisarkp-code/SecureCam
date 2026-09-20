import React from 'react';
import {
  Camera,
  Monitor,
  Video,
  Clock,
  Grid,
  Settings,
  Code2,
  FlaskConical,
  ShieldCheck,
  Wifi,
  BatteryCharging,
  Smartphone,
  Download,
} from 'lucide-react';
import { DeviceRole } from '../types';

interface HeaderProps {
  currentRole: DeviceRole;
  onRoleChange: (role: DeviceRole) => void;
  onOpenLibrary: () => void;
  onOpenTimeline: () => void;
  onOpenZones: () => void;
  onOpenSettings: () => void;
  onOpenCodeExplorer: () => void;
  onOpenApkModal: () => void;
  onToggleTestMode: () => void;
  isTestModeOpen: boolean;
  batteryPercent?: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentRole,
  onRoleChange,
  onOpenLibrary,
  onOpenTimeline,
  onOpenZones,
  onOpenSettings,
  onOpenCodeExplorer,
  onOpenApkModal,
  onToggleTestMode,
  isTestModeOpen,
  batteryPercent = 88,
}) => {
  return (
    <header
      id="securecam-header"
      className="bg-neutral-900 border-b border-neutral-800 text-white px-4 py-3 sticky top-0 z-40"
    >
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center shadow-md shadow-emerald-950/40">
            <Camera className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-neutral-100">SecureCam</h1>
              <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
                v1.0 Pro
              </span>
            </div>
            <p className="text-xs text-neutral-400">Android Smart Camera & Monitor</p>
          </div>
        </div>

        {/* Mode Switcher Pill */}
        <div
          id="mode-switcher-container"
          className="flex items-center bg-neutral-950 p-1 rounded-xl border border-neutral-800"
        >
          <button
            id="switch-to-camera-mode-btn"
            onClick={() => onRoleChange('CAMERA')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              currentRole === 'CAMERA'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>Camera Device</span>
          </button>
          <button
            id="switch-to-monitor-mode-btn"
            onClick={() => onRoleChange('MONITOR')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              currentRole === 'MONITOR'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
            }`}
          >
            <Monitor className="w-4 h-4" />
            <span>Monitor Device</span>
          </button>
        </div>

        {/* Telemetry Status Indicators */}
        <div className="hidden lg:flex items-center gap-4 text-xs text-neutral-400">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-neutral-300 font-mono">Signaling: Online</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Wifi className="w-3.5 h-3.5 text-neutral-400" />
            <span className="text-neutral-300">WebRTC P2P</span>
          </div>
          <div className="flex items-center gap-1.5">
            <BatteryCharging className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-neutral-300 font-mono">{batteryPercent}%</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            id="nav-zones-btn"
            onClick={onOpenZones}
            title="Motion Zones"
            className="p-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 transition-colors"
          >
            <Grid className="w-4 h-4" />
          </button>
          <button
            id="nav-timeline-btn"
            onClick={onOpenTimeline}
            title="Event Timeline"
            className="p-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 transition-colors"
          >
            <Clock className="w-4 h-4" />
          </button>
          <button
            id="nav-library-btn"
            onClick={onOpenLibrary}
            title="Recordings & Photos"
            className="p-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 transition-colors"
          >
            <Video className="w-4 h-4" />
          </button>
          <button
            id="nav-testmode-btn"
            onClick={onToggleTestMode}
            title="Developer Test Mode"
            className={`p-2 rounded-lg transition-colors ${
              isTestModeOpen
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200'
            }`}
          >
            <FlaskConical className="w-4 h-4" />
          </button>
          <button
            id="nav-apk-btn"
            onClick={onOpenApkModal}
            title="Download Android App / APK Project"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md shadow-emerald-950/40 transition-all hover:scale-105"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download APK</span>
          </button>
          <button
            id="nav-code-btn"
            onClick={onOpenCodeExplorer}
            title="Android & Server Code"
            className="p-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-emerald-400 transition-colors"
          >
            <Code2 className="w-4 h-4" />
          </button>
          <button
            id="nav-settings-btn"
            onClick={onOpenSettings}
            title="Settings"
            className="p-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 transition-colors"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
