import React from 'react';
import { ArrowRight, Globe2 } from 'lucide-react';
import { CULINARY_DISHES } from '../data/culinaryData';

interface ChallengeNotesViewProps {
  onReturnToGlobe: () => void;
  onStartPresenter: () => void;
}

export const ChallengeNotesView: React.FC<ChallengeNotesViewProps> = ({
  onReturnToGlobe,
  onStartPresenter,
}) => {
  return (
    <section
      aria-label="30DayMapChallenge Day 23 Notes and Methodology"
      className="flex-1 overflow-y-auto atlas-scroll bg-[#0A0E14] px-6 py-10"
    >
      <div className="max-w-3xl mx-auto space-y-10 pb-12">
        <div className="border-b border-white/10 pb-6">
          <p className="text-xs font-medium text-[#D99B26] mb-2">
            #30DayMapChallenge · Day 23 · Theme: Senses — Taste
          </p>
          <h1 className="font-serif text-3xl sm:text-4xl font-medium text-[#F4F1EA] text-balance">
            Cartography of Global Taste &amp; Culinary Heritage
          </h1>
          <p className="mt-3 text-sm text-[#C7D0DC] leading-relaxed">
            FlavorAtlas translates the human palate into spatial geometry—mapping {CULINARY_DISHES.length} iconic regional dishes across six continents through 3D sensory intensity towers, cross-continental spice and fermentation arcs, and interactive presenter choreography.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-[#121822] border border-white/10 rounded-xl p-5 space-y-2.5">
            <h2 className="font-serif text-lg font-medium text-[#F4F1EA]">
              Dual Cartographic Architecture
            </h2>
            <p className="text-xs text-[#C7D0DC] leading-relaxed">
              Explore regional flavors on interactive Google Maps (Dark Vector, Satellite, and Terrain with Advanced Markers and geodesic heritage routes) or switch seamlessly to the Three.js 3D WebGL Globe powered by Natural Earth 110m boundaries.
            </p>
            <p className="text-xs text-[#9AA5B4] leading-relaxed">
              Toggleable spatial layers—Intensity Columns, Geodesic Culinary Arcs, Sensory Aroma Fields, and Borders—let presenters isolate spice routes or regional taste clusters live.
            </p>
          </div>

          <div className="bg-[#121822] border border-white/10 rounded-xl p-5 space-y-2.5">
            <h2 className="font-serif text-lg font-medium text-[#F4F1EA]">
              Open Culinary Data Sources
            </h2>
            <p className="text-xs text-[#C7D0DC] leading-relaxed">
              Regional dish selections and heritage citations draw upon public gastronomic registries including the UNESCO Intangible Cultural Heritage Lists, EU PDO/PGI Geographical Indications, and FAO regional crop traditions.
            </p>
            <p className="text-xs text-[#9AA5B4] leading-relaxed">
              Each dish is indexed across five quantitative sensory axes (Umami, Spicy, Sweet, Sour, Savory) derived from dominant chemical flavor compounds—glutamates, capsaicinoids, sucrose, organic acids, and Maillard aromatics.
            </p>
          </div>
        </div>

        {/* Keyboard & Presenter Controls */}
        <div className="bg-[#121822] border border-white/10 rounded-xl p-6">
          <h2 className="font-serif text-lg font-medium text-[#F4F1EA] mb-4">
            Presentation Controls &amp; Shortcuts
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="flex items-center justify-between py-2 border-b border-white/8">
              <span className="text-[#C7D0DC]">Start / Pause Presenter Tour</span>
              <kbd className="px-2 py-0.5 rounded bg-[#0A0E14] border border-white/15 font-mono text-[#F4F1EA]">
                Space
              </kbd>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-white/8">
              <span className="text-[#C7D0DC]">Next / Previous Hotspot</span>
              <span className="flex items-center gap-1">
                <kbd className="px-2 py-0.5 rounded bg-[#0A0E14] border border-white/15 font-mono text-[#F4F1EA]">
                  ←
                </kbd>
                <kbd className="px-2 py-0.5 rounded bg-[#0A0E14] border border-white/15 font-mono text-[#F4F1EA]">
                  →
                </kbd>
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-white/8">
              <span className="text-[#C7D0DC]">Collapse / Expand HUD</span>
              <kbd className="px-2 py-0.5 rounded bg-[#0A0E14] border border-white/15 font-mono text-[#F4F1EA]">
                H
              </kbd>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-white/8">
              <span className="text-[#C7D0DC]">Clear Selection</span>
              <kbd className="px-2 py-0.5 rounded bg-[#0A0E14] border border-white/15 font-mono text-[#F4F1EA]">
                Esc
              </kbd>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onStartPresenter}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#D99B26] text-[#0A0E14] text-xs font-semibold hover:bg-[#E5AA38] transition-colors cursor-pointer"
          >
            <span>Launch Automated Presenter Tour</span>
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </button>

          <button
            type="button"
            onClick={onReturnToGlobe}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#18202C] border border-white/12 text-[#F4F1EA] text-xs font-medium hover:border-white/25 transition-colors cursor-pointer"
          >
            <Globe2 className="w-4 h-4" aria-hidden="true" />
            <span>Return to 3D Globe</span>
          </button>
        </div>
      </div>
    </section>
  );
};
