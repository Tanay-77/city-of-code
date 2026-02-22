'use client';

import { useState, FormEvent } from 'react';

interface LandingPageProps {
  onGenerate: (url: string) => void;
}

export default function LandingPage({ onGenerate }: LandingPageProps) {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmed = url.trim();
    if (!trimmed) {
      setError('Please enter a GitHub repository URL.');
      return;
    }

    const pattern = /^https?:\/\/(www\.)?github\.com\/[a-zA-Z0-9\-_.]+\/[a-zA-Z0-9\-_.]+/;
    if (!pattern.test(trimmed)) {
      setError('Invalid URL. Use format: https://github.com/owner/repo');
      return;
    }

    onGenerate(trimmed);
  };

  return (
    <div className="landing-page">
      {/* Background grid effect */}
      <div className="landing-grid-bg" />

      <div className="landing-content">
        {/* Logo / Brand */}
        <div className="landing-brand">
          <div className="brand-icon">
            <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" width="48" height="48">
              <rect x="4" y="20" width="8" height="16" rx="1" fill="#888" opacity="0.6" />
              <rect x="16" y="10" width="8" height="26" rx="1" fill="#aaa" opacity="0.8" />
              <rect x="28" y="14" width="8" height="22" rx="1" fill="#999" opacity="0.7" />
              <rect x="10" y="24" width="8" height="12" rx="1" fill="#bbb" opacity="0.5" />
              <rect x="22" y="18" width="8" height="18" rx="1" fill="#ccc" opacity="0.6" />
            </svg>
          </div>
          <span className="brand-label">CODEBASE CITY</span>
        </div>

        {/* Headline */}
        <h1 className="landing-headline">
          Turn Your GitHub Repository
          <br />
          Into a <span className="headline-accent">Living 3D City</span>
        </h1>

        <p className="landing-subtitle">
          Visualize your codebase as an interactive architectural model.
          <br />
          Every file becomes a building. Every folder becomes a district.
        </p>

        {/* Form */}
        <form className="landing-form" onSubmit={handleSubmit}>
          <div className="input-wrapper">
            <svg className="input-icon" viewBox="0 0 20 20" fill="currentColor" width="20" height="20">
              <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            <input
              type="text"
              className="url-input"
              placeholder="https://github.com/owner/repository"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                setError('');
              }}
              autoFocus
            />
          </div>
          {error && <p className="landing-error">{error}</p>}
          <button type="submit" className="generate-btn">
            Generate City
            <svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18">
              <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </form>

        {/* Example repos */}
        <div className="landing-examples">
          <span className="examples-label">Try:</span>
          {[
            'https://github.com/facebook/react',
            'https://github.com/vercel/next.js',
            'https://github.com/denoland/deno',
          ].map((repo) => (
            <button
              key={repo}
              className="example-btn"
              onClick={() => {
                setUrl(repo);
                setError('');
              }}
            >
              {repo.replace('https://github.com/', '')}
            </button>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="landing-footer">
        <span>Built with Next.js, Three.js &amp; GitHub API</span>
      </div>
    </div>
  );
}
