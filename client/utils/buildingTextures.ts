'use client';

import { useMemo } from 'react';
import * as THREE from 'three';

// Generate a procedural window facade texture via Canvas2D
// Returns a DataTexture that can be used as a map on building materials

interface WindowTextureOptions {
  width?: number;
  height?: number;
  rows?: number;
  cols?: number;
  baseColor?: string;
  windowColor?: string;
  litColor?: string;
  litChance?: number;
  windowGap?: number;
}

export function createWindowTexture(options: WindowTextureOptions = {}): THREE.CanvasTexture {
  const {
    width = 256,
    height = 512,
    rows = 16,
    cols = 6,
    baseColor = '#c8c4be',
    windowColor = '#2a2e35',
    litColor = '#ffeed0',
    litChance = 0.35,
    windowGap = 0.25, // fraction of cell used for gap/wall
  } = options;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  // Fill base wall color
  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, width, height);

  const cellW = width / cols;
  const cellH = height / rows;
  const gapX = cellW * windowGap;
  const gapY = cellH * windowGap;
  const winW = cellW - gapX * 2;
  const winH = cellH - gapY * 2;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const x = col * cellW + gapX;
      const y = row * cellH + gapY;

      // Skip ground floor windows for first row (make it a lobby)
      if (row === rows - 1) {
        // Lobby — larger opening
        ctx.fillStyle = '#4a4e55';
        ctx.fillRect(col * cellW + gapX * 0.5, y, cellW - gapX, cellH - gapY);
        continue;
      }

      // Determine if window is lit
      const isLit = Math.random() < litChance;
      ctx.fillStyle = isLit ? litColor : windowColor;

      // Draw window with slight rounded corners via fillRect
      ctx.fillRect(x, y, winW, winH);

      // Add subtle reflection line on dark windows
      if (!isLit) {
        ctx.fillStyle = 'rgba(120, 140, 170, 0.15)';
        ctx.fillRect(x, y, winW, winH * 0.3);
      }
    }
  }

  // Add subtle horizontal floor lines
  ctx.strokeStyle = 'rgba(0,0,0,0.06)';
  ctx.lineWidth = 1;
  for (let row = 1; row < rows; row++) {
    ctx.beginPath();
    ctx.moveTo(0, row * cellH);
    ctx.lineTo(width, row * cellH);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.needsUpdate = true;

  return texture;
}

// Skyscraper texture — taller windows, more glass
export function createSkyscraperTexture(): THREE.CanvasTexture {
  return createWindowTexture({
    width: 256,
    height: 512,
    rows: 24,
    cols: 8,
    baseColor: '#b8bcc5',
    windowColor: '#1e2530',
    litColor: '#ffe8b0',
    litChance: 0.45,
    windowGap: 0.15,
  });
}

// Office texture — standard windows
export function createOfficeTexture(): THREE.CanvasTexture {
  return createWindowTexture({
    width: 256,
    height: 256,
    rows: 8,
    cols: 5,
    baseColor: '#d0ccc5',
    windowColor: '#2a3040',
    litColor: '#fff0c8',
    litChance: 0.3,
    windowGap: 0.2,
  });
}

// Low-rise texture — fewer, bigger windows
export function createLowRiseTexture(): THREE.CanvasTexture {
  return createWindowTexture({
    width: 128,
    height: 128,
    rows: 3,
    cols: 3,
    baseColor: '#d8d4cc',
    windowColor: '#354050',
    litColor: '#ffeaaa',
    litChance: 0.25,
    windowGap: 0.25,
  });
}

// Glass tower texture — almost all glass
export function createGlassTowerTexture(): THREE.CanvasTexture {
  return createWindowTexture({
    width: 256,
    height: 512,
    rows: 30,
    cols: 10,
    baseColor: '#606872',
    windowColor: '#283040',
    litColor: '#d0e8ff',
    litChance: 0.5,
    windowGap: 0.06,
  });
}

// Hook to create and cache all building textures
export function useBuildingTextures() {
  return useMemo(() => {
    return {
      skyscraper: createSkyscraperTexture(),
      glassTower: createGlassTowerTexture(),
      office: createOfficeTexture(),
      lowRise: createLowRiseTexture(),
    };
  }, []);
}
