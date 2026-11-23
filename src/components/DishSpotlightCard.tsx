import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, MapPin, Utensils, X } from 'lucide-react';
import { TASTE_META, TASTE_ORDER } from '../data/culinaryData';
import { CulinaryDish } from '../types/culinary';
import { FlavorRadar } from './FlavorRadar';

interface DishSpotlightCardProps {
  dish: CulinaryDish;
  presenterMode: boolean;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  onSelectRelated: (dishId: string) => void;
  relatedDishes: CulinaryDish[];
}

function formatCoord(val: number, posLabel: string, negLabel: string): string {
  const dir = val >= 0 ? posLabel : negLabel;
  return `${Math.abs(val).toFixed(2)}° ${dir}`;
}

export const DishSpotlightCard: React.FC<DishSpotlightCardProps> = ({
  dish,
  presenterMode,
  onClose,
  onPrev,
  onNext,
  onSelectRelated,
  relatedDishes,
}) => {
  const [imgFailed, setImgFailed] = useState(false);
  const tasteMeta = TASTE_META[dish.primaryTaste];
  const secondaryMeta = TASTE_META[dish.secondaryTaste];

  return (
    <aside
      aria-label={`Dish details for ${dish.name}`}
      className="fixed right-4 top-[72px] bottom-24 z-20 w-[calc(100vw-2rem)] sm:w-[376px] bg-[#121822] border border-white/12 rounded-xl shadow-2xl flex flex-col overflow-hidden"
    >
      {/* Header Plate Photography + Measured Scrim */}
      <div className="relative h-40 shrink-0 bg-[#18202C] overflow-hidden">
        {!imgFailed ? (
          <img
            src={tasteMeta.imagePath}
            alt={`${tasteMeta.label} culinary presentation`}
            referrerPolicy="no-referrer"
            onError={() => setImgFailed(true)}
            className="w-full h-full object-cover"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{
              background: `radial-gradient(circle at 30% 30%, ${tasteMeta.color}33, #121822 75%)`,
            }}
          >
            <Utensils className="w-8 h-8 text-[#9AA5B4]" aria-hidden="true" />
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-[#121822] via-[#121822]/45 to-black/25" />

        {/* Top Row Controls */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs font-medium text-[#F4F1EA] bg-[#0A0E14]/85 px-2.5 py-1 rounded-md border border-white/10">
            <span
              className="inline-block w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: tasteMeta.color }}
              aria-hidden="true"
            />
            <span>{tasteMeta.label}</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close dish card"
            className="p-1.5 rounded-md bg-[#0A0E14]/85 border border-white/10 text-[#C7D0DC] hover:text-[#F4F1EA] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        {/* Bottom Location Overlay */}
        <div className="absolute bottom-2.5 left-4 right-4">
          <div className="flex items-center gap-1.5 text-xs text-[#D5DCE6] font-medium">
            <MapPin className="w-3.5 h-3.5 shrink-0 text-[#D99B26]" aria-hidden="true" />
            <span>
              {dish.city}, {dish.country}
            </span>
            <span aria-hidden="true">·</span>
            <span className="font-mono text-[11px] text-[#9AA5B4] tabular-nums">
              {formatCoord(dish.lat, 'N', 'S')}, {formatCoord(dish.lon, 'E', 'W')}
            </span>
          </div>
        </div>
      </div>

      {/* Scrollable Editorial Body */}
      <div className="flex-1 overflow-y-auto atlas-scroll px-5 py-4 space-y-5">
        {/* Title & Native Script */}
        <div>
          <div className="flex items-center justify-between gap-2 text-xs text-[#9AA5B4] mb-1">
            <span>{dish.localName}</span>
            <span aria-hidden="true">·</span>
            <span className="truncate">{dish.heritageSource}</span>
          </div>
          <h2 className="font-serif text-2xl font-medium text-[#F4F1EA] leading-snug">
            {dish.name}
          </h2>
          <p className="mt-2 text-sm text-[#C7D0DC] leading-relaxed">
            {dish.tastingNotes}
          </p>
        </div>

        {/* Sensory Radar + 5-Axis Bars */}
        <div className="pt-4 border-t border-white/8">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-semibold text-[#F4F1EA]">
              Sensory Flavor Profile
            </h3>
            <span className="text-xs font-mono text-[#9AA5B4] tabular-nums">
              Intensity {dish.intensity}/100
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="shrink-0">
              <FlavorRadar
                profile={dish.flavorProfile}
                accentColor={tasteMeta.color}
                size={148}
              />
            </div>

            <div className="flex-1 space-y-2">
              {TASTE_ORDER.map((axis) => {
                const val = dish.flavorProfile[axis];
                const meta = TASTE_META[axis];
                return (
                  <div key={axis} className="space-y-0.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-[#C7D0DC]">{meta.shortLabel}</span>
                      <span className="font-mono text-[#9AA5B4] tabular-nums">
                        {val}
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-white/8 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-[width] duration-300"
                        style={{
                          width: `${val}%`,
                          backgroundColor: meta.color,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-2.5 text-xs text-[#9AA5B4]">
            <span>Secondary note: {secondaryMeta.label}</span>
          </div>
        </div>

        {/* Key Botanicals & Ingredients (Unboxed clean prose with separators) */}
        <div className="pt-4 border-t border-white/8 space-y-2.5">
          <div>
            <h3 className="text-xs font-semibold text-[#F4F1EA] mb-1">
              Key Ingredients &amp; Botanicals
            </h3>
            <p className="text-xs text-[#C7D0DC] leading-relaxed">
              {dish.keyIngredients.join(' · ')}
            </p>
          </div>
          <div>
            <h3 className="text-xs font-semibold text-[#F4F1EA] mb-1">
              Volatile Aromatics &amp; Pairing
            </h3>
            <p className="text-xs text-[#9AA5B4] leading-relaxed">
              {dish.signatureAromas.join(' · ')} — Paired with{' '}
              <span className="text-[#F4F1EA]">{dish.pairing}</span>
            </p>
          </div>
        </div>

        {/* Linked Culinary Heritage Arcs */}
        {relatedDishes.length > 0 && (
          <div className="pt-4 border-t border-white/8">
            <h3 className="text-xs font-semibold text-[#F4F1EA] mb-2">
              Connected Culinary Arcs
            </h3>
            <div className="space-y-1.5">
              {relatedDishes.map((rel) => (
                <button
                  key={rel.id}
                  type="button"
                  onClick={() => onSelectRelated(rel.id)}
                  className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-[#18202C] hover:bg-[#1F2938] border border-white/8 text-left transition-colors cursor-pointer"
                >
                  <div className="min-w-0">
                    <div className="text-xs font-medium text-[#F4F1EA] truncate">
                      {rel.name}
                    </div>
                    <div className="text-[11px] text-[#9AA5B4] truncate">
                      {rel.city}, {rel.country} ·{' '}
                      {TASTE_META[rel.primaryTaste].shortLabel}
                    </div>
                  </div>
                  <ChevronRight
                    className="w-3.5 h-3.5 text-[#7D8898] shrink-0"
                    aria-hidden="true"
                  />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Card Footer Navigation */}
      <div className="shrink-0 px-4 py-2.5 bg-[#0E131B] border-t border-white/8 flex items-center justify-between">
        <button
          type="button"
          onClick={onPrev}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium text-[#C7D0DC] hover:text-[#F4F1EA] hover:bg-white/6 transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Previous</span>
        </button>

        <span className="text-[11px] text-[#7D8898]">
          {presenterMode ? 'Presenter Tour Active' : 'Manual Inspection'}
        </span>

        <button
          type="button"
          onClick={onNext}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium text-[#C7D0DC] hover:text-[#F4F1EA] hover:bg-white/6 transition-colors cursor-pointer"
        >
          <span>Next</span>
          <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
        </button>
      </div>
    </aside>
  );
};
