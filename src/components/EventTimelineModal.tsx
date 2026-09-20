import React, { useState } from 'react';
import { X, Clock, Filter, Camera, ShieldAlert, Video, CheckCircle2, ChevronRight } from 'lucide-react';
import { MotionEventItem } from '../types';

interface EventTimelineModalProps {
  isOpen: boolean;
  onClose: () => void;
  events: MotionEventItem[];
}

export const EventTimelineModal: React.FC<EventTimelineModalProps> = ({
  isOpen,
  onClose,
  events,
}) => {
  const [selectedCameraFilter, setSelectedCameraFilter] = useState<string>('ALL');

  if (!isOpen) return null;

  const cameras = Array.from(new Set(events.map((e) => e.cameraName)));
  const filteredEvents =
    selectedCameraFilter === 'ALL'
      ? events
      : events.filter((e) => e.cameraName === selectedCameraFilter);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-800 bg-neutral-950 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="text-base font-bold text-white">Motion Event Timeline</h3>
              <p className="text-xs text-neutral-400">
                Detailed chronological sequence of security triggers and captures
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Controls */}
        <div className="px-6 py-3 bg-neutral-950/60 border-b border-neutral-800 flex items-center gap-3 text-xs">
          <Filter className="w-3.5 h-3.5 text-neutral-400" />
          <span className="text-neutral-400">Filter Camera:</span>
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setSelectedCameraFilter('ALL')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                selectedCameraFilter === 'ALL'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-neutral-800 text-neutral-300 hover:text-white'
              }`}
            >
              All Cameras
            </button>
            {cameras.map((cam) => (
              <button
                key={cam}
                onClick={() => setSelectedCameraFilter(cam)}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                  selectedCameraFilter === cam
                    ? 'bg-emerald-600 text-white'
                    : 'bg-neutral-800 text-neutral-300 hover:text-white'
                }`}
              >
                {cam}
              </button>
            ))}
          </div>
        </div>

        {/* Timeline Sequence List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {filteredEvents.map((evt) => {
            const date = new Date(evt.timestamp);
            const timeStr = date.toLocaleTimeString();

            return (
              <div
                key={evt.id}
                className="bg-neutral-950 border border-neutral-800 rounded-xl p-4 space-y-4"
              >
                {/* Event header card */}
                <div className="flex items-center justify-between border-b border-neutral-800/80 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
                    <span className="font-bold text-sm text-white">{evt.cameraName}</span>
                    <span className="text-xs text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded font-mono">
                      Zone: {evt.zoneName}
                    </span>
                  </div>
                  <span className="text-xs font-mono text-neutral-400">{timeStr}</span>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 items-start">
                  <img
                    src={evt.thumbnailUrl && evt.thumbnailUrl.trim() ? evt.thumbnailUrl : 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600'}
                    alt="Event thumbnail"
                    className="w-full sm:w-44 aspect-video object-cover rounded-lg bg-black border border-neutral-800"
                  />

                  {/* Step-by-step event milestones sequence (Req 25) */}
                  <div className="flex-1 space-y-2 text-xs font-mono">
                    <div className="flex items-center gap-2 text-amber-400">
                      <ShieldAlert className="w-3.5 h-3.5" />
                      <span>{timeStr} — Motion detected in [{evt.zoneName}]</span>
                    </div>

                    <div className="flex items-center gap-2 text-emerald-400">
                      <Camera className="w-3.5 h-3.5" />
                      <span>{timeStr} (+1s) — Photo snapshot captured</span>
                    </div>

                    <div className="flex items-center gap-2 text-blue-400">
                      <Video className="w-3.5 h-3.5" />
                      <span>{timeStr} (+1s) — Video recording started (10s pre-buffer appended)</span>
                    </div>

                    <div className="flex items-center gap-2 text-neutral-400">
                      <CheckCircle2 className="w-3.5 h-3.5 text-neutral-500" />
                      <span>
                        {timeStr} (+{evt.durationSeconds}s) — Motion stopped
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-emerald-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      <span>
                        {timeStr} (+{evt.durationSeconds + 10}s) — Post-motion buffer saved to storage
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="px-6 py-3 border-t border-neutral-800 bg-neutral-950 flex justify-end">
          <button
            onClick={onClose}
            className="py-2 px-4 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
