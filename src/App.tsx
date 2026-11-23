import { useCallback, useEffect, useMemo, useState } from 'react';
import { AtlasIndexView } from './components/AtlasIndexView';
import { BottomControlDock } from './components/BottomControlDock';
import { ChallengeNotesView } from './components/ChallengeNotesView';
import { DishSpotlightCard } from './components/DishSpotlightCard';
import { FlavorMatrixView } from './components/FlavorMatrixView';
import { GoogleMapsViewport } from './components/GoogleMapsViewport';
import { TopBar } from './components/TopBar';
import { CULINARY_DISHES, TASTE_ORDER } from './data/culinaryData';
import { GlobeViewport } from './three/GlobeViewport';
import {
  AppView,
  GoogleMapStyle,
  LayerVisibility,
  MapEngine,
  TasteFilter,
} from './types/culinary';

const PRESENTER_DWELL_MS = 7500;

export default function App() {
  const [activeView, setActiveView] = useState<AppView>('globe');
  const [mapEngine, setMapEngine] = useState<MapEngine>('google');
  const [googleMapStyle, setGoogleMapStyle] =
    useState<GoogleMapStyle>('roadmap');
  const [activeTaste, setActiveTaste] = useState<TasteFilter>('all');
  const [selectedDishId, setSelectedDishId] = useState<string | null>(null);
  const [presenterMode, setPresenterMode] = useState(false);
  const [presenterProgress, setPresenterProgress] = useState(0);
  const [isHudHidden, setIsHudHidden] = useState(false);
  const [quotaExceeded, setQuotaExceeded] = useState(false);

  const [layers, setLayers] = useState<LayerVisibility>({
    columns: true,
    arcs: true,
    aroma: true,
    borders: true,
  });

  // Top-level Google Maps Platform quota exceeded listener
  useEffect(() => {
    const onQuotaExceeded = () => setQuotaExceeded(true);
    window.addEventListener('gmp-quota-exceeded', onQuotaExceeded);
    return () =>
      window.removeEventListener('gmp-quota-exceeded', onQuotaExceeded);
  }, []);

  const tasteCounts = useMemo(() => {
    const counts: Record<TasteFilter, number> = {
      all: CULINARY_DISHES.length,
      umami: 0,
      spicy: 0,
      sweet: 0,
      sour: 0,
      savory: 0,
    };
    for (const dish of CULINARY_DISHES) {
      counts[dish.primaryTaste] += 1;
    }
    return counts;
  }, []);

  const filteredDishes = useMemo(() => {
    if (activeTaste === 'all') return CULINARY_DISHES;
    return CULINARY_DISHES.filter((d) => d.primaryTaste === activeTaste);
  }, [activeTaste]);

  const filteredIds = useMemo(
    () => new Set(filteredDishes.map((d) => d.id)),
    [filteredDishes]
  );

  const activeDish = useMemo(
    () => CULINARY_DISHES.find((d) => d.id === selectedDishId) ?? null,
    [selectedDishId]
  );

  const currentDishIndex = useMemo(() => {
    if (!selectedDishId) return -1;
    return filteredDishes.findIndex((d) => d.id === selectedDishId);
  }, [filteredDishes, selectedDishId]);

  const relatedDishes = useMemo(() => {
    if (!activeDish) return [];
    return activeDish.relatedIds
      .map((id) => CULINARY_DISHES.find((d) => d.id === id))
      .filter((d): d is NonNullable<typeof d> => Boolean(d));
  }, [activeDish]);

  const handleSelectTaste = useCallback(
    (taste: TasteFilter) => {
      setActiveTaste(taste);
      const nextList =
        taste === 'all'
          ? CULINARY_DISHES
          : CULINARY_DISHES.filter((d) => d.primaryTaste === taste);

      if (selectedDishId && !nextList.some((d) => d.id === selectedDishId)) {
        setSelectedDishId(nextList[0]?.id ?? null);
      } else if (presenterMode && nextList.length > 0) {
        setSelectedDishId(nextList[0].id);
      }
      setPresenterProgress(0);
    },
    [selectedDishId, presenterMode]
  );

  const handleStepDish = useCallback(
    (direction: 1 | -1) => {
      if (filteredDishes.length === 0) return;
      const idx = filteredDishes.findIndex((d) => d.id === selectedDishId);
      const nextIdx =
        idx === -1
          ? 0
          : (idx + direction + filteredDishes.length) % filteredDishes.length;
      setSelectedDishId(filteredDishes[nextIdx].id);
      setPresenterProgress(0);
    },
    [filteredDishes, selectedDishId]
  );

  const handleTogglePresenter = useCallback(() => {
    setPresenterMode((prev) => {
      const next = !prev;
      if (next) {
        setActiveView('globe');
        setIsHudHidden(false);
        if (!selectedDishId || !filteredIds.has(selectedDishId)) {
          setSelectedDishId(filteredDishes[0]?.id ?? null);
        }
        setPresenterProgress(0);
      }
      return next;
    });
  }, [selectedDishId, filteredIds, filteredDishes]);

  const handleToggleLayer = useCallback((layer: keyof LayerVisibility) => {
    setLayers((prev) => ({ ...prev, [layer]: !prev[layer] }));
  }, []);

  const handleInspectOnGlobe = useCallback((dishId: string) => {
    const target = CULINARY_DISHES.find((d) => d.id === dishId);
    if (target) {
      setActiveTaste((prevTaste) =>
        prevTaste !== 'all' && prevTaste !== target.primaryTaste
          ? 'all'
          : prevTaste
      );
    }
    setPresenterMode(false);
    setSelectedDishId(dishId);
    setActiveView('globe');
    setIsHudHidden(false);
  }, []);

  const handleUserInteract = useCallback(() => {
    setPresenterMode(false);
  }, []);

  // Automated Presenter Mode timer
  useEffect(() => {
    if (
      !presenterMode ||
      activeView !== 'globe' ||
      filteredDishes.length === 0
    ) {
      return;
    }

    if (!selectedDishId || !filteredIds.has(selectedDishId)) {
      setSelectedDishId(filteredDishes[0].id);
    }

    const startTime = performance.now();
    const interval = window.setInterval(() => {
      const elapsed = performance.now() - startTime;
      const pct = Math.min(100, (elapsed / PRESENTER_DWELL_MS) * 100);
      setPresenterProgress(pct);
      if (elapsed >= PRESENTER_DWELL_MS) {
        window.clearInterval(interval);
        handleStepDish(1);
      }
    }, 100);

    return () => window.clearInterval(interval);
  }, [
    presenterMode,
    activeView,
    selectedDishId,
    filteredDishes,
    filteredIds,
    handleStepDish,
  ]);

  // Global keyboard shortcuts
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;

      if (e.code === 'Space') {
        e.preventDefault();
        handleTogglePresenter();
      } else if (e.key === 'ArrowRight') {
        if (activeView === 'globe') {
          setPresenterMode(false);
          handleStepDish(1);
        }
      } else if (e.key === 'ArrowLeft') {
        if (activeView === 'globe') {
          setPresenterMode(false);
          handleStepDish(-1);
        }
      } else if (e.key === 'h' || e.key === 'H') {
        if (activeView === 'globe') {
          setIsHudHidden((prev) => !prev);
        }
      } else if (e.key === 'Escape') {
        if (activeView !== 'globe') {
          setActiveView('globe');
        } else if (selectedDishId) {
          setPresenterMode(false);
          setSelectedDishId(null);
        }
      } else if (e.key >= '1' && e.key <= '6' && activeView === 'globe') {
        const idx = Number(e.key) - 1;
        if (idx === 0) handleSelectTaste('all');
        else if (TASTE_ORDER[idx - 1]) handleSelectTaste(TASTE_ORDER[idx - 1]);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    activeView,
    selectedDishId,
    handleTogglePresenter,
    handleStepDish,
    handleSelectTaste,
  ]);

  return (
    <div className="w-full h-full flex flex-col bg-[#0A0E14] text-[#F4F1EA] overflow-hidden">
      {quotaExceeded && (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2.5 text-xs md:text-sm text-center sticky top-0 z-50 shadow-sm">
          <span>
            Google Maps Platform quota reached. If you are the app owner, visit{' '}
            <a
              href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-semibold text-amber-950 hover:text-amber-800"
            >
              maps developer site
            </a>{' '}
            for instructions to update your account.
          </span>
        </div>
      )}

      <TopBar
        activeView={activeView}
        presenterMode={presenterMode}
        onChangeView={(view) => {
          if (view !== 'globe') setPresenterMode(false);
          setActiveView(view);
        }}
        onTogglePresenter={handleTogglePresenter}
      />

      <main className="relative flex-1 min-h-0 flex flex-col overflow-hidden">
        {activeView === 'globe' ? (
          <>
            {mapEngine === 'google' ? (
              <GoogleMapsViewport
                dishes={CULINARY_DISHES}
                filteredIds={filteredIds}
                selectedDishId={selectedDishId}
                presenterMode={presenterMode}
                layers={layers}
                mapStyle={googleMapStyle}
                isHudHidden={isHudHidden}
                onSelectDish={(id) => {
                  setPresenterMode(false);
                  setSelectedDishId(id);
                }}
                onUserInteract={handleUserInteract}
                onSwitchToGlobe={() => setMapEngine('globe')}
              />
            ) : (
              <GlobeViewport
                dishes={CULINARY_DISHES}
                filteredIds={filteredIds}
                selectedDishId={selectedDishId}
                presenterMode={presenterMode}
                layers={layers}
                isHudHidden={isHudHidden}
                onSelectDish={(id) => {
                  setPresenterMode(false);
                  setSelectedDishId(id);
                }}
                onUserOrbitStart={handleUserInteract}
              />
            )}

            {/* Subtle Top-Left Editorial Map Legend (hidden in Zen mode) */}
            {!isHudHidden && (
              <div className="pointer-events-none fixed top-[74px] left-5 z-10 max-w-xs hidden sm:block bg-[#0A0E14]/82 px-3.5 py-2.5 rounded-lg border border-white/10">
                <p className="text-[11px] font-medium text-[#D99B26]">
                  #30DayMapChallenge · Day 23
                </p>
                <h1 className="font-serif text-lg font-medium text-[#F4F1EA] leading-snug">
                  Senses: Taste
                </h1>
                <p className="text-xs text-[#9AA5B4] mt-0.5 leading-relaxed">
                  Click any regional marker to inspect flavor profiles, or start Presenter Mode for a guided culinary tour.
                </p>
              </div>
            )}

            {/* Dish Spotlight Card */}
            {activeDish && !isHudHidden && (
              <DishSpotlightCard
                key={activeDish.id}
                dish={activeDish}
                presenterMode={presenterMode}
                relatedDishes={relatedDishes}
                onClose={() => {
                  setPresenterMode(false);
                  setSelectedDishId(null);
                }}
                onPrev={() => {
                  setPresenterMode(false);
                  handleStepDish(-1);
                }}
                onNext={() => {
                  setPresenterMode(false);
                  handleStepDish(1);
                }}
                onSelectRelated={(id) => {
                  setPresenterMode(false);
                  setSelectedDishId(id);
                }}
              />
            )}

            {/* Unified Collapsible Bottom Control Dock */}
            <BottomControlDock
              mapEngine={mapEngine}
              googleMapStyle={googleMapStyle}
              activeTaste={activeTaste}
              tasteCounts={tasteCounts}
              layers={layers}
              presenterMode={presenterMode}
              presenterProgress={presenterProgress}
              currentIndex={currentDishIndex}
              totalFiltered={filteredDishes.length}
              isHudHidden={isHudHidden}
              onChangeMapEngine={(engine) => setMapEngine(engine)}
              onChangeGoogleMapStyle={(style) => setGoogleMapStyle(style)}
              onSelectTaste={handleSelectTaste}
              onToggleLayer={handleToggleLayer}
              onTogglePresenter={handleTogglePresenter}
              onPrevDish={() => {
                setPresenterMode(false);
                handleStepDish(-1);
              }}
              onNextDish={() => {
                setPresenterMode(false);
                handleStepDish(1);
              }}
              onToggleHud={() => setIsHudHidden((prev) => !prev)}
            />
          </>
        ) : activeView === 'index' ? (
          <AtlasIndexView
            dishes={CULINARY_DISHES}
            activeTaste={activeTaste}
            onSelectTaste={handleSelectTaste}
            onInspectOnGlobe={handleInspectOnGlobe}
          />
        ) : activeView === 'matrix' ? (
          <FlavorMatrixView
            dishes={CULINARY_DISHES}
            onInspectOnGlobe={handleInspectOnGlobe}
          />
        ) : (
          <ChallengeNotesView
            onReturnToGlobe={() => setActiveView('globe')}
            onStartPresenter={() => {
              setActiveView('globe');
              setPresenterMode(true);
              if (!selectedDishId) {
                setSelectedDishId(filteredDishes[0]?.id ?? null);
              }
            }}
          />
        )}
      </main>
    </div>
  );
}
