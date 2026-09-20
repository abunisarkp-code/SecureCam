export type DeviceRole = 'CAMERA' | 'MONITOR' | 'UNSET';
export type MotionSensitivity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CUSTOM';

export interface CameraDevice {
  id: string;
  name: string;
  isOnline: boolean;
  batteryPercent: number;
  isCharging: boolean;
  isRecording: boolean;
  motionDetected: boolean;
  networkStatus: 'Wi-Fi' | 'Cellular (5G/4G)' | 'Offline' | 'Wi-Fi (5 GHz)';
  lastSeen: number;
  thumbnailUrl: string;
  pairedToken?: string;
  pairingCode?: string;
  isLiveP2P?: boolean;
  stream?: MediaStream;
  storageUsedMb?: number;
  lastMotionTimestamp?: number;
  lens?: 'BACK' | 'FRONT';
  lensFacing?: 'BACK' | 'FRONT';
  resolution: string;
  fps?: number;
  audioEnabled?: boolean;
  motionEnabled?: boolean;
  sensitivity: MotionSensitivity;
}

export interface MotionZone {
  id: string;
  name: string;
  isEnabled: boolean;
  xPercent: number; // 0 to 100
  yPercent: number; // 0 to 100
  widthPercent: number; // 0 to 100
  heightPercent: number; // 0 to 100
  sensitivity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CUSTOM';
}

export interface MotionEventItem {
  id: string;
  cameraId: string;
  cameraName: string;
  timestamp: number;
  durationSeconds: number;
  zoneName: string;
  thumbnailUrl: string;
  videoUrl?: string;
  isSynced: boolean;
}

export interface RecordingItem {
  id: string;
  cameraId: string;
  cameraName: string;
  startTime: number;
  durationSeconds: number;
  fileSizeBytes: number;
  thumbnailUrl: string;
  videoUrl?: string;
  recordingType: 'MANUAL' | 'MOTION' | 'CONTINUOUS' | 'SCHEDULED';
  isProtected: boolean;
  isFavorite: boolean;
}

export interface PhotoItem {
  id: string;
  cameraId: string;
  cameraName: string;
  timestamp: number;
  photoUrl: string;
  isFavorite: boolean;
  hasTimestampOverlay: boolean;
}

export interface ScheduleItem {
  id: string;
  name: string;
  daysOfWeek: string[]; // ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
  startTime: string; // "18:00"
  endTime: string; // "07:00"
  isMonitoring: boolean;
  isMotionDetection: boolean;
  isRecording: boolean;
}

export interface AppSettings {
  role?: DeviceRole;
  deviceRole: DeviceRole;
  isOnboarded: boolean;
  cameraName: string;
  selectedLens: 'BACK' | 'FRONT';
  videoQuality: '480p' | '720p' | '1080p' | 'Device max';
  targetFps: 15 | 24 | 30;
  audioEnabled: boolean;
  motionDetectionEnabled: boolean;
  motionSensitivity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CUSTOM';
  minMovementDurationMs: number;
  motionCooldownSeconds: number;
  preMotionBufferSeconds: 0 | 5 | 10 | 15 | 30;
  postMotionBufferSeconds: 10 | 20 | 30 | 60 | 120;
  recordingMode: 'MANUAL' | 'MOTION ONLY' | 'CONTINUOUS' | 'SCHEDULED';
  storageLimitGb: 1 | 5 | 10 | 20 | 50;
  autoBootStart: boolean;
  pauseMonitoringBelowBattery: 10 | 15 | 20 | 25;
  monitorOnlyWhileCharging: boolean;
  pinLockEnabled: boolean;
  pinCode: string;
  biometricEnabled: boolean;
  signalingServerUrl: string;
  stunServerUrl: string;
}
