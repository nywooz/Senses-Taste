import React from 'react';
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Globe2,
  Layers,
  Map as MapIcon,
  Pause,
  Play,
} from 'lucide-react';
import { TASTE_META, TASTE_ORDER } from '../data/culinaryData';
import {
  GoogleMapStyle,
  LayerVisibility,
  MapEngine,
  TasteFilter,
} from '../types/culinary';

interface BottomControlDockProps {
  mapEngine: MapEngine;
  googleMapStyle: GoogleMapStyle;
  activeTaste: TasteFilter;
  tasteCounts: Record<TasteFilter, number>;
  layers: LayerVisibility;
  presenterMode: boolean;
  presenterProgress: number; // 0..100
  currentIndex: number;
  totalFiltered: number;
  isHudHidden: boolean;
  onChangeMapEngine: (engine: MapEngine) => void;
  onChangeGoogleMapStyle: (style: GoogleMapStyle) => void;
  onSelectTaste: (taste: TasteFilter) => void;
  onToggleLayer: (layer: keyof LayerVisibility) => void;
  onTogglePresenter: () => void;
  onPrevDish: () => void;
  onNextDish: () => void;
  onToggleHud: () => void;
}

export const BottomControlDock: React.FC<BottomControlDockProps> = ({
  mapEngine,
  googleMapStyle,
  activeTaste,
  tasteCounts,
  layers,
  presenterMode,
  presenterProgress,
  currentIndex,
  totalFiltered,
  isHudHidden,
  onChangeMapEngine,
  onChangeGoogleMapStyle,
  onSelectTaste,
  onToggleLayer,
  onTogglePresenter,
  onPrevDish,
  onNextDish,
  onToggleHud,
}) => {
  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center w-auto max-w-[min(1040px,95vw)] pointer-events-none">
      {/* Collapse / Expand Cinema Toggle Tab */}
      <button
        type="button"
        onClick={onToggleHud}
        className="pointer-events-auto mb-1.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-[#121822] border border-white/12 text-[11px] font-medium text-[#C7D0DC] hover:text-[#F4F1EA] hover:border-white/25 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        aria-expanded={!isHudHidden}
      >
        {isHudHidden ? (
          <>
            <ChevronUp className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Show Controls</span>
          </>
        ) : (
          <>
            <ChevronDown className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Hide Controls</span>
          </>
        )}
      </button>

      {/* Main Dock Container */}
      <div
        className={`pointer-events-auto w-full bg-[#121822] border border-white/12 rounded-xl shadow-2xl transition-all duration-200 overflow-hidden ${
          isHudHidden
            ? 'opacity-0 translate-y-6 pointer-events-none max-h-0 border-0'
            : 'opacity-100 translate-y-0 max-h-[320px]'
        }`}
      >
        {/* Presenter Progress Line */}
        {presenterMode && (
          <div className="w-full h-0.5 bg-white/8">
            <div
              className="h-full bg-[#D99B26] transition-[width] duration-150 ease-linear"
              style={{ width: `${presenterProgress}%` }}
            />
          </div>
        )}

        <div className="p-2.5 sm:px-4 sm:py-3 flex flex-col gap-2.5">
          {/* Row 1: Taste Filters + Map Engine Switcher */}
          <div className="flex flex-col lg:flex-row items-center justify-between gap-2.5">
            {/* Taste Category Segmented Filters */}
            <div
              role="group"
              aria-label="Filter culinary specialties by taste profile"
              className="flex items-center gap-1 p-1 bg-[#0A0E14] rounded-lg border border-white/8 overflow-x-auto max-w-full"
            >
              <button
                type="button"
                onClick={() => onSelectTaste('all')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                  activeTaste === 'all'
                    ? 'bg-[#1F2937] text-[#F4F1EA]'
                    : 'text-[#9AA5B4] hover:text-[#F4F1EA]'
                }`}
              >
                All ({tasteCounts.all})
              </button>

              {TASTE_ORDER.map((taste) => {
                const meta = TASTE_META[taste];
                const active = activeTaste === taste;
                return (
                  <button
                    key={taste}
                    type="button"
                    onClick={() => onSelectTaste(taste)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                      active
                        ? 'bg-[#1F2937] text-[#F4F1EA]'
                        : 'text-[#9AA5B4] hover:text-[#F4F1EA]'
                    }`}
                  >
                    <span
                      className="inline-block w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: meta.color }}
                      aria-hidden="true"
                    />
                    <span>{meta.shortLabel}</span>
                    <span className="text-[11px] text-[#7D8898] tabular-nums">
                      {tasteCounts[taste]}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Map Engine Switcher: Google Maps vs 3D Globe */}
            <div className="flex items-center gap-2 shrink-0">
              <div
                role="group"
                aria-label="Select map engine"
                className="flex items-center gap-1 p-1 bg-[#0A0E14] rounded-lg border border-white/8"
              >
                <button
                  type="button"
                  onClick={() => onChangeMapEngine('google')}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                    mapEngine === 'google'
                      ? 'bg-[#1F2937] text-[#F4F1EA]'
                      : 'text-[#9AA5B4] hover:text-[#F4F1EA]'
                  }`}
                >
                  <MapIcon className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Google Maps</span>
                </button>
                <button
                  type="button"
                  onClick={() => onChangeMapEngine('globe')}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                    mapEngine === 'globe'
                      ? 'bg-[#1F2937] text-[#F4F1EA]'
                      : 'text-[#9AA5B4] hover:text-[#F4F1EA]'
                  }`}
                >
                  <Globe2 className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>3D Globe</span>
                </button>
              </div>
            </div>
          </div>

          {/* Row 2: Spatial Layers, Base Style, and Presenter Transport */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-white/8">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Spatial Layers */}
              <div
                role="group"
                aria-label="Toggle map data layers"
                className="flex items-center gap-1.5"
              >
                <Layers
                  className="w-3.5 h-3.5 text-[#7D8898] shrink-0 hidden sm:block"
                  aria-hidden="true"
                />
                {(
                  [
                    { key: 'columns', label: 'Columns' },
                    { key: 'arcs', label: 'Arcs' },
                    { key: 'aroma', label: 'Aroma' },
                    ...(mapEngine === 'globe'
                      ? [{ key: 'borders' as const, label: 'Borders' }]
                      : []),
                  ] as { key: keyof LayerVisibility; label: string }[]
                ).map((item) => {
                  const enabled = layers[item.key];
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => onToggleLayer(item.key)}
                      aria-pressed={enabled}
                      className={`px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer border ${
                        enabled
                          ? 'bg-[#1C2533] text-[#F4F1EA] border-white/18'
                          : 'bg-transparent text-[#7D8898] border-transparent hover:text-[#C7D0DC]'
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>

              {/* Google Maps Base Layer Switcher */}
              {mapEngine === 'google' && (
                <div
                  role="group"
                  aria-label="Google Maps base layer"
                  className="flex items-center gap-1 pl-2.5 border-l border-white/10"
                >
                  {(
                    [
                      { id: 'roadmap', label: 'Vector Dark' },
                      { id: 'hybrid', label: 'Satellite' },
                      { id: 'terrain', label: 'Terrain' },
                    ] as { id: GoogleMapStyle; label: string }[]
                  ).map((styleOpt) => (
                    <button
                      key={styleOpt.id}
                      type="button"
                      onClick={() => onChangeGoogleMapStyle(styleOpt.id)}
                      className={`px-2 py-1 rounded-md text-xs font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                        googleMapStyle === styleOpt.id
                          ? 'bg-[#1F2937] text-[#D99B26]'
                          : 'text-[#7D8898] hover:text-[#C7D0DC]'
                      }`}
                    >
                      {styleOpt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Presenter Transport Controls */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={onPrevDish}
                aria-label="Previous dish hotspot"
                className="p-1.5 rounded-md bg-[#18202C] border border-white/10 text-[#C7D0DC] hover:text-[#F4F1EA] hover:border-white/25 transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" aria-hidden="true" />
              </button>

              <button
                type="button"
                onClick={onTogglePresenter}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                  presenterMode
                    ? 'bg-[#D99B26] text-[#0A0E14]'
                    : 'bg-[#18202C] border border-white/12 text-[#F4F1EA] hover:border-white/25'
                }`}
              >
                {presenterMode ? (
                  <>
                    <Pause className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Touring</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Tour</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={onNextDish}
                aria-label="Next dish hotspot"
                className="p-1.5 rounded-md bg-[#18202C] border border-white/10 text-[#C7D0DC] hover:text-[#F4F1EA] hover:border-white/25 transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" aria-hidden="true" />
              </button>

              <span className="ml-1 text-[11px] font-mono text-[#9AA5B4] tabular-nums whitespace-nowrap">
                {currentIndex >= 0
                  ? `${String(currentIndex + 1).padStart(2, '0')}/${String(
                      totalFiltered
                    ).padStart(2, '0')}`
                  : `--/${String(totalFiltered).padStart(2, '0')}`}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
