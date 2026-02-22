import { RepoData, BuildingData, BuildingType, CityLayout, District, RoadSegment } from '../types';

const MAX_BUILDINGS = 1000;
const BASE_HEIGHT_SCALE = 0.012;
const BASE_WIDTH_SCALE = 0.0005;
const MIN_HEIGHT = 0.4;
const MAX_HEIGHT = 30;
const MIN_WIDTH = 0.5;
const MAX_WIDTH = 2.8;
const BUILDING_GAP = 0.25;  // tiny gap between buildings (like real city alleys)
const ROAD_W = 1.4;         // road width — narrow like real 2-lane street
const SIDEWALK = 0.35;      // thin sidewalk strip between road and buildings
const BLOCK_SIZE = 4;       // buildings per city-block side (4x4 = 16 buildings per block)
const CELL = MAX_WIDTH + BUILDING_GAP; // one building cell
const ROAD_TOTAL = ROAD_W + SIDEWALK * 2; // road + sidewalks on both sides

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
    buildings.push(...layoutBuildingsInDistrict(group.files, x, z));
  });

  const gridSize = Math.max(
    ...buildings.map((b) => Math.max(Math.abs(b.x) + b.width, Math.abs(b.z) + b.depth)),
    20,
  );

  const roads = computeRoads(districts, gridSize);

  console.log('[CityGen] districts:', districts.length, 'buildings:', buildings.length, 'roads:', roads.length, 'gridSize:', gridSize);
  if (roads.length > 0) console.log('[CityGen] sample road:', roads[0]);

  return { buildings, districts, roads, gridSize };
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
/*  District layout (rows of districts along X, wrapping in Z)        */
/* ------------------------------------------------------------------ */

interface DistrictPosition {
  group: FolderGroup;
  x: number;
  z: number;
  gridWidth: number;
  gridDepth: number;
}

function districtContentSize(fileCount: number): { w: number; d: number; cols: number; rows: number } {
  const cols = Math.ceil(Math.sqrt(fileCount));
  const rows = Math.ceil(fileCount / cols);
  const blockCols = Math.ceil(cols / BLOCK_SIZE);
  const blockRows = Math.ceil(rows / BLOCK_SIZE);
  const w = cols * CELL + Math.max(0, blockCols - 1) * ROAD_TOTAL;
  const d = rows * CELL + Math.max(0, blockRows - 1) * ROAD_TOTAL;
  return { w, d, cols, rows };
}

