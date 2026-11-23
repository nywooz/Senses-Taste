import React from 'react';
import { Pause, Play } from 'lucide-react';
import { AppView } from '../types/culinary';

interface TopBarProps {
  activeView: AppView;
  presenterMode: boolean;
  onChangeView: (view: AppView) => void;
  onTogglePresenter: () => void;
}

const NAV_ITEMS: { id: AppView; label: string }[] = [
  { id: 'globe', label: 'Map View' },
  { id: 'index', label: 'Atlas Index' },
  { id: 'matrix', label: 'Flavor Matrix' },
  { id: 'notes', label: 'Challenge Notes' },
];

export const TopBar: React.FC<TopBarProps> = ({
  activeView,
  presenterMode,
  onChangeView,
  onTogglePresenter,
}) => {
  return (
    <header className="relative z-20 flex items-center justify-between gap-8 px-6 py-3.5 bg-[#0C1118] border-b border-white/10">
      {/* Zone 1: Single-line Brand Wordmark */}
      <button
        type="button"
        onClick={() => onChangeView('globe')}
        className="font-serif text-xl font-semibold tracking-tight text-[#F4F1EA] whitespace-nowrap shrink-0 hover:text-[#D99B26] transition-colors cursor-pointer"
      >
        FlavorAtlas
      </button>

      {/* Zone 2: 4 Clean Single-Line Navigation Links */}
      <nav
        aria-label="Primary navigation"
        className="hidden md:flex items-center gap-7 text-sm font-medium"
      >
        {NAV_ITEMS.map((item) => {
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onChangeView(item.id)}
              className={`py-1 whitespace-nowrap shrink-0 transition-colors cursor-pointer border-b-2 ${
                isActive
                  ? 'text-[#F4F1EA] border-[#D99B26]'
                  : 'text-[#9AA5B4] border-transparent hover:text-[#F4F1EA]'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Mobile compact nav */}
      <nav
        aria-label="Mobile navigation"
        className="flex md:hidden items-center gap-4 text-xs font-medium overflow-x-auto"
      >
        {NAV_ITEMS.map((item) => {
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onChangeView(item.id)}
              className={`py-1 whitespace-nowrap shrink-0 cursor-pointer ${
                isActive ? 'text-[#D99B26]' : 'text-[#9AA5B4]'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Zone 3: 1 Primary Action Button */}
      <div className="flex items-center shrink-0">
        <button
          type="button"
          onClick={onTogglePresenter}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
            presenterMode
              ? 'bg-[#D99B26] text-[#0A0E14] hover:bg-[#E5AA38]'
              : 'bg-[#F4F1EA] text-[#0A0E14] hover:bg-white'
          }`}
        >
          {presenterMode ? (
            <>
              <Pause className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Pause Tour</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Start Presenter</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
};
