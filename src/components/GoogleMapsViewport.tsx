import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AdvancedMarker,
  APILoadingStatus,
  APIProvider,
  Map as GoogleMap,
  useApiLoadingStatus,
  useMap,
  useMapsLibrary,
} from '@vis.gl/react-google-maps';
import { Globe2 } from 'lucide-react';
import { TASTE_META } from '../data/culinaryData';
import {
  CulinaryDish,
  GoogleMapStyle,
  LayerVisibility,
} from '../types/culinary';

interface GoogleMapsViewportProps {
  dishes: CulinaryDish[];
  filteredIds: Set<string>;
  selectedDishId: string | null;
  presenterMode: boolean;
  layers: LayerVisibility;
  mapStyle: GoogleMapStyle;
  isHudHidden: boolean;
  onSelectDish: (dishId: string | null) => void;
  onUserInteract: () => void;
  onSwitchToGlobe: () => void;
}

const MAPS_API_KEY =
  (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined)?.trim() ??
  '';

// Inner component handling geodesic culinary arcs & sensory aroma circles
const GeospatialLayersOverlay: React.FC<{
  dishes: CulinaryDish[];
  dishById: Record<string, CulinaryDish>;
  filteredIds: Set<string>;
  selectedDishId: string | null;
  layers: LayerVisibility;
}> = ({ dishes, dishById, filteredIds, selectedDishId, layers }) => {
  const map = useMap();
  const mapsLib = useMapsLibrary('maps');

  // Geodesic Culinary Trade & Heritage Arcs
  useEffect(() => {
    if (!map || !mapsLib || !layers.arcs) return;

    const polylines: google.maps.Polyline[] = [];
    const seenPairs: Record<string, boolean> = {};

    for (const dish of dishes) {
      for (const relId of dish.relatedIds) {
        const pairKey =
          dish.id < relId ? `${dish.id}::${relId}` : `${relId}::${dish.id}`;
        if (seenPairs[pairKey]) continue;
        seenPairs[pairKey] = true;

        const target = dishById[relId];
        if (!target) continue;

        const aVisible = filteredIds.has(dish.id);
        const bVisible = filteredIds.has(target.id);
        const isConnectedToSelected =
          selectedDishId !== null &&
          (dish.id === selectedDishId || target.id === selectedDishId);

        if (selectedDishId !== null && !isConnectedToSelected) continue;
        if (selectedDishId === null && (!aVisible || !bVisible)) continue;

        const color = TASTE_META[dish.primaryTaste].color;
        const line = new mapsLib.Polyline({
          path: [
            { lat: dish.lat, lng: dish.lon },
            { lat: target.lat, lng: target.lon },
          ],
          geodesic: true,
          strokeColor: color,
          strokeOpacity: isConnectedToSelected ? 0.92 : 0.42,
          strokeWeight: isConnectedToSelected ? 2.6 : 1.5,
          clickable: false,
          zIndex: isConnectedToSelected ? 50 : 10,
        });
        line.setMap(map);
        polylines.push(line);
      }
    }

    return () => {
      for (const line of polylines) {
        line.setMap(null);
      }
    };
  }, [map, mapsLib, dishes, dishById, filteredIds, selectedDishId, layers.arcs]);

  // Sensory Aroma Circles
  useEffect(() => {
    if (!map || !mapsLib || !layers.aroma) return;

    const circles: google.maps.Circle[] = [];

    for (const dish of dishes) {
      if (!filteredIds.has(dish.id)) continue;
      const isSelected = selectedDishId === dish.id;
      const color = TASTE_META[dish.primaryTaste].color;

      const circle = new mapsLib.Circle({
        center: { lat: dish.lat, lng: dish.lon },
        radius: (isSelected ? 195000 : 115000) * (0.75 + dish.intensity / 250),
        strokeColor: color,
        strokeOpacity: isSelected ? 0.85 : 0.35,
        strokeWeight: isSelected ? 2 : 1,
        fillColor: color,
        fillOpacity: isSelected ? 0.22 : 0.1,
        clickable: false,
        zIndex: isSelected ? 40 : 5,
      });
      circle.setMap(map);
      circles.push(circle);
    }

    return () => {
      for (const c of circles) {
        c.setMap(null);
      }
    };
  }, [map, mapsLib, dishes, filteredIds, selectedDishId, layers.aroma]);

  return null;
};

