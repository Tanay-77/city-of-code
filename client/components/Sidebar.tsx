'use client';

import { useCityStore } from '../hooks/useCityStore';

export default function Sidebar() {
  const repoData = useCityStore((s) => s.repoData);
  const selectedBuilding = useCityStore((s) => s.selectedBuilding);
  const sidebarOpen = useCityStore((s) => s.sidebarOpen);

  if (!repoData) return null;

  return (
    <div className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
      <div className="sidebar-section">
        <h2 className="sidebar-title">
          {repoData.owner}/{repoData.repo}
        </h2>
        <div className="sidebar-stats">
          <StatItem label="Files" value={repoData.totalFiles.toLocaleString()} />
          <StatItem label="Est. Lines" value={repoData.totalLines.toLocaleString()} />
          <StatItem label="Language" value={repoData.mainLanguage} />
          <StatItem label="Largest" value={truncate(repoData.largestFile, 28)} />
        </div>
      </div>

      {/* Language breakdown */}
      <div className="sidebar-section">
        <h3 className="sidebar-subtitle">Languages</h3>
        <div className="language-bars">
          {Object.entries(repoData.languageBreakdown)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 8)
            .map(([lang, pct]) => (
              <div key={lang} className="language-bar-row">
                <span className="language-bar-label">{lang}</span>
                <div className="language-bar-track">
                  <div
                    className="language-bar-fill"
                    style={{ width: `${Math.max(pct, 2)}%` }}
                  />
                </div>
                <span className="language-bar-pct">{pct}%</span>
              </div>
            ))}
        </div>
      </div>

      {/* Selected building info */}
      {selectedBuilding && (
        <div className="sidebar-section selected-building-info">
          <h3 className="sidebar-subtitle">Selected File</h3>
          <div className="selected-file-name">{selectedBuilding.name}</div>
          <div className="selected-file-path">{selectedBuilding.path}</div>
          <div className="sidebar-stats">
            <StatItem label="Lines" value={selectedBuilding.lines.toLocaleString()} />
            <StatItem label="Language" value={selectedBuilding.language} />
            <StatItem label="Commits" value={selectedBuilding.commitCount.toString()} />
            <StatItem label="Size" value={formatBytes(selectedBuilding.size)} />
          </div>
        </div>
      )}
    </div>
  );
}

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="stat-item">
      <span className="stat-label">{label}</span>
      <span className="stat-value">{value}</span>
    </div>
  );
}

function truncate(str: string, len: number): string {
  return str.length > len ? str.slice(0, len - 1) + '…' : str;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
