import { readFile, writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';
import type { VisualCompareResult } from '../types.js';
import { takeScreenshot } from '../browser/actions.js';

let _baselinesDir: string;

export function initVisual(sessionsDir: string): void {
  _baselinesDir = join(sessionsDir, 'baselines');
}

export async function saveBaseline(name: string): Promise<string> {
  await mkdir(_baselinesDir, { recursive: true });
  const buffer = await takeScreenshot();
  const safeName = name.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 100);
  const path = join(_baselinesDir, `${safeName}.png`);
  await writeFile(path, buffer);
  return path;
}

export async function compareWithBaseline(name: string, sessionsDir: string): Promise<VisualCompareResult> {
  const safeName = name.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 100);
  const baselinePath = join(_baselinesDir, `${safeName}.png`);

  // Read baseline
  let baselineData: Buffer;
  try {
    baselineData = await readFile(baselinePath);
  } catch {
    throw new Error(`Baseline "${name}" not found at ${baselinePath}`);
  }

  // Take current screenshot
  const currentBuffer = await takeScreenshot();

  // Save current screenshot
  const diffsDir = join(sessionsDir, 'diffs');
  await mkdir(diffsDir, { recursive: true });
  const currentPath = join(diffsDir, `${name}-current-${Date.now()}.png`);
  await writeFile(currentPath, currentBuffer);

  // Parse PNGs
  const baseline = PNG.sync.read(baselineData);
  const current = PNG.sync.read(currentBuffer);

  // Ensure same dimensions
  const width = Math.min(baseline.width, current.width);
  const height = Math.min(baseline.height, current.height);

  // Resize if needed (crop to smaller)
  const baselineResized = cropPNG(baseline, width, height);
  const currentResized = cropPNG(current, width, height);

  // Create diff image
  const diff = new PNG({ width, height });
  const diffPixels = pixelmatch(
    baselineResized.data,
    currentResized.data,
    diff.data,
    width,
    height,
    { threshold: 0.1 }
  );

  // Save diff
  const diffPath = join(diffsDir, `${name}-diff-${Date.now()}.png`);
  const diffBuffer = PNG.sync.write(diff);
  await writeFile(diffPath, diffBuffer);

  const totalPixels = width * height;
  const diffPercentage = (diffPixels / totalPixels) * 100;

  return {
    match: diffPercentage < 1, // Less than 1% change = match
    diffPercentage: Math.round(diffPercentage * 100) / 100,
    diffPixels,
    totalPixels,
    baselinePath,
    currentPath,
    diffPath,
  };
}

function cropPNG(png: PNG, width: number, height: number): PNG {
  if (png.width === width && png.height === height) return png;

  const cropped = new PNG({ width, height });
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const srcIdx = (png.width * y + x) << 2;
      const dstIdx = (width * y + x) << 2;
      cropped.data[dstIdx] = png.data[srcIdx];
      cropped.data[dstIdx + 1] = png.data[srcIdx + 1];
      cropped.data[dstIdx + 2] = png.data[srcIdx + 2];
      cropped.data[dstIdx + 3] = png.data[srcIdx + 3];
    }
  }
  return cropped;
}
