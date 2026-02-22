'use client';

import { Html } from '@react-three/drei';
import { useCityStore } from '../../hooks/useCityStore';

export default function BuildingTooltip() {
  const hoveredBuilding = useCityStore((s) => s.hoveredBuilding);

  if (!hoveredBuilding) return null;

  return (
    <Html
      position={[hoveredBuilding.x, hoveredBuilding.height + 0.8, hoveredBuilding.z]}
      center
      distanceFactor={20}
      style={{ pointerEvents: 'none' }}
    >
      <div className="building-tooltip">
        <div className="tooltip-header">
          <div
            className="tooltip-lang-dot"
            style={{ backgroundColor: hoveredBuilding.color }}
          />
          <span className="tooltip-filename">{hoveredBuilding.name}</span>
        </div>
        <div className="tooltip-path">{hoveredBuilding.path}</div>
        <div className="tooltip-stats">
          <div className="tooltip-stat">
            <span className="tooltip-label">Lines</span>
            <span className="tooltip-value">{hoveredBuilding.lines.toLocaleString()}</span>
          </div>
          <div className="tooltip-stat">
            <span className="tooltip-label">Language</span>
            <span className="tooltip-value">{hoveredBuilding.language}</span>
          </div>
          <div className="tooltip-stat">
            <span className="tooltip-label">Commits</span>
            <span className="tooltip-value">{hoveredBuilding.commitCount}</span>
          </div>
          <div className="tooltip-stat">
            <span className="tooltip-label">Size</span>
            <span className="tooltip-value">{formatBytes(hoveredBuilding.size)}</span>
          </div>
        </div>
      </div>
    </Html>
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