function calculateDistrictPositions(groups: FolderGroup[]): DistrictPosition[] {
  const positions: DistrictPosition[] = [];

  let currentX = 0;
  let currentZ = 0;
  let maxRowDepth = 0;
  let rowWidth = 0;
  const MAX_ROW_WIDTH = 140;

  groups.forEach((group) => {
    const { w, d } = districtContentSize(group.files.length);
    const gridWidth = w;
    const gridDepth = d;

    if (rowWidth > 0 && rowWidth + ROAD_TOTAL + gridWidth > MAX_ROW_WIDTH) {
      currentX = 0;
      currentZ += maxRowDepth + ROAD_TOTAL;
      rowWidth = 0;
      maxRowDepth = 0;
    }

    positions.push({
      group,
      x: currentX + gridWidth / 2,
      z: currentZ + gridDepth / 2,
      gridWidth,
      gridDepth,
    });

    currentX += gridWidth + ROAD_TOTAL;
    rowWidth += gridWidth + ROAD_TOTAL;
    maxRowDepth = Math.max(maxRowDepth, gridDepth);
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
): BuildingData[] {
  const cols = Math.ceil(Math.sqrt(files.length));
  const totalRows = Math.ceil(files.length / cols);
  const blockCols = Math.ceil(cols / BLOCK_SIZE);
  const blockRows = Math.ceil(totalRows / BLOCK_SIZE);

  const contentW = cols * CELL + Math.max(0, blockCols - 1) * ROAD_TOTAL;
  const contentD = totalRows * CELL + Math.max(0, blockRows - 1) * ROAD_TOTAL;

  return files.map((file, index) => {
    const col = index % cols;
    const row = Math.floor(index / cols);

    const blockCol = Math.floor(col / BLOCK_SIZE);
    const blockRow = Math.floor(row / BLOCK_SIZE);

    const height = clamp(file.lines * BASE_HEIGHT_SCALE, MIN_HEIGHT, MAX_HEIGHT);
    const width = clamp(file.size * BASE_WIDTH_SCALE, MIN_WIDTH, MAX_WIDTH);
    const depth = width * (0.8 + Math.random() * 0.4);

    // Position: cell center + road offsets for each block boundary
    const localX = col * CELL + blockCol * ROAD_TOTAL + CELL / 2 - contentW / 2;
    const localZ = row * CELL + blockRow * ROAD_TOTAL + CELL / 2 - contentD / 2;

    const emissiveIntensity = file.isFrequentlyUpdated
      ? 0.6 + Math.random() * 0.4
      : 0.05 + Math.random() * 0.1;

    const buildingType = classifyBuilding(height, width);
    const hasSetback = (buildingType === 'skyscraper' || buildingType === 'tower') && Math.random() < 0.65;
    const setbackRatio = hasSetback ? 0.55 + Math.random() * 0.25 : 1;
    const setbackHeight = hasSetback ? 0.5 + Math.random() * 0.25 : 1;
    const roofType = chooseRoofType(buildingType);
    const wallTint = Math.random();

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

/* ------------------------------------------------------------------ */
/*  Road computation — proper city grid                               */
/* ------------------------------------------------------------------ */

function computeRoads(districts: District[], gridSize: number): RoadSegment[] {
  const roads: RoadSegment[] = [];
  const extent = gridSize + 5; // roads extend a bit beyond city edge

  // Collect all road-center X and Z positions from:
  // 1) Between districts (at district edges)
  // 2) Inside districts (between blocks)
  const roadXs = new Set<number>();
  const roadZs = new Set<number>();

  districts.forEach((d) => {
    const hw = d.width / 2;
    const hd = d.depth / 2;

    // Outer edges of district = road centers
    roadXs.add(round2(d.x - hw - ROAD_TOTAL / 2));
    roadXs.add(round2(d.x + hw + ROAD_TOTAL / 2));
    roadZs.add(round2(d.z - hd - ROAD_TOTAL / 2));
    roadZs.add(round2(d.z + hd + ROAD_TOTAL / 2));

    // Internal roads between blocks
    const n = d.fileCount;
    const cols = Math.ceil(Math.sqrt(n));
    const rows = Math.ceil(n / cols);
    const blockCols = Math.ceil(cols / BLOCK_SIZE);
    const blockRows = Math.ceil(rows / BLOCK_SIZE);
    const cw = cols * CELL + Math.max(0, blockCols - 1) * ROAD_TOTAL;
    const cd = rows * CELL + Math.max(0, blockRows - 1) * ROAD_TOTAL;

    for (let bc = 0; bc < blockCols - 1; bc++) {
      const rx = (bc + 1) * BLOCK_SIZE * CELL + bc * ROAD_TOTAL + ROAD_TOTAL / 2 - cw / 2;
      roadXs.add(round2(d.x + rx));
    }
    for (let br = 0; br < blockRows - 1; br++) {
      const rz = (br + 1) * BLOCK_SIZE * CELL + br * ROAD_TOTAL + ROAD_TOTAL / 2 - cd / 2;
      roadZs.add(round2(d.z + rz));
    }
  });

  // Dedupe close values
  const dedup = (vals: number[]) => {
    const sorted = [...vals].sort((a, b) => a - b);
    const result: number[] = [];
    for (const v of sorted) {
      if (result.length === 0 || Math.abs(v - result[result.length - 1]) > 0.8) {
        result.push(v);
      } else {
        result[result.length - 1] = (result[result.length - 1] + v) / 2;
      }
    }
    return result;
  };

  const xs = dedup([...roadXs]);
  const zs = dedup([...roadZs]);

  // Create full-span road strips (each road spans the entire city extent)
  xs.forEach((x) => {
    roads.push({ x, z: 0, width: ROAD_W, depth: extent * 2 });
  });
  zs.forEach((z) => {
    roads.push({ x: 0, z, width: extent * 2, depth: ROAD_W });
  });

  return roads;
}

function round2(n: number) { return Math.round(n * 100) / 100; }

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
