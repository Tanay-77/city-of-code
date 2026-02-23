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
  const sidebarOpen = useCityStore((s) => s.sidebarOpen);
  const setSidebarOpen = useCityStore((s) => s.setSidebarOpen);
  const toggleSidebar = useCityStore((s) => s.toggleSidebar);

  if (!repoData) return null;

  return (
    <div className="visualization-page">
      {/* Fullscreen 3D Canvas */}
      <CityScene />

      {/* Top Controls Bar */}
      <Controls />

      {/* Mobile sidebar toggle */}
      <button
        className="sidebar-toggle-btn"
        onClick={toggleSidebar}
        title="Toggle Sidebar"
        aria-label="Toggle sidebar"
      >
        <svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18">
          {sidebarOpen ? (
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          ) : (
            <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
          )}
        </svg>
      </button>

      {/* Mobile sidebar overlay */}
      <div
        className={`sidebar-overlay ${sidebarOpen ? 'sidebar-overlay-visible' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

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
