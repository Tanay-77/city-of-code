'use client';

import { useCallback } from 'react';
import LandingPage from '../client/components/LandingPage';
import VisualizationView from '../client/components/VisualizationView';
import LoadingAnimation from '../client/components/LoadingAnimation';
import { useCityStore } from '../client/hooks/useCityStore';
import { fetchRepoData } from '../client/utils/api';

export default function Home() {
  const repoData = useCityStore((s) => s.repoData);
  const isLoading = useCityStore((s) => s.isLoading);
  const error = useCityStore((s) => s.error);
  const setRepoData = useCityStore((s) => s.setRepoData);
  const setLoading = useCityStore((s) => s.setLoading);
  const setError = useCityStore((s) => s.setError);
  const setLoadingStage = useCityStore((s) => s.setLoadingStage);

  const handleGenerate = useCallback(
    async (url: string) => {
      setLoading(true);
      setError(null);
      setLoadingStage('Connecting to GitHub...');

      try {
        const data = await fetchRepoData(url);
        setRepoData(data);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to fetch repository data.';
        setError(message);
      }
    },
    [setRepoData, setLoading, setError, setLoadingStage],
  );

  // Loading state
  if (isLoading) {
    return <LoadingAnimation />;
  }

  // Visualization state
  if (repoData) {
    return <VisualizationView />;
  }

  // Landing state (default)
  return (
    <>
      {error && (
        <div className="global-error-banner">
          <span>{error}</span>
          <button onClick={() => setError(null)}>Dismiss</button>
        </div>
      )}
      <LandingPage onGenerate={handleGenerate} />
    </>
  );
}