// Inner component managing Presenter Mode & selection camera choreography
const MapCameraChoreographer: React.FC<{
  dishById: Record<string, CulinaryDish>;
  selectedDishId: string | null;
  presenterMode: boolean;
  isHudHidden: boolean;
}> = ({ dishById, selectedDishId, presenterMode, isHudHidden }) => {
  const map = useMap();
  const prevDishIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!map || !selectedDishId) {
      prevDishIdRef.current = selectedDishId;
      return;
    }

    if (prevDishIdRef.current === selectedDishId) return;
    prevDishIdRef.current = selectedDishId;

    const dish = dishById[selectedDishId];
    if (!dish) return;

    const targetZoom = dish.country.includes('UK')
      ? 7
      : dish.continent === 'Europe'
      ? 6
      : 5;

    map.panTo({ lat: dish.lat, lng: dish.lon });

    const currentZoom = map.getZoom() ?? 3;
    if (presenterMode || currentZoom < targetZoom - 1 || currentZoom > 9) {
      map.setZoom(targetZoom);
    }

    // Offset pan slightly right on desktop so the DishSpotlightCard doesn't cover the marker
    if (!isHudHidden && window.innerWidth >= 1024) {
      window.setTimeout(() => {
        map.panBy(165, 0);
      }, 120);
    }
  }, [map, dishById, selectedDishId, presenterMode, isHudHidden]);

  return null;
};

