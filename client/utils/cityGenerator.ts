import { RepoData, BuildingData, BuildingType, CityLayout, District } from '../types';

const MAX_BUILDINGS = 1000;
const BASE_HEIGHT_SCALE = 0.012; // Lines of code → height (boosted for drama)
const BASE_WIDTH_SCALE = 0.0005; // File size → width
const MIN_HEIGHT = 0.4;
const MAX_HEIGHT = 30;
const MIN_WIDTH = 0.5;
const MAX_WIDTH = 3.5;
const BUILDING_GAP = 0.6; // Gap between buildings inside a district
const ROAD_WIDTH = 2.0; // Visual road gap between districts

interface FolderGroup {
  folder: string;
  files: RepoData['files'];
}

/* ------------------------------------------------------------------ */
/*  Public API                                                        */
/* ------------------------------------------------------------------ */

export function generateCityLayout(data: RepoData): CityLayout {
  const files = data.files.slice(0, MAX_BUILDINGS);
  const folderGroups = groupByFolder(files);

  const districts: District[] = [];
  const buildings: BuildingData[] = [];
  const districtPositions = calculateDistrictPositions(folderGroups);

  districtPositions.forEach(({ group, x, z, gridWidth, gridDepth }) => {
    districts.push({
      name: group.folder,
      x,
      z,
      width: gridWidth,
      depth: gridDepth,
      fileCount: group.files.length,
    });
    buildings.push(...layoutBuildingsInDistrict(group.files, x, z, gridWidth, gridDepth));
  });

  const gridSize = Math.max(
    ...buildings.map((b) => Math.max(Math.abs(b.x) + b.width, Math.abs(b.z) + b.depth)),
    20,
  );

  return { buildings, districts, gridSize };
}

/* ------------------------------------------------------------------ */
/*  Folder grouping                                                   */
/* ------------------------------------------------------------------ */

function groupByFolder(files: RepoData['files']): FolderGroup[] {
  const groups = new Map<string, RepoData['files']>();

  files.forEach((file) => {
    const topFolder = file.folder === '/' ? '/' : file.folder.split('/')[0];
    if (!groups.has(topFolder)) groups.set(topFolder, []);
    groups.get(topFolder)!.push(file);
  });

  return Array.from(groups.entries())
    .map(([folder, files]) => ({ folder, files }))
    .sort((a, b) => b.files.length - a.files.length);
}

/* ------------------------------------------------------------------ */
/*  District layout                                                   */
/* ------------------------------------------------------------------ */

interface DistrictPosition {
  group: FolderGroup;
  x: number;
  z: number;
  gridWidth: number;
  gridDepth: number;
}

function calculateDistrictPositions(groups: FolderGroup[]): DistrictPosition[] {
  const positions: DistrictPosition[] = [];
  const DISTRICT_PADDING = ROAD_WIDTH + 1;

  let currentX = 0;
  let currentZ = 0;
  let maxRowHeight = 0;
  let rowWidth = 0;
  const MAX_ROW_WIDTH = 90;

  groups.forEach((group) => {
    const cols = Math.ceil(Math.sqrt(group.files.length));
    const rows = Math.ceil(group.files.length / cols);
    const gridWidth = cols * (MAX_WIDTH + BUILDING_GAP) + DISTRICT_PADDING;
    const gridDepth = rows * (MAX_WIDTH + BUILDING_GAP) + DISTRICT_PADDING;

    if (rowWidth + gridWidth > MAX_ROW_WIDTH) {
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

  // Center around origin
  if (positions.length > 0) {
    const minX = Math.min(...positions.map((p) => p.x - p.gridWidth / 2));
    const maxX = Math.max(...positions.map((p) => p.x + p.gridWidth / 2));
    const minZ = Math.min(...positions.map((p) => p.z - p.gridDepth / 2));
    const maxZ = Math.max(...positions.map((p) => p.z + p.gridDepth / 2));
    const cx = (minX + maxX) / 2;
    const cz = (minZ + maxZ) / 2;
    positions.forEach((p) => {
      p.x -= cx;
      p.z -= cz;
    });
  }

  return positions;
}

/* ------------------------------------------------------------------ */
/*  Building classification                                           */
/* ------------------------------------------------------------------ */

function classifyBuilding(height: number, width: number): BuildingType {
  if (height > 18) return 'skyscraper';
  if (height > 10 && width <= 1.8) return 'tower';
  if (height > 4) return 'office';
  if (height > 1.5) return 'low-rise';
  return 'shed';
}

function chooseRoofType(type: BuildingType): 'flat' | 'antenna' | 'helipad' | 'mechanical' {
  const r = Math.random();
  switch (type) {
    case 'skyscraper':
      if (r < 0.35) return 'antenna';
      if (r < 0.55) return 'helipad';
      if (r < 0.75) return 'mechanical';
      return 'flat';
    case 'tower':
      if (r < 0.3) return 'antenna';
      if (r < 0.5) return 'mechanical';
      return 'flat';
    case 'office':
      if (r < 0.25) return 'mechanical';
      return 'flat';
    default:
      return 'flat';
  }
}

/* ------------------------------------------------------------------ */
/*  Building placement within a district                              */
/* ------------------------------------------------------------------ */

function layoutBuildingsInDistrict(
  files: RepoData['files'],
  districtX: number,
  districtZ: number,
  districtWidth: number,
  districtDepth: number,
): BuildingData[] {
  const cols = Math.ceil(Math.sqrt(files.length));
  const totalRows = Math.ceil(files.length / cols);
  const cellWidth = districtWidth / cols;
  const cellDepth = districtDepth / totalRows;

  return files.map((file, index) => {
    const col = index % cols;
    const row = Math.floor(index / cols);

    const height = clamp(file.lines * BASE_HEIGHT_SCALE, MIN_HEIGHT, MAX_HEIGHT);
    const width = clamp(file.size * BASE_WIDTH_SCALE, MIN_WIDTH, MAX_WIDTH);
    const depth = width * (0.8 + Math.random() * 0.4); // Slightly rectangular

    const localX = (col - cols / 2 + 0.5) * cellWidth;
    const localZ = (row - totalRows / 2 + 0.5) * cellDepth;

    const emissiveIntensity = file.isFrequentlyUpdated
      ? 0.6 + Math.random() * 0.4
      : 0.05 + Math.random() * 0.1;

    const buildingType = classifyBuilding(height, width);

    // Setback for tall buildings (Art Deco style step-back)
    const hasSetback = (buildingType === 'skyscraper' || buildingType === 'tower') && Math.random() < 0.65;
    const setbackRatio = hasSetback ? 0.55 + Math.random() * 0.25 : 1;
    const setbackHeight = hasSetback ? 0.5 + Math.random() * 0.25 : 1; // fraction of height where setback starts

    const roofType = chooseRoofType(buildingType);
    const wallTint = Math.random(); // 0-1, used by renderer for per-building color variation

    return {
      ...file,
      height,
      width,
      depth,
      x: districtX + localX,
      y: height / 2,
      z: districtZ + localZ,
      emissiveIntensity,
      buildingType,
      hasSetback,
      setbackRatio,
      setbackHeight,
      roofType,
      wallTint,
    };
  });
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
