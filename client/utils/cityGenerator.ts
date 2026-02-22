import { RepoData, BuildingData, CityLayout, District } from '../types';

const MAX_BUILDINGS = 1000;
const BASE_HEIGHT_SCALE = 0.008; // Lines of code -> height multiplier
const BASE_WIDTH_SCALE = 0.0004; // File size -> width multiplier
const MIN_HEIGHT = 0.3;
const MAX_HEIGHT = 25;
const MIN_WIDTH = 0.3;
const MAX_WIDTH = 3.0;
const BUILDING_GAP = 0.4;

interface FolderGroup {
  folder: string;
  files: RepoData['files'];
}

export function generateCityLayout(data: RepoData): CityLayout {
  const files = data.files.slice(0, MAX_BUILDINGS);

  // Group files by top-level folder
  const folderGroups = groupByFolder(files);

  // Calculate district positions in a grid
  const districts: District[] = [];
  const buildings: BuildingData[] = [];

  // Arrange districts in a spiral pattern from center
  const districtPositions = calculateDistrictPositions(folderGroups);

  districtPositions.forEach(({ group, x, z, gridWidth, gridDepth }) => {
    const district: District = {
      name: group.folder,
      x,
      z,
      width: gridWidth,
      depth: gridDepth,
      fileCount: group.files.length,
    };
    districts.push(district);

    // Place buildings within the district
    const districtBuildings = layoutBuildingsInDistrict(group.files, x, z, gridWidth, gridDepth);
    buildings.push(...districtBuildings);
  });

  // Calculate overall grid size
  const gridSize = Math.max(
    ...buildings.map((b) => Math.max(Math.abs(b.x) + b.width, Math.abs(b.z) + b.depth)),
    20,
  );

  return { buildings, districts, gridSize };
}

function groupByFolder(files: RepoData['files']): FolderGroup[] {
  const groups = new Map<string, RepoData['files']>();

  files.forEach((file) => {
    // Use top-level folder as district
    const topFolder = file.folder === '/' ? '/' : file.folder.split('/')[0];
    if (!groups.has(topFolder)) {
      groups.set(topFolder, []);
    }
    groups.get(topFolder)!.push(file);
  });

  return Array.from(groups.entries())
    .map(([folder, files]) => ({ folder, files }))
    .sort((a, b) => b.files.length - a.files.length);
}

interface DistrictPosition {
  group: FolderGroup;
  x: number;
  z: number;
  gridWidth: number;
  gridDepth: number;
}

function calculateDistrictPositions(groups: FolderGroup[]): DistrictPosition[] {
  const positions: DistrictPosition[] = [];
  const DISTRICT_PADDING = 3;

  // Use a simple grid layout with spiral placement
  let currentX = 0;
  let currentZ = 0;
  let maxRowHeight = 0;
  let rowWidth = 0;
  const MAX_ROW_WIDTH = 80;

  groups.forEach((group) => {
    const cols = Math.ceil(Math.sqrt(group.files.length));
    const rows = Math.ceil(group.files.length / cols);
    const gridWidth = cols * (MAX_WIDTH + BUILDING_GAP) + DISTRICT_PADDING;
    const gridDepth = rows * (MAX_WIDTH + BUILDING_GAP) + DISTRICT_PADDING;

    if (rowWidth + gridWidth > MAX_ROW_WIDTH) {
      // New row
      currentX = 0;
      currentZ += maxRowHeight + DISTRICT_PADDING;
      rowWidth = 0;
      maxRowHeight = 0;
    }

    positions.push({
      group,
      x: currentX + gridWidth / 2,
      z: currentZ + gridDepth / 2,
      gridWidth,
      gridDepth,
    });

    currentX += gridWidth + DISTRICT_PADDING;
    rowWidth += gridWidth + DISTRICT_PADDING;
    maxRowHeight = Math.max(maxRowHeight, gridDepth);
  });

  // Center the entire layout around origin
  if (positions.length > 0) {
    const minX = Math.min(...positions.map((p) => p.x - p.gridWidth / 2));
    const maxX = Math.max(...positions.map((p) => p.x + p.gridWidth / 2));
    const minZ = Math.min(...positions.map((p) => p.z - p.gridDepth / 2));
    const maxZ = Math.max(...positions.map((p) => p.z + p.gridDepth / 2));
    const centerX = (minX + maxX) / 2;
    const centerZ = (minZ + maxZ) / 2;
    positions.forEach((p) => {
      p.x -= centerX;
      p.z -= centerZ;
    });
  }

  return positions;
}

function layoutBuildingsInDistrict(
  files: RepoData['files'],
  districtX: number,
  districtZ: number,
  districtWidth: number,
  districtDepth: number,
): BuildingData[] {
  const cols = Math.ceil(Math.sqrt(files.length));
  const cellWidth = districtWidth / cols;
  const cellDepth = districtDepth / Math.ceil(files.length / cols);

  return files.map((file, index) => {
    const col = index % cols;
    const row = Math.floor(index / cols);

    const height = clamp(file.lines * BASE_HEIGHT_SCALE, MIN_HEIGHT, MAX_HEIGHT);
    const width = clamp(file.size * BASE_WIDTH_SCALE, MIN_WIDTH, MAX_WIDTH);
    const depth = width; // Keep buildings square-ish

    // Position within district
    const localX = (col - cols / 2 + 0.5) * cellWidth;
    const localZ = (row - Math.ceil(files.length / cols) / 2 + 0.5) * cellDepth;

    // Emissive intensity based on commit activity
    const emissiveIntensity = file.isFrequentlyUpdated ? 0.6 + Math.random() * 0.4 : 0.05 + Math.random() * 0.1;

    return {
      ...file,
      height,
      width,
      depth,
      x: districtX + localX,
      y: height / 2, // Buildings sit on ground
      z: districtZ + localZ,
      emissiveIntensity,
    };
  });
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
