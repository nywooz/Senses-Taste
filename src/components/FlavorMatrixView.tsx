import React, { useMemo, useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { CONTINENT_ORDER, TASTE_META, TASTE_ORDER } from '../data/culinaryData';
import { CulinaryDish, TasteCategory } from '../types/culinary';
import { FlavorRadar } from './FlavorRadar';

interface FlavorMatrixViewProps {
  dishes: CulinaryDish[];
  onInspectOnGlobe: (dishId: string) => void;
}

export const FlavorMatrixView: React.FC<FlavorMatrixViewProps> = ({
  dishes,
  onInspectOnGlobe,
}) => {
  const [dishAId, setDishAId] = useState(dishes[0]?.id ?? '');
  const [dishBId, setDishBId] = useState(dishes[2]?.id ?? '');

  const dishA = useMemo(
    () => dishes.find((d) => d.id === dishAId) ?? dishes[0],
    [dishes, dishAId]
  );
  const dishB = useMemo(
    () => dishes.find((d) => d.id === dishBId) ?? dishes[1],
    [dishes, dishBId]
  );

  // Compute global taste category averages and counts
  const tasteSummary = useMemo(() => {
    return TASTE_ORDER.map((taste: TasteCategory) => {
      const primaryCount = dishes.filter((d) => d.primaryTaste === taste).length;
      const avgScore = Math.round(
        dishes.reduce((sum, d) => sum + d.flavorProfile[taste], 0) /
          dishes.length
      );
      const topDish = [...dishes].sort(
        (a, b) => b.flavorProfile[taste] - a.flavorProfile[taste]
      )[0];
      return {
        taste,
        meta: TASTE_META[taste],
        primaryCount,
        avgScore,
        topDish,
      };
    });
  }, [dishes]);

  // Compute regional sensory averages
  const regionalMatrix = useMemo(() => {
    return CONTINENT_ORDER.map((continent) => {
      const regionDishes = dishes.filter((d) => d.continent === continent);
      const count = regionDishes.length;
      const averages = TASTE_ORDER.reduce((acc, axis) => {
        acc[axis] =
          count > 0
            ? Math.round(
                regionDishes.reduce((s, d) => s + d.flavorProfile[axis], 0) /
                  count
              )
            : 0;
        return acc;
      }, {} as Record<TasteCategory, number>);
      const dominant = TASTE_ORDER.reduce((best, cur) =>
        averages[cur] > averages[best] ? cur : best
      );
      return { continent, count, averages, dominant };
    });
  }, [dishes]);

  return (
    <section
      aria-label="Global Sensory Flavor Matrix"
      className="flex-1 overflow-y-auto atlas-scroll bg-[#0A0E14] px-6 py-8"
    >
      <div className="max-w-6xl mx-auto space-y-10 pb-12">
        {/* Header */}
        <div className="border-b border-white/10 pb-6">
          <p className="text-xs font-medium text-[#D99B26] mb-1.5">
            Sensory Analytics · 5-Axis Comparative Matrix
          </p>
          <h1 className="font-serif text-3xl sm:text-4xl font-medium text-[#F4F1EA] text-balance">
            Comparative Taste Architecture
          </h1>
          <p className="mt-2 text-sm text-[#9AA5B4] max-w-2xl">
            Compare regional flavor signatures side by side across the five foundational culinary dimensions—Umami, Spicy, Sweet, Sour, and Savory.
          </p>
        </div>

        {/* Dual Dish Sensory Comparator */}
        <div className="bg-[#121822] border border-white/10 rounded-xl p-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="font-serif text-xl font-medium text-[#F4F1EA]">
                Head-to-Head Sensory Comparison
              </h2>
              <p className="text-xs text-[#9AA5B4] mt-0.5">
                Overlay any two regional dishes to inspect flavor symmetry and contrast.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{
                    backgroundColor: TASTE_META[dishA.primaryTaste].color,
                  }}
                  aria-hidden="true"
                />
                <select
                  value={dishA.id}
                  onChange={(e) => setDishAId(e.target.value)}
                  aria-label="Select primary comparison dish"
                  className="px-3 py-1.5 rounded-lg bg-[#0A0E14] border border-white/12 text-xs text-[#F4F1EA] cursor-pointer"
                >
                  {dishes.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.city}: {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <span className="text-xs text-[#7D8898]">vs</span>

              <div className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0 border border-dashed border-white/70"
                  style={{
                    backgroundColor: TASTE_META[dishB.primaryTaste].color,
                  }}
                  aria-hidden="true"
                />
                <select
                  value={dishB.id}
                  onChange={(e) => setDishBId(e.target.value)}
                  aria-label="Select secondary comparison dish"
                  className="px-3 py-1.5 rounded-lg bg-[#0A0E14] border border-white/12 text-xs text-[#F4F1EA] cursor-pointer"
                >
                  {dishes.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.city}: {d.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-5 flex justify-center">
              <FlavorRadar
                profile={dishA.flavorProfile}
                accentColor={TASTE_META[dishA.primaryTaste].color}
                secondaryProfile={dishB.flavorProfile}
                secondaryColor="#E2E8F0"
                size={250}
              />
            </div>

            <div className="lg:col-span-7 space-y-4">
              {TASTE_ORDER.map((axis) => {
                const aVal = dishA.flavorProfile[axis];
                const bVal = dishB.flavorProfile[axis];
                const delta = aVal - bVal;
                return (
                  <div key={axis} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-[#F4F1EA]">
                        {TASTE_META[axis].label}
                      </span>
                      <div className="flex items-center gap-3 font-mono tabular-nums text-[11px]">
                        <span style={{ color: TASTE_META[dishA.primaryTaste].color }}>
                          {dishA.city}: {aVal}
                        </span>
                        <span className="text-[#CBD5E1]">
                          {dishB.city}: {bVal}
                        </span>
                        <span className="text-[#9AA5B4] w-10 text-right">
                          {delta > 0 ? `+${delta}` : delta}
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="h-1.5 bg-white/8 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${aVal}%`,
                            backgroundColor: TASTE_META[dishA.primaryTaste].color,
                          }}
                        />
                      </div>
                      <div className="h-1.5 bg-white/8 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[#CBD5E1]"
                          style={{ width: `${bVal}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}

              <div className="pt-3 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => onInspectOnGlobe(dishA.id)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#18202C] border border-white/10 text-xs font-medium text-[#F4F1EA] hover:border-white/25 transition-colors cursor-pointer"
                >
                  <span>Fly to {dishA.city}</span>
                  <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => onInspectOnGlobe(dishB.id)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#18202C] border border-white/10 text-xs font-medium text-[#F4F1EA] hover:border-white/25 transition-colors cursor-pointer"
                >
                  <span>Fly to {dishB.city}</span>
                  <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 5 Global Taste Benchmarks */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {tasteSummary.map(({ taste, meta, primaryCount, avgScore, topDish }) => (
            <div
              key={taste}
              className="bg-[#121822] border border-white/10 rounded-xl p-4 flex flex-col justify-between gap-3"
            >
              <div>
                <div className="flex items-center justify-between gap-2 text-xs mb-1.5">
                  <span className="inline-flex items-center gap-1.5 font-semibold text-[#F4F1EA]">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: meta.color }}
                      aria-hidden="true"
                    />
                    {meta.shortLabel}
                  </span>
                  <span className="font-mono text-[#9AA5B4] tabular-nums">
                    {primaryCount} sites
                  </span>
                </div>
                <p className="text-[11px] text-[#9AA5B4] leading-relaxed">
                  {meta.compoundNote}
                </p>
              </div>

              <div className="pt-3 border-t border-white/8 space-y-1">
                <div className="flex items-center justify-between text-[11px] text-[#7D8898]">
                  <span>Global mean</span>
                  <span className="font-mono text-[#C7D0DC] tabular-nums">
                    {avgScore}/100
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => onInspectOnGlobe(topDish.id)}
                  className="text-left text-xs font-medium text-[#F4F1EA] hover:text-[#D99B26] transition-colors truncate block w-full cursor-pointer"
                >
                  Peak: {topDish.city} ({topDish.flavorProfile[taste]})
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Regional Sensory Table */}
        <div className="bg-[#121822] border border-white/10 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-white/10">
            <h2 className="font-serif text-xl font-medium text-[#F4F1EA]">
              Regional Flavor Averages by World Zone
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-white/10 text-[#9AA5B4]">
                  <th className="py-3 px-6 font-medium">Region</th>
                  <th className="py-3 px-4 font-medium text-right">Dishes</th>
                  {TASTE_ORDER.map((axis) => (
                    <th key={axis} className="py-3 px-4 font-medium text-right">
                      {TASTE_META[axis].shortLabel}
                    </th>
                  ))}
                  <th className="py-3 px-6 font-medium">Dominant Signature</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/6">
                {regionalMatrix.map((row) => (
                  <tr
                    key={row.continent}
                    className="hover:bg-white/[0.03] transition-colors"
                  >
                    <td className="py-3.5 px-6 font-medium text-[#F4F1EA]">
                      {row.continent}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-[#9AA5B4] tabular-nums">
                      {row.count}
                    </td>
                    {TASTE_ORDER.map((axis) => (
                      <td
                        key={axis}
                        className="py-3.5 px-4 text-right font-mono tabular-nums text-[#C7D0DC]"
                      >
                        {row.averages[axis]}
                      </td>
                    ))}
                    <td className="py-3.5 px-6">
                      <span className="inline-flex items-center gap-1.5 text-[#F4F1EA]">
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{
                            backgroundColor: TASTE_META[row.dominant].color,
                          }}
                          aria-hidden="true"
                        />
                        {TASTE_META[row.dominant].label}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
};
