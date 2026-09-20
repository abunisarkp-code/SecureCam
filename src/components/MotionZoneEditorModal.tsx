import React, { useState, useRef } from 'react';
import { X, Plus, Trash2, Check, Eye, EyeOff, ShieldAlert, Sliders } from 'lucide-react';
import { MotionZone } from '../types';

interface MotionZoneEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  zones: MotionZone[];
  onSaveZones: (zones: MotionZone[]) => void;
  previewImageUrl?: string;
}

export const MotionZoneEditorModal: React.FC<MotionZoneEditorModalProps> = ({
  isOpen,
  onClose,
  zones,
  onSaveZones,
  previewImageUrl = 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=900',
}) => {
  const [localZones, setLocalZones] = useState<MotionZone[]>(zones);
  const [activeZoneId, setActiveZoneId] = useState<string | null>(zones[0]?.id || null);
  const containerRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const handleAddZone = () => {
    const newZone: MotionZone = {
      id: `zone-${Date.now()}`,
      name: `Detection Zone ${localZones.length + 1}`,
      isEnabled: true,
      xPercent: 20 + localZones.length * 5,
      yPercent: 20 + localZones.length * 5,
      widthPercent: 35,
      heightPercent: 40,
      sensitivity: 'MEDIUM',
    };
    const updated = [...localZones, newZone];
    setLocalZones(updated);
    setActiveZoneId(newZone.id);
  };

  const handleRemoveZone = (id: string) => {
    const updated = localZones.filter((z) => z.id !== id);
    setLocalZones(updated);
    if (activeZoneId === id) {
      setActiveZoneId(updated[0]?.id || null);
    }
  };

  const handleToggleEnable = (id: string) => {
    setLocalZones((prev) =>
      prev.map((z) => (z.id === id ? { ...z, isEnabled: !z.isEnabled } : z))
    );
  };

  const handleUpdateZoneName = (id: string, name: string) => {
    setLocalZones((prev) =>
      prev.map((z) => (z.id === id ? { ...z, name } : z))
    );
  };

  const handleUpdateSensitivity = (id: string, sensitivity: MotionZone['sensitivity']) => {
    setLocalZones((prev) =>
      prev.map((z) => (z.id === id ? { ...z, sensitivity } : z))
    );
  };

  const handleSaveAndClose = () => {
    onSaveZones(localZones);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-950">
          <div>
            <h3 className="text-base font-bold text-white">Visual Motion Detection Zones</h3>
            <p className="text-xs text-neutral-400">
              Configure detection zones (e.g. Doorway enabled, TV/curtain area ignored).
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Interactive Visual Canvas Area */}
          <div
            ref={containerRef}
            className="relative aspect-video bg-black rounded-xl overflow-hidden border border-neutral-800 shadow-inner select-none"
          >
            <img
              src={previewImageUrl && previewImageUrl.trim() ? previewImageUrl : 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=900'}
              alt="Camera preview"
              className="w-full h-full object-cover pointer-events-none opacity-80"
            />

            {/* Render Rectangular Zones Over Canvas */}
            {localZones.map((zone) => {
              const isActive = zone.id === activeZoneId;
              return (
                <div
                  key={zone.id}
                  onClick={() => setActiveZoneId(zone.id)}
                  style={{
                    left: `${zone.xPercent}%`,
                    top: `${zone.yPercent}%`,
                    width: `${zone.widthPercent}%`,
                    height: `${zone.heightPercent}%`,
                  }}
                  className={`absolute rounded-lg border-2 cursor-pointer transition-all flex flex-col justify-between p-2 ${
                    !zone.isEnabled
                      ? 'border-neutral-500/50 bg-neutral-950/60 opacity-50'
                      : isActive
                      ? 'border-emerald-400 bg-emerald-500/20 shadow-lg ring-2 ring-emerald-400/40'
                      : 'border-emerald-600/70 bg-emerald-600/10 hover:bg-emerald-600/20'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-black/80 text-emerald-300">
                      {zone.name}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/60 font-mono text-neutral-300">
                      {zone.sensitivity}
                    </span>
                  </div>

                  <span className="text-[10px] text-neutral-400 bg-black/70 px-1.5 py-0.5 rounded w-fit self-end">
                    {zone.isEnabled ? 'ACTIVE ZONE' : 'IGNORED'}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Zones Management List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-neutral-200">
                Configured Zones ({localZones.length})
              </h4>
              <button
                onClick={handleAddZone}
                className="py-1.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add Detection Zone</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {localZones.map((zone) => {
                const isSelected = zone.id === activeZoneId;
                return (
                  <div
                    key={zone.id}
                    onClick={() => setActiveZoneId(zone.id)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-neutral-800 border-emerald-500'
                        : 'bg-neutral-950/60 border-neutral-800 hover:border-neutral-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <input
                        type="text"
                        value={zone.name}
                        onChange={(e) => handleUpdateZoneName(zone.id, e.target.value)}
                        className="bg-transparent font-bold text-xs text-white border-b border-transparent focus:border-emerald-500 focus:outline-none"
                      />
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleEnable(zone.id);
                          }}
                          className={`p-1.5 rounded-lg ${
                            zone.isEnabled
                              ? 'text-emerald-400 hover:bg-emerald-950'
                              : 'text-neutral-500 hover:bg-neutral-800'
                          }`}
                          title={zone.isEnabled ? 'Disable Zone' : 'Enable Zone'}
                        >
                          {zone.isEnabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveZone(zone.id);
                          }}
                          className="p-1.5 text-neutral-500 hover:text-red-400 rounded-lg hover:bg-neutral-800"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-neutral-800/80 text-xs">
                      <span className="text-neutral-400">Sensitivity:</span>
                      <div className="flex items-center gap-1">
                        {(['LOW', 'MEDIUM', 'HIGH'] as const).map((s) => (
                          <button
                            key={s}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUpdateSensitivity(zone.id, s);
                            }}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              zone.sensitivity === s
                                ? 'bg-emerald-600 text-white'
                                : 'bg-neutral-800 text-neutral-400 hover:text-white'
                            }`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-neutral-800 bg-neutral-950 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="py-2 px-4 rounded-xl text-xs font-semibold text-neutral-400 hover:text-white hover:bg-neutral-800"
          >
            Cancel
          </button>
          <button
            onClick={handleSaveAndClose}
            className="py-2 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm"
          >
            <Check className="w-4 h-4" />
            <span>Save Detection Zones</span>
          </button>
        </div>
      </div>
    </div>
  );
};