const MapsStatusOverlay: React.FC<{
  onSwitchToGlobe: () => void;
}> = ({ onSwitchToGlobe }) => {
  const status = useApiLoadingStatus();

  if (
    status === APILoadingStatus.FAILED ||
    status === APILoadingStatus.AUTH_FAILURE
  ) {
    return (
      <div className="absolute inset-0 z-30 flex items-center justify-center bg-[#0A0E14]/92 p-6">
        <div className="max-w-md bg-[#121822] border border-white/12 rounded-xl p-6 text-center space-y-3">
          <h2 className="font-serif text-xl font-medium text-[#F4F1EA]">
            Unable to Load Google Maps
          </h2>
          <p className="text-xs text-[#9AA5B4] leading-relaxed">
            Google Maps JavaScript API failed to initialize. Verify your API key configuration and enabled Maps JavaScript API permissions, or continue exploring with the built-in 3D Globe.
          </p>
          <button
            type="button"
            onClick={onSwitchToGlobe}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#D99B26] text-[#0A0E14] text-xs font-semibold hover:bg-[#E5AA38] transition-colors cursor-pointer"
          >
            <Globe2 className="w-4 h-4" aria-hidden="true" />
            <span>Switch to 3D Globe</span>
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export const GoogleMapsViewport: React.FC<GoogleMapsViewportProps> = ({
  dishes,
  filteredIds,
  selectedDishId,
  presenterMode,
  layers,
  mapStyle,
  isHudHidden,
  onSelectDish,
  onUserInteract,
  onSwitchToGlobe,
}) => {
  const [hoveredDishId, setHoveredDishId] = useState<string | null>(null);

  const dishById = useMemo(() => {
    const record: Record<string, CulinaryDish> = {};
    for (const d of dishes) {
      record[d.id] = d;
    }
    return record;
  }, [dishes]);

  if (!MAPS_API_KEY) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-[#0A0E14] p-6">
        <div className="max-w-md bg-[#121822] border border-white/12 rounded-xl p-6 text-center space-y-3">
          <h2 className="font-serif text-xl font-medium text-[#F4F1EA]">
            Google Maps API Key Required
          </h2>
          <p className="text-xs text-[#9AA5B4] leading-relaxed">
            Set <code className="font-mono text-[#F4F1EA]">VITE_GOOGLE_MAPS_API_KEY</code> in your environment to render Google Maps, or switch to the 3D WebGL Globe view.
          </p>
          <button
            type="button"
            onClick={onSwitchToGlobe}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#D99B26] text-[#0A0E14] text-xs font-semibold hover:bg-[#E5AA38] transition-colors cursor-pointer"
          >
            <Globe2 className="w-4 h-4" aria-hidden="true" />
            <span>Open 3D Globe</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full bg-[#0A0E14]">
      <APIProvider
        apiKey={MAPS_API_KEY}
        libraries={['marker', 'maps']}
        language="en"
        region="GB"
      >
        <GoogleMap
          mapId="DEMO_MAP_ID"
          colorScheme="DARK"
          mapTypeId={mapStyle}
          defaultCenter={{ lat: 36, lng: 14 }}
          defaultZoom={3}
          minZoom={2}
          maxZoom={16}
          gestureHandling="greedy"
          disableDefaultUI={true}
          internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
          onDragstart={() => onUserInteract()}
          style={{ width: '100%', height: '100%' }}
        >
          <GeospatialLayersOverlay
            dishes={dishes}
            dishById={dishById}
            filteredIds={filteredIds}
            selectedDishId={selectedDishId}
            layers={layers}
          />

          <MapCameraChoreographer
            dishById={dishById}
            selectedDishId={selectedDishId}
            presenterMode={presenterMode}
            isHudHidden={isHudHidden}
          />

          {dishes.map((dish) => {
            const isMatched = filteredIds.has(dish.id);
            if (!isMatched) return null;

            const isSelected = selectedDishId === dish.id;
            const isHovered = hoveredDishId === dish.id;
            const tasteMeta = TASTE_META[dish.primaryTaste];
            const barHeight = layers.columns
              ? Math.round(14 + (dish.intensity / 100) * 22)
              : 10;

            return (
              <AdvancedMarker
                key={dish.id}
                position={{ lat: dish.lat, lng: dish.lon }}
                title={`${dish.name} — ${dish.city}, ${dish.country}`}
                zIndex={isSelected ? 1000 : isHovered ? 500 : dish.intensity}
                onClick={() => onSelectDish(dish.id)}
              >
                <div
                  onMouseEnter={() => setHoveredDishId(dish.id)}
                  onMouseLeave={() => setHoveredDishId(null)}
                  className="relative flex flex-col items-center cursor-pointer select-none group"
                >
                  {/* Floating Label on Active or Hover */}
                  {(isSelected || isHovered) && (
                    <div className="mb-1.5 px-2.5 py-1 rounded-md bg-[#121822] border border-white/20 shadow-xl whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-[11px] font-medium text-[#F4F1EA]">
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: tasteMeta.color }}
                        />
                        <span>{dish.city}</span>
                        <span className="text-[#9AA5B4]">·</span>
                        <span className="text-[#C7D0DC]">{dish.name}</span>
                      </div>
                    </div>
                  )}

                  {/* Vertical Sensory Column Marker */}
                  <div className="flex flex-col items-center">
                    <div
                      className="rounded-full border border-[#F4F1EA]/80 shadow-md transition-transform duration-150"
                      style={{
                        width: isSelected ? 12 : 9,
                        height: isSelected ? 12 : 9,
                        backgroundColor: tasteMeta.color,
                        transform:
                          isSelected || isHovered ? 'scale(1.2)' : 'scale(1)',
                      }}
                    />
                    {layers.columns && (
                      <div
                        className="w-1.5 rounded-b-sm transition-all duration-150"
                        style={{
                          height: isSelected ? barHeight + 8 : barHeight,
                          backgroundColor: tasteMeta.color,
                          opacity: isSelected ? 1 : 0.85,
                        }}
                      />
                    )}
                    <div
                      className="rounded-full border-2 transition-all duration-150"
                      style={{
                        width: isSelected ? 18 : 10,
                        height: isSelected ? 8 : 5,
                        borderColor: tasteMeta.color,
                        backgroundColor: `${tasteMeta.color}44`,
                      }}
                    />
                  </div>
                </div>
              </AdvancedMarker>
            );
          })}
        </GoogleMap>

        <MapsStatusOverlay onSwitchToGlobe={onSwitchToGlobe} />
      </APIProvider>
    </div>
  );
};
