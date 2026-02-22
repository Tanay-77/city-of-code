'use client';

import { useCallback, useRef } from 'react';
import { useCityStore } from '../hooks/useCityStore';
import { VisualizationMode } from '../types';

const MODES: { value: VisualizationMode; label: string; icon: string }[] = [
  { value: 'structure', label: 'Structure', icon: '◻' },
  { value: 'activity', label: 'Activity', icon: '◉' },
  { value: 'language', label: 'Language', icon: '◈' },
];

export default function Controls() {
  const searchQuery = useCityStore((s) => s.searchQuery);
  const setSearchQuery = useCityStore((s) => s.setSearchQuery);
  const visualizationMode = useCityStore((s) => s.visualizationMode);
  const setVisualizationMode = useCityStore((s) => s.setVisualizationMode);
  const resetCamera = useCityStore((s) => s.resetCamera);
  const canvasContainerRef = useRef<HTMLDivElement | null>(null);

  const handleScreenshot = useCallback(() => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return;

    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `codebase-city-${Date.now()}.png`;
      a.click();
      URL.revokeObjectURL(url);
    }, 'image/png');
  }, []);

  return (
    <div className="controls-bar">
      {/* Search */}
      <div className="control-group search-group">
        <svg className="search-icon" viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
          <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
        </svg>
        <input
          type="text"
          className="search-input"
          placeholder="Search files..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <button className="search-clear" onClick={() => setSearchQuery('')}>
            ✕
          </button>
        )}
      </div>

      {/* Mode Toggle */}
      <div className="control-group mode-toggle">
        {MODES.map((mode) => (
          <button
            key={mode.value}
            className={`mode-btn ${visualizationMode === mode.value ? 'active' : ''}`}
            onClick={() => setVisualizationMode(mode.value)}
            title={mode.label}
          >
            <span className="mode-icon">{mode.icon}</span>
            <span className="mode-label">{mode.label}</span>
          </button>
        ))}
      </div>

      {/* Actions */}
      <div className="control-group actions-group">
        <button className="action-btn" onClick={resetCamera} title="Reset Camera">
          <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
            <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
          </svg>
        </button>
        <button className="action-btn" onClick={handleScreenshot} title="Screenshot">
          <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
            <path fillRule="evenodd" d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1.586a1 1 0 01-.707-.293l-1.121-1.121A2 2 0 0011.172 3H8.828a2 2 0 00-1.414.586L6.293 4.707A1 1 0 015.586 5H4zm6 9a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  );
}
