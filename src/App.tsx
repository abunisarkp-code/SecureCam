import React, { useState, useEffect } from 'react';
import {
  loadSettings,
  saveSettings,
  loadZones,
  saveZones,
  loadCameras,
  saveCameras,
  loadRecordings,
  saveRecordings,
  loadPhotos,
  savePhotos,
  loadEvents,
  saveEvents,
} from './utils/storage';
import {
  AppSettings,
  CameraDevice,
  DeviceRole,
  MotionEventItem,
  MotionZone,
  PhotoItem,
  RecordingItem,
} from './types';
import { Header } from './components/Header';
import { OnboardingModal } from './components/OnboardingModal';
import { CameraModeView } from './components/CameraModeView';
import { MonitorModeView } from './components/MonitorModeView';
import { MotionZoneEditorModal } from './components/MotionZoneEditorModal';
import { RecordingLibraryModal } from './components/RecordingLibraryModal';
import { EventTimelineModal } from './components/EventTimelineModal';
import { SettingsModal } from './components/SettingsModal';
import { CodeExplorerModal } from './components/CodeExplorerModal';
import { ApkDownloadModal } from './components/ApkDownloadModal';

export default function App() {
  const [settings, setSettings] = useState<AppSettings>(loadSettings());
  const [currentRole, setCurrentRole] = useState<DeviceRole>(settings.deviceRole);
  const [zones, setZones] = useState<MotionZone[]>(loadZones());
  const [cameras, setCameras] = useState<CameraDevice[]>(loadCameras());
  const [recordings, setRecordings] = useState<RecordingItem[]>(loadRecordings());
  const [photos, setPhotos] = useState<PhotoItem[]>(loadPhotos());
  const [events, setEvents] = useState<MotionEventItem[]>(loadEvents());

  // Modal Dialog States
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(!settings.isOnboarded);
  const [isZonesOpen, setIsZonesOpen] = useState(false);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [isTimelineOpen, setIsTimelineOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCodeExplorerOpen, setIsCodeExplorerOpen] = useState(false);
  const [isApkModalOpen, setIsApkModalOpen] = useState(false);

  // Two-way Audio state
  const [isTwoWayAudioActive, setIsTwoWayAudioActive] = useState(false);

  // Sync to persistence
  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  useEffect(() => {
    saveZones(zones);
  }, [zones]);

  useEffect(() => {
    saveCameras(cameras);
  }, [cameras]);

  useEffect(() => {
    saveRecordings(recordings);
  }, [recordings]);

  useEffect(() => {
    savePhotos(photos);
  }, [photos]);

  useEffect(() => {
    saveEvents(events);
  }, [events]);

  // Handle Mode Change (Camera <-> Monitor)
  const handleRoleChange = (newRole: DeviceRole) => {
    setCurrentRole(newRole);
    setSettings((prev) => ({ ...prev, deviceRole: newRole }));
  };

  // Onboarding Complete Handler
  const handleCompleteOnboarding = (role: DeviceRole, cameraName: string) => {
    const updated = {
      ...settings,
      deviceRole: role,
      cameraName,
      isOnboarded: true,
    };
    setSettings(updated);
    setCurrentRole(role);
    setIsOnboardingOpen(false);
  };

  // Event & Recording creation handlers
  const handleNewEvent = (newEvent: MotionEventItem) => {
    setEvents((prev) => [newEvent, ...prev]);

    // If in monitor mode, update the camera state
    setCameras((prev) =>
      prev.map((cam) =>
        cam.id === newEvent.cameraId || cam.id === 'cam-1'
          ? {
              ...cam,
              motionDetected: true,
              lastMotionTimestamp: Date.now(),
              thumbnailUrl: newEvent.thumbnailUrl,
            }
          : cam
      )
    );

    // Reset motion indicator after 5 seconds
    setTimeout(() => {
      setCameras((prev) =>
        prev.map((cam) => (cam.id === newEvent.cameraId ? { ...cam, motionDetected: false } : cam))
      );
    }, 5000);
  };

  const handleNewRecording = (newRec: RecordingItem) => {
    setRecordings((prev) => {
      const updated = [newRec, ...prev];
      // Auto-purge check against quota limit
      const maxBytes = settings.storageLimitGb * 1024 * 1024 * 1024;
      let totalBytes = updated.reduce((acc, r) => acc + r.fileSizeBytes, 0);

      if (totalBytes > maxBytes) {
        // Find oldest unprotected recording and delete
        const unprotectedIndices = updated
          .map((r, i) => (!r.isProtected ? i : -1))
          .filter((i) => i !== -1);
        if (unprotectedIndices.length > 0) {
          const oldestIdx = unprotectedIndices[unprotectedIndices.length - 1];
          updated.splice(oldestIdx, 1);
        }
      }
      return updated;
    });
  };

  const handleNewPhoto = (newPhoto: PhotoItem) => {
    setPhotos((prev) => [newPhoto, ...prev]);
  };

  // Remote Commands from Monitor to Camera (Req 27 & 28)
  const handleRemoteCommand = (cameraId: string, command: string, params?: any) => {
    if (command === 'TAKE_PHOTO') {
      const targetCam = cameras.find((c) => c.id === cameraId);
      const newPhoto: PhotoItem = {
        id: `photo-remote-${Date.now()}`,
        cameraId,
        cameraName: targetCam ? targetCam.name : 'Security Camera',
        timestamp: Date.now(),
        photoUrl: (targetCam && targetCam.thumbnailUrl) ? targetCam.thumbnailUrl : 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600',
        isFavorite: false,
        hasTimestampOverlay: true,
      };
      handleNewPhoto(newPhoto);
    } else if (command === 'START_RECORDING') {
      setCameras((prev) =>
        prev.map((c) => (c.id === cameraId ? { ...c, isRecording: true } : c))
      );
    } else if (command === 'STOP_RECORDING') {
      setCameras((prev) =>
        prev.map((c) => (c.id === cameraId ? { ...c, isRecording: false } : c))
      );
      const targetCam = cameras.find((c) => c.id === cameraId);
      handleNewRecording({
        id: `rec-remote-${Date.now()}`,
        cameraId,
        cameraName: targetCam ? targetCam.name : 'Security Camera',
        startTime: Date.now() - 15000,
        durationSeconds: 15,
        fileSizeBytes: 18_400_000,
        thumbnailUrl: (targetCam && targetCam.thumbnailUrl) ? targetCam.thumbnailUrl : 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600',
        recordingType: 'MANUAL',
        isProtected: false,
        isFavorite: false,
      });
    } else if (command === 'CYCLE_SENSITIVITY') {
      setCameras((prev) =>
        prev.map((c) => {
          if (c.id !== cameraId) return c;
          const nextSens: Record<string, CameraDevice['sensitivity']> = {
            LOW: 'MEDIUM',
            MEDIUM: 'HIGH',
            HIGH: 'LOW',
          };
          return { ...c, sensitivity: nextSens[c.sensitivity] || 'MEDIUM' };
        })
      );
    } else if (command === 'RECONNECT') {
      setCameras((prev) =>
        prev.map((c) => (c.id === cameraId ? { ...c, isOnline: true, lastSeen: Date.now() } : c))
      );
    }
  };

  // Camera Management Handlers
  const handlePairCamera = (code: string, cameraName?: string) => {
    const cleanCode = code.replace(/\D/g, '');
    const existingIndex = cameras.findIndex(
      (c) => c.pairingCode === cleanCode || c.id === `cam-${cleanCode}`
    );

    const pairedCam: CameraDevice = {
      id: `cam-${cleanCode}`,
      name: cameraName || `Paired Phone (${cleanCode.slice(0, 3)} ${cleanCode.slice(3)})`,
      isOnline: true,
      batteryPercent: 92,
      isCharging: true,
      storageUsedMb: 350,
      networkStatus: 'Wi-Fi (5 GHz)',
      lastSeen: Date.now(),
      thumbnailUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=600&q=80',
      motionDetected: false,
      isRecording: false,
      lens: 'BACK',
      resolution: '1080p',
      sensitivity: 'MEDIUM',
      isLiveP2P: true,
      pairingCode: cleanCode,
    };

    if (existingIndex >= 0) {
      setCameras((prev) => {
        const updated = [...prev];
        updated[existingIndex] = { ...updated[existingIndex], ...pairedCam };
        return updated;
      });
    } else {
      // Put paired camera at the very top
      setCameras((prev) => [pairedCam, ...prev]);
    }
  };

  // Check URL query parameters on load for instant QR pairing (e.g. ?pair=489204&role=MONITOR)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const pairParam = params.get('pair');
      const roleParam = params.get('role');
      if (pairParam) {
        handlePairCamera(pairParam, 'Scanned Camera Phone');
        if (roleParam === 'MONITOR' || roleParam === 'monitor' || !roleParam) {
          setCurrentRole('MONITOR');
        }
      }
    }
  }, []);

  const handleAddCamera = () => {
    const newId = `cam-${Date.now().toString().slice(-4)}`;
    const newCam: CameraDevice = {
      id: newId,
      name: `Security Camera ${cameras.length + 1}`,
      isOnline: true,
      batteryPercent: 94,
      isCharging: true,
      storageUsedMb: 1200,
      networkStatus: 'Wi-Fi (5 GHz)',
      lastSeen: Date.now(),
      thumbnailUrl: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=600&q=80',
      motionDetected: false,
      isRecording: false,
      lens: 'BACK',
      resolution: '1080p',
      sensitivity: 'MEDIUM',
      isLiveP2P: false,
    };
    setCameras((prev) => [...prev, newCam]);
  };

  const handleRemoveCamera = (cameraId: string) => {
    setCameras((prev) => prev.filter((c) => c.id !== cameraId));
  };

  const handleRenameCamera = (cameraId: string, newName: string) => {
    setCameras((prev) =>
      prev.map((c) => (c.id === cameraId ? { ...c, name: newName } : c))
    );
  };

  // Recording Management Handlers
  const handleToggleProtect = (id: string) => {
    setRecordings((prev) =>
      prev.map((r) => (r.id === id ? { ...r, isProtected: !r.isProtected } : r))
    );
  };

  const handleToggleFavorite = (id: string) => {
    setRecordings((prev) =>
      prev.map((r) => (r.id === id ? { ...r, isFavorite: !r.isFavorite } : r))
    );
  };

  const handleDeleteRecording = (id: string) => {
    setRecordings((prev) => prev.filter((r) => r.id !== id));
  };

  const handleDeletePhoto = (id: string) => {
    setPhotos((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-black">
      {/* 1. Global Navigation & Mode Switcher Bar */}
      <Header
        currentRole={currentRole}
        onRoleChange={handleRoleChange}
        onOpenLibrary={() => setIsLibraryOpen(true)}
        onOpenTimeline={() => setIsTimelineOpen(true)}
        onOpenZones={() => setIsZonesOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenCodeExplorer={() => setIsCodeExplorerOpen(true)}
        onOpenApkModal={() => setIsApkModalOpen(true)}
        onToggleTestMode={() => {}}
        isTestModeOpen={false}
      />

      {/* 2. Primary Operating Mode View */}
      <main className="flex-1 pb-8">
        {currentRole === 'CAMERA' ? (
          <CameraModeView
            settings={settings}
            zones={zones}
            onNewEvent={handleNewEvent}
            onNewRecording={handleNewRecording}
            onNewPhoto={handleNewPhoto}
            onOpenZones={() => setIsZonesOpen(true)}
            onOpenSettings={() => setIsSettingsOpen(true)}
            isTwoWayAudioActive={isTwoWayAudioActive}
          />
        ) : (
          <MonitorModeView
            cameras={cameras}
            onSelectCamera={() => {}}
            onAddCamera={handleAddCamera}
            onPairCamera={handlePairCamera}
            onRemoveCamera={handleRemoveCamera}
            onRenameCamera={handleRenameCamera}
            onRemoteCommand={handleRemoteCommand}
            onOpenLibrary={() => setIsLibraryOpen(true)}
            onOpenTimeline={() => setIsTimelineOpen(true)}
            isTwoWayAudioActive={isTwoWayAudioActive}
            setIsTwoWayAudioActive={setIsTwoWayAudioActive}
          />
        )}
      </main>

      {/* 3. Modals & Dialogs */}
      <OnboardingModal
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
        onCompleteSetup={(role, update) =>
          handleCompleteOnboarding(role, update?.cameraName || settings.cameraName)
        }
      />

      <MotionZoneEditorModal
        isOpen={isZonesOpen}
        onClose={() => setIsZonesOpen(false)}
        zones={zones}
        onSaveZones={(updated) => setZones(updated)}
      />

      <RecordingLibraryModal
        isOpen={isLibraryOpen}
        onClose={() => setIsLibraryOpen(false)}
        recordings={recordings}
        photos={photos}
        events={events}
        onToggleProtect={handleToggleProtect}
        onToggleFavorite={handleToggleFavorite}
        onDeleteRecording={handleDeleteRecording}
        onDeletePhoto={handleDeletePhoto}
        storageLimitGb={settings.storageLimitGb}
      />

      <EventTimelineModal
        isOpen={isTimelineOpen}
        onClose={() => setIsTimelineOpen(false)}
        events={events}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSaveSettings={(newSettings) => setSettings(newSettings)}
        onChangeRole={handleRoleChange}
      />

      <CodeExplorerModal
        isOpen={isCodeExplorerOpen}
        onClose={() => setIsCodeExplorerOpen(false)}
        onOpenApkModal={() => setIsApkModalOpen(true)}
      />

      <ApkDownloadModal
        isOpen={isApkModalOpen}
        onClose={() => setIsApkModalOpen(false)}
        onOpenCodeExplorer={() => setIsCodeExplorerOpen(true)}
      />
    </div>
  );
}
