import { create } from 'zustand';
import { RepoData, VisualizationMode, BuildingData, CityLayout } from '../types';
import { generateCityLayout } from '../utils/cityGenerator';

interface CityStore {
  // Data state
  repoData: RepoData | null;
  cityLayout: CityLayout | null;
  isLoading: boolean;
  error: string | null;
  loadingStage: string;

  // Interaction state
  hoveredBuilding: BuildingData | null;
  selectedBuilding: BuildingData | null;
  searchQuery: string;
  highlightedBuildings: Set<string>;
  visualizationMode: VisualizationMode;

  // Camera
  cameraTarget: [number, number, number] | null;

  // UI state
  sidebarOpen: boolean;

  // Actions
  setRepoData: (data: RepoData) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setLoadingStage: (stage: string) => void;
  setHoveredBuilding: (building: BuildingData | null) => void;
  setSelectedBuilding: (building: BuildingData | null) => void;
  setSearchQuery: (query: string) => void;
  setVisualizationMode: (mode: VisualizationMode) => void;
  setCameraTarget: (target: [number, number, number] | null) => void;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  resetCamera: () => void;
  reset: () => void;
}

export const useCityStore = create<CityStore>((set, get) => ({
  // Initial state
  repoData: null,
  cityLayout: null,
  isLoading: false,
  error: null,
  loadingStage: '',
  hoveredBuilding: null,
  selectedBuilding: null,
  searchQuery: '',
  highlightedBuildings: new Set(),
  visualizationMode: 'structure',
  cameraTarget: null,
  sidebarOpen: false,

  // Actions
  setRepoData: (data: RepoData) => {
    const layout = generateCityLayout(data);
    set({
      repoData: data,
      cityLayout: layout,
      isLoading: false,
      error: null,
      loadingStage: '',
    });
  },

  setLoading: (loading: boolean) => set({ isLoading: loading }),
  setError: (error: string | null) => set({ error, isLoading: false, loadingStage: '' }),
  setLoadingStage: (stage: string) => set({ loadingStage: stage }),

  setHoveredBuilding: (building: BuildingData | null) => set({ hoveredBuilding: building }),

  setSelectedBuilding: (building: BuildingData | null) => {
    if (building) {
      set({
        selectedBuilding: building,
        cameraTarget: [building.x, building.height / 2, building.z],
      });
    } else {
      set({ selectedBuilding: null });
    }
  },

  setSearchQuery: (query: string) => {
    const layout = get().cityLayout;
    if (!layout) {
      set({ searchQuery: query, highlightedBuildings: new Set() });
      return;
    }

    const q = query.toLowerCase().trim();
    if (!q) {
      set({ searchQuery: query, highlightedBuildings: new Set() });
      return;
    }

    const matches = new Set<string>();
    layout.buildings.forEach((b) => {
      if (
        b.name.toLowerCase().includes(q) ||
        b.path.toLowerCase().includes(q) ||
        b.language.toLowerCase().includes(q)
      ) {
        matches.add(b.path);
      }
    });

    set({ searchQuery: query, highlightedBuildings: matches });
  },

  setVisualizationMode: (mode: VisualizationMode) => set({ visualizationMode: mode }),

  setCameraTarget: (target: [number, number, number] | null) => set({ cameraTarget: target }),

  setSidebarOpen: (open: boolean) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

  resetCamera: () => set({ cameraTarget: null, selectedBuilding: null }),

  reset: () =>
    set({
      repoData: null,
      cityLayout: null,
      isLoading: false,
      error: null,
      loadingStage: '',
      hoveredBuilding: null,
      selectedBuilding: null,
      searchQuery: '',
      highlightedBuildings: new Set(),
      visualizationMode: 'structure',
      cameraTarget: null,
      sidebarOpen: false,
    }),
}));
