import React from 'react';
import { TASTE_META, TASTE_ORDER } from '../data/culinaryData';
import { FlavorProfile, TasteCategory } from '../types/culinary';

interface FlavorRadarProps {
  profile: FlavorProfile;
  accentColor: string;
  secondaryProfile?: FlavorProfile;
  secondaryColor?: string;
  size?: number;
}

export const FlavorRadar: React.FC<FlavorRadarProps> = ({
  profile,
  accentColor,
  secondaryProfile,
  secondaryColor = '#9AA5B4',
  size = 180,
}) => {
  const cx = size / 2;
  const cy = size / 2;
  const maxRadius = size * 0.34;
  const levels = [25, 50, 75, 100];

  const getPoint = (index: number, value: number) => {
    const angle = -Math.PI / 2 + (index * 2 * Math.PI) / TASTE_ORDER.length;
    const r = (value / 100) * maxRadius;
    return {
      x: cx + Math.cos(angle) * r,
      y: cy + Math.sin(angle) * r,
    };
  };

  const buildPolygonPoints = (prof: FlavorProfile) =>
    TASTE_ORDER.map((axis: TasteCategory, i: number) => {
      const pt = getPoint(i, prof[axis]);
      return `${pt.x.toFixed(1)},${pt.y.toFixed(1)}`;
    }).join(' ');

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="block select-none"
      role="img"
      aria-label="5-axis sensory flavor profile chart"
    >
      {/* Concentric pentagon grid rings */}
      {levels.map((lvl) => (
        <polygon
          key={lvl}
          points={TASTE_ORDER.map((_, i) => {
            const pt = getPoint(i, lvl);
            return `${pt.x.toFixed(1)},${pt.y.toFixed(1)}`;
          }).join(' ')}
          fill="none"
          stroke="rgba(255,255,255,0.09)"
          strokeWidth={1}
        />
      ))}

      {/* Axis spokes */}
      {TASTE_ORDER.map((axis, i) => {
        const edge = getPoint(i, 100);
        return (
          <line
            key={axis}
            x1={cx}
            y1={cy}
            x2={edge.x}
            y2={edge.y}
            stroke="rgba(255,255,255,0.09)"
            strokeWidth={1}
          />
        );
      })}

      {/* Optional secondary comparison polygon */}
      {secondaryProfile && (
        <polygon
          points={buildPolygonPoints(secondaryProfile)}
          fill={secondaryColor}
          fillOpacity={0.16}
          stroke={secondaryColor}
          strokeWidth={1.5}
          strokeDasharray="3 3"
        />
      )}

      {/* Primary flavor polygon */}
      <polygon
        points={buildPolygonPoints(profile)}
        fill={accentColor}
        fillOpacity={0.24}
        stroke={accentColor}
        strokeWidth={2}
      />

      {/* Vertex markers */}
      {TASTE_ORDER.map((axis, i) => {
        const pt = getPoint(i, profile[axis]);
        return (
          <circle
            key={`pt-${axis}`}
            cx={pt.x}
            cy={pt.y}
            r={3}
            fill={TASTE_META[axis].color}
            stroke="#121822"
            strokeWidth={1.2}
          />
        );
      })}

      {/* Axis labels */}
      {TASTE_ORDER.map((axis, i) => {
        const labelPt = getPoint(i, 126);
        const anchor =
          Math.abs(labelPt.x - cx) < 6
            ? 'middle'
            : labelPt.x > cx
            ? 'start'
            : 'end';
        return (
          <text
            key={`lbl-${axis}`}
            x={labelPt.x}
            y={labelPt.y + 3}
            textAnchor={anchor}
            fill="#C7D0DC"
            fontSize="10"
            fontWeight="500"
            fontFamily="Plus Jakarta Sans, sans-serif"
          >
            {TASTE_META[axis].shortLabel}
          </text>
        );
      })}
    </svg>
  );
};
