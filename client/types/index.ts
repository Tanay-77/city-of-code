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

export interface BuildingData extends RepoFile {
  // Computed visualization properties
  height: number;
  width: number;
  depth: number;
  x: number;
  y: number;
  z: number;
  emissiveIntensity: number;
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
