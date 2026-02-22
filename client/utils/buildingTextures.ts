'use client';

import { useMemo } from 'react';
import * as THREE from 'three';

// Generate a procedural window facade texture via Canvas2D

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
  trimColor?: string;        // horizontal trim between floors
  cornerPillar?: boolean;    // add vertical darker edge strips
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
    windowGap = 0.25,
    trimColor = 'rgba(0,0,0,0.08)',
    cornerPillar = false,
  } = options;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  // Fill base wall color
  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, width, height);

  // Add subtle wall noise for realism
  const imageData = ctx.getImageData(0, 0, width, height);
  for (let i = 0; i < imageData.data.length; i += 4) {
    const n = (Math.random() - 0.5) * 10;
    imageData.data[i] = Math.max(0, Math.min(255, imageData.data[i] + n));
    imageData.data[i + 1] = Math.max(0, Math.min(255, imageData.data[i + 1] + n));
    imageData.data[i + 2] = Math.max(0, Math.min(255, imageData.data[i + 2] + n));
  }
  ctx.putImageData(imageData, 0, 0);

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

      // Ground floor = lobby with larger darker windows
      if (row === rows - 1) {
        ctx.fillStyle = '#3a3e48';
        ctx.fillRect(col * cellW + gapX * 0.3, y, cellW - gapX * 0.6, cellH - gapY * 0.5);
        // Lobby canopy line
        ctx.fillStyle = 'rgba(0,0,0,0.15)';
        ctx.fillRect(col * cellW, y - 2, cellW, 3);
        continue;
      }

      const isLit = Math.random() < litChance;

      // Window frame (darker border)
      ctx.fillStyle = 'rgba(0,0,0,0.12)';
      ctx.fillRect(x - 1, y - 1, winW + 2, winH + 2);

      // Window glass
      if (isLit) {
        // Warm interior glow with gradient
        const grad = ctx.createLinearGradient(x, y, x, y + winH);
        grad.addColorStop(0, litColor);
        grad.addColorStop(1, shiftColor(litColor, -20));
        ctx.fillStyle = grad;
      } else {
        // Dark glass with sky reflection at top
        ctx.fillStyle = windowColor;
      }
      ctx.fillRect(x, y, winW, winH);

      // Sky reflection on dark windows
      if (!isLit) {
        const reflGrad = ctx.createLinearGradient(x, y, x, y + winH);
        reflGrad.addColorStop(0, 'rgba(140, 170, 210, 0.22)');
        reflGrad.addColorStop(0.4, 'rgba(140, 170, 210, 0.05)');
        reflGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = reflGrad;
        ctx.fillRect(x, y, winW, winH);
      }

      // Window sill
      ctx.fillStyle = 'rgba(0,0,0,0.06)';
      ctx.fillRect(x - 1, y + winH - 1, winW + 2, 2);
    }
  }

  // Horizontal floor trim lines
  ctx.strokeStyle = trimColor;
  ctx.lineWidth = 1.5;
  for (let row = 1; row < rows; row++) {
    ctx.beginPath();
    ctx.moveTo(0, row * cellH);
    ctx.lineTo(width, row * cellH);
    ctx.stroke();
  }

  // Corner pillar shadows (vertical dark edges)
  if (cornerPillar) {
    const pillarW = width * 0.04;
    const grad1 = ctx.createLinearGradient(0, 0, pillarW, 0);
    grad1.addColorStop(0, 'rgba(0,0,0,0.18)');
    grad1.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad1;
    ctx.fillRect(0, 0, pillarW, height);

    const grad2 = ctx.createLinearGradient(width, 0, width - pillarW, 0);
    grad2.addColorStop(0, 'rgba(0,0,0,0.18)');
    grad2.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad2;
    ctx.fillRect(width - pillarW, 0, pillarW, height);
  }

  // Top parapet line
  ctx.fillStyle = 'rgba(0,0,0,0.12)';
  ctx.fillRect(0, 0, width, 3);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.needsUpdate = true;
  return texture;
}

function shiftColor(hex: string, amount: number): string {
  const c = parseInt(hex.replace('#', ''), 16);
  const r = Math.max(0, Math.min(255, ((c >> 16) & 0xff) + amount));
  const g = Math.max(0, Math.min(255, ((c >> 8) & 0xff) + amount));
  const b = Math.max(0, Math.min(255, (c & 0xff) + amount));
  return `rgb(${r},${g},${b})`;
}

// --- Presets ---

export function createSkyscraperTexture(): THREE.CanvasTexture {
  return createWindowTexture({
    width: 256, height: 512, rows: 20, cols: 7,
    baseColor: '#9eaab8',
    windowColor: '#1a2230',
    litColor: '#ffe4a0',
    litChance: 0.4,
    windowGap: 0.12,
    cornerPillar: true,
  });
}

export function createGlassTowerTexture(): THREE.CanvasTexture {
  return createWindowTexture({
    width: 256, height: 512, rows: 28, cols: 10,
    baseColor: '#546070',
    windowColor: '#1c2838',
    litColor: '#c8e0ff',
    litChance: 0.5,
    windowGap: 0.05,
    cornerPillar: true,
  });
}

export function createOfficeTexture(): THREE.CanvasTexture {
  return createWindowTexture({
    width: 256, height: 256, rows: 8, cols: 5,
    baseColor: '#c8c0b4',
    windowColor: '#283848',
    litColor: '#fff0c0',
    litChance: 0.3,
    windowGap: 0.18,
    cornerPillar: false,
  });
}

export function createLowRiseTexture(): THREE.CanvasTexture {
  return createWindowTexture({
    width: 128, height: 128, rows: 3, cols: 3,
    baseColor: '#d4cec4',
    windowColor: '#3a4858',
    litColor: '#ffe8a0',
    litChance: 0.2,
    windowGap: 0.22,
    cornerPillar: false,
  });
}

export function useBuildingTextures() {
  return useMemo(() => ({
    skyscraper: createSkyscraperTexture(),
    glassTower: createGlassTowerTexture(),
    office: createOfficeTexture(),
    lowRise: createLowRiseTexture(),
  }), []);
}
