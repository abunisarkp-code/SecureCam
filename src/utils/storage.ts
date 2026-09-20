import { AppSettings, CameraDevice, MotionEventItem, MotionZone, PhotoItem, RecordingItem } from '../types';

const SETTINGS_KEY = 'securecam_app_settings_v1';
const CAMERAS_KEY = 'securecam_cameras_v1';
const EVENTS_KEY = 'securecam_events_v1';
const RECORDINGS_KEY = 'securecam_recordings_v1';
const PHOTOS_KEY = 'securecam_photos_v1';
const ZONES_KEY = 'securecam_zones_v1';

export const DEFAULT_SETTINGS: AppSettings = {
  role: 'UNSET',
  deviceRole: 'UNSET',
  isOnboarded: false,
  cameraName: 'Living Room Camera',
  selectedLens: 'BACK',
  videoQuality: '720p',
  targetFps: 30,
  audioEnabled: true,
  motionDetectionEnabled: true,
  motionSensitivity: 'MEDIUM',
  minMovementDurationMs: 400,
  motionCooldownSeconds: 4,
  preMotionBufferSeconds: 10,
  postMotionBufferSeconds: 20,
  recordingMode: 'MOTION ONLY',
  storageLimitGb: 10,
  autoBootStart: true,
  pauseMonitoringBelowBattery: 15,
  monitorOnlyWhileCharging: false,
  pinLockEnabled: false,
  pinCode: '1234',
  biometricEnabled: false,
  signalingServerUrl: 'wss://signaling.securecam.local:8080',
  stunServerUrl: 'stun:stun.l.google.com:19302',
};

export const INITIAL_CAMERAS: CameraDevice[] = [
  {
    id: 'cam-living-room',
    name: 'Living Room Camera',
    isOnline: true,
    batteryPercent: 87,
    isCharging: true,
    isRecording: false,
    motionDetected: false,
    networkStatus: 'Wi-Fi',
    lastSeen: Date.now(),
    thumbnailUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=600&q=80',
    pairedToken: 'sec_tok_living_room_849204',
    lensFacing: 'BACK',
    resolution: '1080p',
    fps: 30,
    audioEnabled: true,
    motionEnabled: true,
    sensitivity: 'MEDIUM',
  },
  {
    id: 'cam-entrance',
    name: 'Front Entrance',
    isOnline: true,
    batteryPercent: 62,
    isCharging: false,
    isRecording: true,
    motionDetected: true,
    networkStatus: 'Wi-Fi',
    lastSeen: Date.now() - 12000,
    thumbnailUrl: 'https://images.unsplash.com/photo-1558036117-15d82a90b9b1?auto=format&fit=crop&w=600&q=80',
    pairedToken: 'sec_tok_entrance_291048',
    lensFacing: 'BACK',
    resolution: '720p',
    fps: 24,
    audioEnabled: true,
    motionEnabled: true,
    sensitivity: 'HIGH',
  },
  {
    id: 'cam-garage',
    name: 'Garage & Driveway',
    isOnline: true,
    batteryPercent: 94,
    isCharging: true,
    isRecording: false,
    motionDetected: false,
    networkStatus: 'Cellular (5G/4G)',
    lastSeen: Date.now() - 45000,
    thumbnailUrl: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=600&q=80',
    pairedToken: 'sec_tok_garage_748291',
    lensFacing: 'BACK',
    resolution: '720p',
    fps: 15,
    audioEnabled: false,
    motionEnabled: true,
    sensitivity: 'LOW',
  },
  {
    id: 'cam-office',
    name: 'Office Room',
    isOnline: false,
    batteryPercent: 12,
    isCharging: false,
    isRecording: false,
    motionDetected: false,
    networkStatus: 'Offline',
    lastSeen: Date.now() - 1000 * 60 * 48,
    thumbnailUrl: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=600&q=80',
    pairedToken: 'sec_tok_office_938172',
    lensFacing: 'BACK',
    resolution: '1080p',
    fps: 30,
    audioEnabled: true,
    motionEnabled: true,
    sensitivity: 'MEDIUM',
  },
];

export const INITIAL_ZONES: MotionZone[] = [
  {
    id: 'zone-door',
    name: 'Main Doorway',
    isEnabled: true,
    xPercent: 15,
    yPercent: 20,
    widthPercent: 35,
    heightPercent: 65,
    sensitivity: 'HIGH',
  },
  {
    id: 'zone-hallway',
    name: 'Staircase / Hall',
    isEnabled: true,
    xPercent: 60,
    yPercent: 30,
    widthPercent: 32,
    heightPercent: 55,
    sensitivity: 'MEDIUM',
  },
];

export const INITIAL_EVENTS: MotionEventItem[] = [
  {
    id: 'evt-101',
    cameraId: 'cam-entrance',
    cameraName: 'Front Entrance',
    timestamp: Date.now() - 1000 * 60 * 3,
    durationSeconds: 15,
    zoneName: 'Main Doorway',
    thumbnailUrl: 'https://images.unsplash.com/photo-1558036117-15d82a90b9b1?auto=format&fit=crop&w=600&q=80',
    isSynced: true,
  },
  {
    id: 'evt-102',
    cameraId: 'cam-living-room',
    cameraName: 'Living Room Camera',
    timestamp: Date.now() - 1000 * 60 * 24,
    durationSeconds: 28,
    zoneName: 'Full Frame',
    thumbnailUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=600&q=80',
    isSynced: true,
  },
  {
    id: 'evt-103',
    cameraId: 'cam-garage',
    cameraName: 'Garage & Driveway',
    timestamp: Date.now() - 1000 * 60 * 95,
    durationSeconds: 12,
    zoneName: 'Driveway Gate',
    thumbnailUrl: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=600&q=80',
    isSynced: true,
  },
];

