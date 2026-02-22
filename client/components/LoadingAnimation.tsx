'use client';

import { useEffect, useState } from 'react';

const STAGES = [
  'Scanning repository structure...',
  'Analyzing file hierarchy...',
  'Mapping code districts...',
  'Computing building heights...',
  'Assigning language colors...',
  'Laying out city grid...',
  'Generating 3D geometry...',
  'Applying materials and lighting...',
  'Finalizing city render...',
];

export default function LoadingAnimation() {
  const [stageIndex, setStageIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [blocks, setBlocks] = useState<Array<{ id: number; height: number; delay: number }>>([]);

  useEffect(() => {
    // Generate random city blocks for the loading animation
    const newBlocks = Array.from({ length: 30 }, (_, i) => ({
      id: i,
      height: 20 + Math.random() * 60,
      delay: Math.random() * 2,
    }));
    setBlocks(newBlocks);

    // Progress stages
    const interval = setInterval(() => {
      setStageIndex((prev) => {
        if (prev < STAGES.length - 1) return prev + 1;
        return prev;
      });
      setProgress((prev) => Math.min(prev + 8 + Math.random() * 6, 95));
    }, 800);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="loading-screen">
      <div className="loading-city">
        {blocks.map((block) => (
          <div
            key={block.id}
            className="loading-block"
            style={{
              height: `${block.height}px`,
              animationDelay: `${block.delay}s`,
            }}
          />
        ))}
      </div>

      <div className="loading-text-section">
        <h2 className="loading-title">Building Your City</h2>
        <p className="loading-stage">{STAGES[stageIndex]}</p>
        <div className="loading-bar-container">
          <div className="loading-bar" style={{ width: `${progress}%` }} />
        </div>
        <p className="loading-progress">{Math.round(progress)}%</p>
      </div>
    </div>
  );
}
