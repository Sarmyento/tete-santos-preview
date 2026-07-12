/**
 * Converte heroes/about PNG → WebP (e AVIF) para LCP.
 * Idempotente: só regenera se o destino não existir ou for mais antigo que o PNG.
 *
 * Uso: node scripts/optimize-static-images.mjs
 */
import { stat } from 'node:fs/promises';
import { basename, dirname, extname, join, resolve } from 'node:path';
import { readdirSync } from 'node:fs';
import sharp from 'sharp';

const root = resolve(process.cwd());
const dirs = [
  resolve(root, 'public/images/hero'),
  resolve(root, 'public/images/about'),
];

const VARIANTS = [
  { suffix: '', width: null, quality: 72 },
  { suffix: '-1280', width: 1280, quality: 72 },
  { suffix: '-768', width: 768, quality: 70 },
  { suffix: '-540', width: 540, quality: 70 },
  { suffix: '-320', width: 320, quality: 68 },
];

async function needsRebuild(src, dest) {
  try {
    const [a, b] = await Promise.all([stat(src), stat(dest)]);
    return a.mtimeMs > b.mtimeMs;
  } catch {
    return true;
  }
}

async function convertPng(srcPath) {
  const dir = dirname(srcPath);
  const base = basename(srcPath, extname(srcPath));
  const meta = await sharp(srcPath).metadata();
  const results = [];

  for (const variant of VARIANTS) {
    // Não upscale em variantes com width fixo
    if (variant.width && meta.width && variant.width >= meta.width) continue;

    const webpOut = join(dir, `${base}${variant.suffix}.webp`);
    const avifOut = join(dir, `${base}${variant.suffix}.avif`);
    const pipeline = (format) => {
      let img = sharp(srcPath);
      if (variant.width) {
        img = img.resize({ width: variant.width, withoutEnlargement: true });
      }
      if (format === 'webp') return img.webp({ quality: variant.quality, effort: 4 });
      return img.avif({ quality: Math.max(variant.quality - 8, 45), effort: 4 });
    };

    if (await needsRebuild(srcPath, webpOut)) {
      await pipeline('webp').toFile(webpOut);
      results.push(webpOut);
    }

    if (await needsRebuild(srcPath, avifOut)) {
      await pipeline('avif').toFile(avifOut);
      results.push(avifOut);
    }
  }

  return results;
}

async function main() {
  let created = 0;
  for (const dir of dirs) {
    let files = [];
    try {
      files = readdirSync(dir).filter((f) => f.toLowerCase().endsWith('.png'));
    } catch {
      console.warn(`[optimize-static] skip missing dir ${dir}`);
      continue;
    }

    for (const file of files) {
      const src = join(dir, file);
      const out = await convertPng(src);
      created += out.length;
      if (out.length) {
        console.log(`[optimize-static] ${file} → ${out.length} file(s)`);
      }
    }
  }
  console.log(`[optimize-static] done (${created} files written/updated).`);
}

main().catch((error) => {
  console.error('[optimize-static]', error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