export const INITIAL_RECORDINGS: RecordingItem[] = [
  {
    id: 'rec-201',
    cameraId: 'cam-entrance',
    cameraName: 'Front Entrance',
    startTime: Date.now() - 1000 * 60 * 3,
    durationSeconds: 35,
    fileSizeBytes: 24_500_000,
    thumbnailUrl: 'https://images.unsplash.com/photo-1558036117-15d82a90b9b1?auto=format&fit=crop&w=600&q=80',
    recordingType: 'MOTION',
    isProtected: true,
    isFavorite: true,
  },
  {
    id: 'rec-202',
    cameraId: 'cam-living-room',
    cameraName: 'Living Room Camera',
    startTime: Date.now() - 1000 * 60 * 24,
    durationSeconds: 68,
    fileSizeBytes: 48_200_000,
    thumbnailUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=600&q=80',
    recordingType: 'MOTION',
    isProtected: false,
    isFavorite: false,
  },
  {
    id: 'rec-203',
    cameraId: 'cam-garage',
    cameraName: 'Garage & Driveway',
    startTime: Date.now() - 1000 * 60 * 95,
    durationSeconds: 42,
    fileSizeBytes: 31_000_000,
    thumbnailUrl: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=600&q=80',
    recordingType: 'SCHEDULED',
    isProtected: false,
    isFavorite: false,
  },
];

export const INITIAL_PHOTOS: PhotoItem[] = [
  {
    id: 'photo-301',
    cameraId: 'cam-entrance',
    cameraName: 'Front Entrance',
    timestamp: Date.now() - 1000 * 60 * 3,
    photoUrl: 'https://images.unsplash.com/photo-1558036117-15d82a90b9b1?auto=format&fit=crop&w=600&q=80',
    isFavorite: true,
    hasTimestampOverlay: true,
  },
  {
    id: 'photo-302',
    cameraId: 'cam-living-room',
    cameraName: 'Living Room Camera',
    timestamp: Date.now() - 1000 * 60 * 24,
    photoUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=600&q=80',
    isFavorite: false,
    hasTimestampOverlay: true,
  },
];

export function loadSettings(): AppSettings {
  const saved = localStorage.getItem(SETTINGS_KEY);
  if (!saved) return DEFAULT_SETTINGS;
  try {
    return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: AppSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function loadCameras(): CameraDevice[] {
  const saved = localStorage.getItem(CAMERAS_KEY);
  if (!saved) return INITIAL_CAMERAS;
  try {
    return JSON.parse(saved);
  } catch {
    return INITIAL_CAMERAS;
  }
}

export function saveCameras(cameras: CameraDevice[]): void {
  localStorage.setItem(CAMERAS_KEY, JSON.stringify(cameras));
}

export function loadZones(): MotionZone[] {
  const saved = localStorage.getItem(ZONES_KEY);
  if (!saved) return INITIAL_ZONES;
  try {
    return JSON.parse(saved);
  } catch {
    return INITIAL_ZONES;
  }
}

export function saveZones(zones: MotionZone[]): void {
  localStorage.setItem(ZONES_KEY, JSON.stringify(zones));
}

export function loadEvents(): MotionEventItem[] {
  const saved = localStorage.getItem(EVENTS_KEY);
  if (!saved) return INITIAL_EVENTS;
  try {
    return JSON.parse(saved);
  } catch {
    return INITIAL_EVENTS;
  }
}

export function saveEvents(events: MotionEventItem[]): void {
  localStorage.setItem(EVENTS_KEY, JSON.stringify(events));
}

export function loadRecordings(): RecordingItem[] {
  const saved = localStorage.getItem(RECORDINGS_KEY);
  if (!saved) return INITIAL_RECORDINGS;
  try {
    return JSON.parse(saved);
  } catch {
    return INITIAL_RECORDINGS;
  }
}

export function saveRecordings(recordings: RecordingItem[]): void {
  localStorage.setItem(RECORDINGS_KEY, JSON.stringify(recordings));
}

export function loadPhotos(): PhotoItem[] {
  const saved = localStorage.getItem(PHOTOS_KEY);
  if (!saved) return INITIAL_PHOTOS;
  try {
    return JSON.parse(saved);
  } catch {
    return INITIAL_PHOTOS;
  }
}

export function savePhotos(photos: PhotoItem[]): void {
  localStorage.setItem(PHOTOS_KEY, JSON.stringify(photos));
}

/**
 * Storage quota management: Purges oldest unprotected recordings
 * when total storage exceeds configured quota limit (Req 23)
 */
export function purgeOldestUnprotectedRecordingsIfNeeded(
  recordings: RecordingItem[],
  maxStorageBytes: number
): RecordingItem[] {
  let totalBytes = recordings.reduce((acc, r) => acc + r.fileSizeBytes, 0);
  if (totalBytes <= maxStorageBytes) return recordings;

  const sorted = [...recordings].sort((a, b) => a.startTime - b.startTime);
  const remaining: RecordingItem[] = [];

  for (const item of sorted) {
    if (totalBytes > maxStorageBytes && !item.isProtected) {
      totalBytes -= item.fileSizeBytes;
      // Deleted to satisfy storage quota!
      continue;
    }
    remaining.push(item);
  }

  saveRecordings(remaining);
  return remaining;
}
