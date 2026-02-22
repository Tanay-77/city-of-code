'use client';

import dynamic from 'next/dynamic';
import Sidebar from './Sidebar';
import Controls from './Controls';
import { useCityStore } from '../hooks/useCityStore';

// Dynamically import CityScene to avoid SSR issues with Three.js
const CityScene = dynamic(() => import('./scene/CityScene'), {
  ssr: false,
  loading: () => (
    <div className="scene-loading">
      <div className="scene-loading-spinner" />
    </div>
  ),
});

export default function VisualizationView() {
  const repoData = useCityStore((s) => s.repoData);
  const error = useCityStore((s) => s.error);
  const reset = useCityStore((s) => s.reset);

  if (!repoData) return null;

  return (
    <div className="visualization-page">
      {/* Fullscreen 3D Canvas */}
      <CityScene />

      {/* Top Controls Bar */}
      <Controls />

      {/* Right Sidebar */}
      <Sidebar />

      {/* Error toast */}
      {error && (
        <div className="error-toast">
          <span>{error}</span>
          <button onClick={() => useCityStore.getState().setError(null)}>✕</button>
        </div>
      )}

      {/* Back button */}
      <button className="back-btn" onClick={reset} title="Back to home">
        <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
          <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
        </svg>
      </button>
    </div>
  );
}
