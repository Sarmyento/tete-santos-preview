/**
 * Converte heroes/about PNG → WebP/AVIF para LCP.
 * Idempotente: só regenera se o destino não existir ou for mais antigo que o PNG.
 * Em Cloudflare Pages (CF_PAGES=1), remove os PNG masters do public/ após converter
 * para não shippar ~14 MB no deploy.
 *
 * Uso: node scripts/optimize-static-images.mjs
 */
import { unlink } from 'node:fs/promises';
import { stat } from 'node:fs/promises';
import { basename, dirname, extname, join, resolve } from 'node:path';
import { readdirSync } from 'node:fs';
import sharp from 'sharp';

const root = resolve(process.cwd());
const dirs = [
  resolve(root, 'public/images/hero'),
  resolve(root, 'public/images/about'),
];

/** Variantes por prefixo de arquivo (evita gerar -320/-540 em heroes desktop). */
function variantsFor(baseName) {
  if (baseName.includes('mobile') || baseName.includes('H5')) {
    return [
      { suffix: '', width: null, quality: 72 },
      { suffix: '-768', width: 768, quality: 70 },
    ];
  }
  if (baseName.startsWith('tete-P') || baseName.includes('about')) {
    return [
      { suffix: '-540', width: 540, quality: 70 },
      { suffix: '-320', width: 320, quality: 68 },
      { suffix: '', width: null, quality: 72 },
    ];
  }
  // Heroes desktop H1–H4
  return [
    { suffix: '', width: null, quality: 72 },
    { suffix: '-1280', width: 1280, quality: 72 },
  ];
}

const stripPng =
  process.env.CF_PAGES === '1' ||
  process.env.STRIP_SOURCE_PNG === '1' ||
  process.argv.includes('--strip-png');

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
  const variants = variantsFor(base);

  for (const variant of variants) {
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

  if (stripPng) {
    // Confirma que o WebP full existe antes de apagar o PNG
    const webpFull = join(dir, `${base}.webp`);
    try {
      await stat(webpFull);
      await unlink(srcPath);
      console.log(`[optimize-static] stripped ${basename(srcPath)}`);
    } catch {
      // mantém PNG se conversão falhou
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
  console.log(`[optimize-static] done (${created} files written/updated). stripPng=${stripPng}`);
}

main().catch((error) => {
  console.error('[optimize-static]', error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
