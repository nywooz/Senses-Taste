import React, { useMemo, useState } from 'react';
import { ArrowUpRight, Search } from 'lucide-react';
import { CONTINENT_ORDER, TASTE_META, TASTE_ORDER } from '../data/culinaryData';
import { Continent, CulinaryDish, TasteFilter } from '../types/culinary';

interface AtlasIndexViewProps {
  dishes: CulinaryDish[];
  activeTaste: TasteFilter;
  onSelectTaste: (taste: TasteFilter) => void;
  onInspectOnGlobe: (dishId: string) => void;
}

export const AtlasIndexView: React.FC<AtlasIndexViewProps> = ({
  dishes,
  activeTaste,
  onSelectTaste,
  onInspectOnGlobe,
}) => {
  const [query, setQuery] = useState('');
  const [selectedContinent, setSelectedContinent] = useState<Continent | 'all'>(
    'all'
  );
  const [sortBy, setSortBy] = useState<'intensity' | 'name'>('intensity');

  const filteredDishes = useMemo(() => {
    const q = query.trim().toLowerCase();
    return dishes
      .filter((d) => {
        if (activeTaste !== 'all' && d.primaryTaste !== activeTaste) {
          return false;
        }
        if (selectedContinent !== 'all' && d.continent !== selectedContinent) {
          return false;
        }
        if (!q) return true;
        return (
          d.name.toLowerCase().includes(q) ||
          d.city.toLowerCase().includes(q) ||
          d.country.toLowerCase().includes(q) ||
          d.keyIngredients.some((ing) => ing.toLowerCase().includes(q)) ||
          d.tastingNotes.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        if (sortBy === 'intensity') return b.intensity - a.intensity;
        return a.name.localeCompare(b.name);
      });
  }, [dishes, activeTaste, selectedContinent, query, sortBy]);

  return (
    <section
      aria-label="Global Culinary Atlas Index"
      className="flex-1 overflow-y-auto atlas-scroll bg-[#0A0E14] px-6 py-8"
    >
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Editorial Heading */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/10 pb-6">
          <div>
            <p className="text-xs font-medium text-[#D99B26] mb-1.5">
              #30DayMapChallenge · Day 23 · Senses: Taste
            </p>
            <h1 className="font-serif text-3xl sm:text-4xl font-medium text-[#F4F1EA] text-balance">
              Global Culinary Heritage Directory
            </h1>
            <p className="mt-2 text-sm text-[#9AA5B4] max-w-2xl">
              Explore {dishes.length} regional signature specialties mapped by sensory taste profile, volatile aromatics, and open culinary heritage records. Select any card to fly the 3D globe directly to its origin.
            </p>
          </div>

          <div className="text-xs font-mono text-[#9AA5B4] tabular-nums shrink-0">
            Showing {filteredDishes.length} of {dishes.length} hotspots
          </div>
        </div>

        {/* Filter & Search Toolbar */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          {/* Taste Filter Buttons */}
          <div
            role="group"
            aria-label="Filter index by taste"
            className="flex items-center gap-1 p-1 bg-[#121822] border border-white/10 rounded-lg overflow-x-auto"
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
              All Tastes
            </button>
            {TASTE_ORDER.map((t) => {
              const meta = TASTE_META[t];
              const isActive = activeTaste === t;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => onSelectTaste(t)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                    isActive
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
                </button>
              );
            })}
          </div>

          {/* Search + Region + Sort */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 sm:w-60">
              <Search
                className="w-4 h-4 text-[#7D8898] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search dish, city, or spice..."
                aria-label="Search culinary directory"
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#121822] border border-white/10 text-xs text-[#F4F1EA] placeholder:text-[#7D8898] focus:border-[#D99B26] focus:outline-none"
              />
            </div>

            <select
              value={selectedContinent}
              onChange={(e) =>
                setSelectedContinent(e.target.value as Continent | 'all')
              }
              aria-label="Filter by world region"
              className="px-3 py-2 rounded-lg bg-[#121822] border border-white/10 text-xs text-[#F4F1EA] cursor-pointer"
            >
              <option value="all">All Regions</option>
              {CONTINENT_ORDER.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(e) =>
                setSortBy(e.target.value as 'intensity' | 'name')
              }
              aria-label="Sort dishes"
              className="px-3 py-2 rounded-lg bg-[#121822] border border-white/10 text-xs text-[#F4F1EA] cursor-pointer"
            >
              <option value="intensity">Sort: Intensity</option>
              <option value="name">Sort: Name (A–Z)</option>
            </select>
          </div>
        </div>

        {/* Dish Grid */}
        {filteredDishes.length === 0 ? (
          <div className="py-16 text-center border border-white/10 rounded-xl bg-[#121822]">
            <p className="text-sm text-[#C7D0DC] mb-3">
              No regional specialties match the current filter combination.
            </p>
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setSelectedContinent('all');
                onSelectTaste('all');
              }}
              className="px-4 py-2 rounded-lg bg-[#1F2937] text-xs font-medium text-[#F4F1EA] hover:bg-[#2A3749] transition-colors cursor-pointer"
            >
              Reset All Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 pb-12">
            {filteredDishes.map((dish) => {
              const meta = TASTE_META[dish.primaryTaste];
              return (
                <button
                  key={dish.id}
                  type="button"
                  onClick={() => onInspectOnGlobe(dish.id)}
                  className="group text-left bg-[#121822] hover:bg-[#161E2B] border border-white/10 hover:border-white/22 rounded-xl p-5 transition-colors flex flex-col justify-between gap-4 cursor-pointer"
                >
                  <div>
                    {/* Quiet unboxed metadata line */}
                    <div className="flex items-center justify-between gap-2 text-xs text-[#9AA5B4] mb-2">
                      <span className="inline-flex items-center gap-1.5 truncate">
                        <span
                          className="inline-block w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: meta.color }}
                          aria-hidden="true"
                        />
                        <span>{meta.shortLabel}</span>
                        <span aria-hidden="true">·</span>
                        <span className="truncate">
                          {dish.city}, {dish.country}
                        </span>
                      </span>
                      <ArrowUpRight
                        className="w-4 h-4 text-[#7D8898] group-hover:text-[#F4F1EA] transition-colors shrink-0"
                        aria-hidden="true"
                      />
                    </div>

                    <h2 className="font-serif text-lg font-medium text-[#F4F1EA] group-hover:text-[#D99B26] transition-colors">
                      {dish.name}
                    </h2>
                    <p className="text-xs text-[#7D8898] mt-0.5">
                      {dish.localName} · {dish.heritageSource}
                    </p>

                    <p className="mt-3 text-xs text-[#C7D0DC] leading-relaxed line-clamp-3">
                      {dish.tastingNotes}
                    </p>
                  </div>

                  {/* Mini 5-axis flavor signature strip */}
                  <div className="pt-3 border-t border-white/8 space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-[#9AA5B4]">
                      <span>Sensory Signature</span>
                      <span className="font-mono tabular-nums">
                        {dish.intensity}/100
                      </span>
                    </div>
                    <div className="grid grid-cols-5 gap-1.5">
                      {TASTE_ORDER.map((axis) => (
                        <div key={axis} className="space-y-1">
                          <div className="h-1 bg-white/8 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${dish.flavorProfile[axis]}%`,
                                backgroundColor: TASTE_META[axis].color,
                              }}
                            />
                          </div>
                          <div className="text-[10px] text-[#7D8898] truncate">
                            {TASTE_META[axis].shortLabel}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};
