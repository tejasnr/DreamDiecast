import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const OPTIMIZATIONS = [
  // Hero background — serve at 1920w max (desktop), let Next.js handle mobile via srcSet
  {
    input: 'public/assets/gt3rs.jpg',
    outputs: [
      { path: 'public/assets/gt3rs.webp', width: 1920, quality: 80 },
      { path: 'public/assets/gt3rs-mobile.webp', width: 768, quality: 75 },
    ],
  },
  // Theme grid images — max display ~640px wide at 2x = 1280px
  {
    input: 'app/assets/blue-gtr.jpg',
    outputs: [
      { path: 'app/assets/blue-gtr.webp', width: 1280, quality: 80 },
    ],
  },
  {
    input: 'app/assets/pagani.png',
    outputs: [
      { path: 'app/assets/pagani.webp', width: 1280, quality: 80 },
    ],
  },
  {
    input: 'app/assets/ford.jpg',
    outputs: [
      { path: 'app/assets/ford.webp', width: 1280, quality: 80 },
    ],
  },
  // Brand logos — max display 160px wide at 2x = 320px
  {
    input: 'public/assets/hotwheels.png',
    outputs: [
      { path: 'public/assets/hotwheels.webp', width: 320, quality: 85, preserveAlpha: true },
    ],
  },
  {
    input: 'public/assets/mini-gt.png',
    outputs: [
      { path: 'public/assets/mini-gt.webp', width: 320, quality: 85, preserveAlpha: true },
    ],
  },
  {
    input: 'public/assets/tarmac-works.png',
    outputs: [
      { path: 'public/assets/tarmac-works.webp', width: 320, quality: 85, preserveAlpha: true },
    ],
  },
  {
    input: 'public/assets/burago.png',
    outputs: [
      { path: 'public/assets/burago.webp', width: 320, quality: 85, preserveAlpha: true },
    ],
  },
  {
    input: 'public/assets/matchbox.png',
    outputs: [
      { path: 'public/assets/matchbox.webp', width: 320, quality: 85, preserveAlpha: true },
    ],
  },
  {
    input: 'public/assets/poprace.png',
    outputs: [
      { path: 'public/assets/poprace.webp', width: 320, quality: 85, preserveAlpha: true },
    ],
  },
  // Navbar logo — max display 40px at 3x = 120px
  {
    input: 'public/logo.png',
    outputs: [
      { path: 'public/logo.webp', width: 120, quality: 85, preserveAlpha: true },
    ],
  },
  // QR code — displayed at 192×192 (w-48), serve at 2x = 384px
  {
    input: 'public/assets/QR.png',
    outputs: [
      { path: 'public/assets/QR.webp', width: 384, quality: 90, preserveAlpha: true },
    ],
  },
];

async function optimize() {
  // Create originals backup folder
  const backupDir = 'public/assets/originals';
  if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });

  for (const item of OPTIMIZATIONS) {
    // Backup original
    const basename = path.basename(item.input);
    const backupPath = path.join(backupDir, basename);
    if (!fs.existsSync(backupPath)) {
      fs.copyFileSync(item.input, backupPath);
    }

    for (const output of item.outputs) {
      const pipeline = sharp(item.input).resize(output.width, null, {
        withoutEnlargement: true,
        fit: 'inside',
      });

      if (output.preserveAlpha) {
        await pipeline.webp({ quality: output.quality, alphaQuality: 90 }).toFile(output.path);
      } else {
        await pipeline.webp({ quality: output.quality }).toFile(output.path);
      }

      const originalSize = fs.statSync(item.input).size;
      const newSize = fs.statSync(output.path).size;
      const savings = ((1 - newSize / originalSize) * 100).toFixed(1);
      console.log(`✓ ${output.path} — ${(newSize / 1024).toFixed(0)} KB (${savings}% smaller)`);
    }
  }
}

optimize().catch(console.error);
