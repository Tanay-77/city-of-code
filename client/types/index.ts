// Shared types for Codebase City

export interface RepoFile {
  path: string;
  name: string;
  size: number;
  lines: number;
  language: string;
  color: string;
  folder: string;
  commitCount: number;
  isFrequentlyUpdated: boolean;
}

export interface RepoData {
  owner: string;
  repo: string;
  totalFiles: number;
  totalLines: number;
  mainLanguage: string;
  largestFile: string;
  languageBreakdown: Record<string, number>;
  files: RepoFile[];
  folders: string[];
  fetchedAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  cached: boolean;
  error?: {
    message: string;
    code: string;
  };
}

export type VisualizationMode = 'structure' | 'activity' | 'language';

export type BuildingType = 'skyscraper' | 'tower' | 'office' | 'low-rise' | 'shed';

export interface BuildingData extends RepoFile {
  // Computed visualization properties
  height: number;
  width: number;
  depth: number;
  x: number;
  y: number;
  z: number;
  emissiveIntensity: number;
  buildingType: BuildingType;
  // Architectural details
  hasSetback: boolean;    // tall buildings get a narrower top section
  setbackRatio: number;   // how much narrower the top is (0.5-0.8)
  setbackHeight: number;  // where the setback starts (fraction of total height)
  roofType: 'flat' | 'antenna' | 'helipad' | 'mechanical';
  wallTint: number;       // subtle per-building color variation (0-1)
}

export interface CityLayout {
  buildings: BuildingData[];
  districts: District[];
  gridSize: number;
}

export interface District {
  name: string;
  x: number;
  z: number;
  width: number;
  depth: number;
  fileCount: number;
}
