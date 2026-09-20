import React, { useState } from 'react';
import {
  X,
  Play,
  Pause,
  Download,
  Trash2,
  Star,
  Shield,
  ShieldCheck,
  Edit2,
  HardDrive,
  Clock,
  Filter,
  Check,
} from 'lucide-react';
import { RecordingItem, PhotoItem, MotionEventItem } from '../types';

interface RecordingLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  recordings: RecordingItem[];
  photos: PhotoItem[];
  events: MotionEventItem[];
  onToggleProtect: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onDeleteRecording: (id: string) => void;
  onDeletePhoto: (id: string) => void;
  storageLimitGb: number;
}

export const RecordingLibraryModal: React.FC<RecordingLibraryModalProps> = ({
  isOpen,
  onClose,
  recordings,
  photos,
  events,
  onToggleProtect,
  onToggleFavorite,
  onDeleteRecording,
  onDeletePhoto,
  storageLimitGb,
}) => {
  const [activeTab, setActiveTab] = useState<'RECORDINGS' | 'PHOTOS' | 'MOTION_EVENTS' | 'FAVORITES'>('RECORDINGS');
  const [playingRecording, setPlayingRecording] = useState<RecordingItem | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoItem | null>(null);

  if (!isOpen) return null;

  // Calculate storage numbers
  const recordingBytes = recordings.reduce((acc, r) => acc + r.fileSizeBytes, 0);
  const photoBytes = photos.length * 1_200_000;
  const totalUsedBytes = recordingBytes + photoBytes;
  const maxStorageBytes = storageLimitGb * 1024 * 1024 * 1024;
  const usedPercent = Math.min((totalUsedBytes / maxStorageBytes) * 100, 100);

  const formatBytes = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  const favoriteRecordings = recordings.filter((r) => r.isFavorite);
  const favoritePhotos = photos.filter((p) => p.isFavorite);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-800 bg-neutral-950 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-white">Media & Security Library</h3>
            <p className="text-xs text-neutral-400">
              Encrypted event recordings, photos, and auto-purging storage manager
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Storage Quota Progress Bar (Req 23) */}
        <div className="px-6 py-3 bg-neutral-950/60 border-b border-neutral-800 text-xs">
          <div className="flex items-center justify-between mb-1.5 text-neutral-300">
            <span className="flex items-center gap-1.5 font-medium">
              <HardDrive className="w-3.5 h-3.5 text-blue-400" />
              <span>Storage Quota: {formatBytes(totalUsedBytes)} used of {storageLimitGb} GB</span>
            </span>
            <span className="text-neutral-400 font-mono">
              {recordings.filter((r) => r.isProtected).length} files protected
            </span>
          </div>
          <div className="w-full h-2 bg-neutral-800 rounded-full overflow-hidden flex">
            <div
              style={{ width: `${usedPercent}%` }}
              className={`h-full transition-all ${
                usedPercent > 85 ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
            />
          </div>
          <div className="flex justify-between text-[11px] text-neutral-500 mt-1">
            <span>Videos: {formatBytes(recordingBytes)}</span>
            <span>Photos: {formatBytes(photoBytes)}</span>
            <span>Auto-Purge Oldest Unprotected: Active</span>
          </div>
        </div>

        {/* Navigation Tabs (Req 24) */}
        <div className="flex px-6 border-b border-neutral-800 bg-neutral-900 gap-2">
          {(
            [
              { key: 'RECORDINGS', label: `Recordings (${recordings.length})` },
              { key: 'PHOTOS', label: `Photos (${photos.length})` },
              { key: 'MOTION_EVENTS', label: `Events (${events.length})` },
              { key: 'FAVORITES', label: `Favorites (${favoriteRecordings.length + favoritePhotos.length})` },
            ] as const
          ).map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`py-3 px-3 border-b-2 text-xs font-semibold transition-all ${
                activeTab === t.key
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-neutral-400 hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* TAB 1: RECORDINGS */}
          {activeTab === 'RECORDINGS' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recordings.map((item) => (
                <div
                  key={item.id}
                  className="bg-neutral-950 border border-neutral-800 rounded-xl overflow-hidden flex flex-col justify-between"
                >
                  <div className="relative aspect-video bg-black group">
                    <img
                      src={item.thumbnailUrl && item.thumbnailUrl.trim() ? item.thumbnailUrl : 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600'}
                      alt={item.cameraName}
                      className="w-full h-full object-cover opacity-85"
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => {
                          setPlayingRecording(item);
                          setIsPlaying(true);
                        }}
                        className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
                      >
                        <Play className="w-5 h-5 ml-0.5 fill-current" />
                      </button>
                    </div>

                    <div className="absolute top-2 left-2 flex gap-1">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-black/70 text-emerald-400">
                        {item.recordingType}
                      </span>
                    </div>

                    <div className="absolute bottom-2 right-2 text-[11px] font-mono bg-black/70 px-2 py-0.5 rounded text-neutral-200">
                      {item.durationSeconds}s
                    </div>
                  </div>

                  <div className="p-3.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-xs text-white">{item.cameraName}</h4>
                      <span className="text-[11px] font-mono text-neutral-400">
                        {formatBytes(item.fileSizeBytes)}
                      </span>
                    </div>

                    <div className="text-[11px] text-neutral-400">
                      {new Date(item.startTime).toLocaleString()}
                    </div>

                    {/* Action buttons: Play, Protect, Favorite, Download, Delete */}
                    <div className="flex items-center justify-between pt-2 border-t border-neutral-800/80">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => onToggleProtect(item.id)}
                          title={item.isProtected ? 'Protected from auto-purge' : 'Mark Protected'}
                          className={`p-1.5 rounded-lg transition-colors ${
                            item.isProtected
                              ? 'text-emerald-400 bg-emerald-950/60'
                              : 'text-neutral-500 hover:text-neutral-300'
                          }`}
                        >
                          <ShieldCheck className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => onToggleFavorite(item.id)}
                          title="Favorite"
                          className={`p-1.5 rounded-lg transition-colors ${
                            item.isFavorite
                              ? 'text-amber-400 bg-amber-950/60'
                              : 'text-neutral-500 hover:text-neutral-300'
                          }`}
                        >
                          <Star className="w-4 h-4 fill-current" />
                        </button>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            const a = document.createElement('a');
                            a.href = item.thumbnailUrl;
                            a.download = `SecureCam_${item.id}.jpg`;
                            a.click();
                          }}
                          className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800"
                          title="Download"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDeleteRecording(item.id)}
                          disabled={item.isProtected}
                          className="p-1.5 rounded-lg text-neutral-400 hover:text-red-400 hover:bg-neutral-800 disabled:opacity-30"
                          title={item.isProtected ? 'Protected' : 'Delete'}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 2: PHOTOS */}
          {activeTab === 'PHOTOS' && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {photos.map((photo) => (
                <div
                  key={photo.id}
                  className="bg-neutral-950 border border-neutral-800 rounded-xl overflow-hidden group"
                >
                  <div
                    onClick={() => setSelectedPhoto(photo)}
                    className="relative aspect-square bg-black cursor-pointer overflow-hidden"
                  >
                    <img
                      src={photo.photoUrl && photo.photoUrl.trim() ? photo.photoUrl : 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600'}
                      alt={photo.cameraName}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>
                  <div className="p-2.5 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-neutral-200 text-[11px] truncate">
                        {photo.cameraName}
                      </div>
                      <div className="text-[10px] text-neutral-400">
                        {new Date(photo.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    <button
                      onClick={() => onDeletePhoto(photo.id)}
                      className="text-neutral-500 hover:text-red-400 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 3: MOTION EVENTS */}
          {activeTab === 'MOTION_EVENTS' && (
            <div className="space-y-3">
              {events.map((evt) => (
                <div
                  key={evt.id}
                  className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={evt.thumbnailUrl && evt.thumbnailUrl.trim() ? evt.thumbnailUrl : 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600'}
                      alt="Event thumbnail"
                      className="w-16 h-12 object-cover rounded-lg bg-black"
                    />
                    <div>
                      <h4 className="font-bold text-xs text-white">{evt.cameraName}</h4>
                      <p className="text-[11px] text-neutral-400">
                        Zone: <span className="text-emerald-400 font-semibold">{evt.zoneName}</span> • Duration: {evt.durationSeconds}s
                      </p>
                    </div>
                  </div>
                  <div className="text-right text-[11px] font-mono text-neutral-400">
                    {new Date(evt.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 4: FAVORITES */}
          {activeTab === 'FAVORITES' && (
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-neutral-300 uppercase tracking-wider">
                Starred Security Recordings ({favoriteRecordings.length})
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {favoriteRecordings.map((rec) => (
                  <div
                    key={rec.id}
                    className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={rec.thumbnailUrl && rec.thumbnailUrl.trim() ? rec.thumbnailUrl : 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600'}
                        alt="thumb"
                        className="w-16 h-12 object-cover rounded-lg"
                      />
                      <div>
                        <div className="font-bold text-xs text-white">{rec.cameraName}</div>
                        <div className="text-[11px] text-neutral-400">
                          {new Date(rec.startTime).toLocaleTimeString()} • {rec.durationSeconds}s
                        </div>
                      </div>
                    </div>
                    <Star className="w-4 h-4 text-amber-400 fill-current" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Video Player Overlay Simulation (Media3 / ExoPlayer player mockup) */}
        {playingRecording && (
          <div className="fixed inset-0 z-60 bg-black/95 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-3xl bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl">
              <div className="px-4 py-3 bg-neutral-950 flex items-center justify-between border-b border-neutral-800">
                <div className="flex items-center gap-2">
                  <Play className="w-4 h-4 text-blue-400 fill-current" />
                  <span className="font-bold text-xs text-white">
                    {playingRecording.cameraName} — Motion Recording ({playingRecording.durationSeconds}s)
                  </span>
                </div>
                <button
                  onClick={() => setPlayingRecording(null)}
                  className="p-1 rounded text-neutral-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="relative aspect-video bg-black flex items-center justify-center">
                <img
                  src={playingRecording.thumbnailUrl && playingRecording.thumbnailUrl.trim() ? playingRecording.thumbnailUrl : 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600'}
                  alt="Playback"
                  className="w-full h-full object-cover opacity-90"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="w-16 h-16 rounded-full bg-blue-600/90 text-white flex items-center justify-center hover:scale-105 transition-transform"
                  >
                    {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 ml-1 fill-current" />}
                  </button>
                </div>
              </div>

              {/* Player scrub bar */}
              <div className="p-4 bg-neutral-950 space-y-2">
                <div className="w-full h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                  <div className="w-1/3 h-full bg-blue-500 rounded-full" />
                </div>
                <div className="flex items-center justify-between text-xs font-mono text-neutral-400">
                  <span>00:12</span>
                  <span>00:{String(playingRecording.durationSeconds).padStart(2, '0')}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
