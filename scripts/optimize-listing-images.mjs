/**
 * Baixa fotos remotas do feed XML e grava WebP + AVIF local (card + detail).
 * Reescreve as URLs no listings.xml para apontar aos arquivos otimizados.
 *
 * Roda depois de fetch-listings.mjs no prebuild.
 */
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile, stat } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import sharp from 'sharp';

const root = resolve(process.cwd());
const xmlPath = resolve(root, 'public/data/listings.xml');
const outDir = resolve(root, 'public/images/listings/opt');

const CARD_WIDTH = 800;
const CARD_SM_WIDTH = 400;
const DETAIL_WIDTH = 1400;
const THUMB_WIDTH = 320;
const WEBP_QUALITY = 72;
const AVIF_QUALITY = 55;
const THUMB_WEBP_QUALITY = 68;
const THUMB_AVIF_QUALITY = 50;

function hashUrl(url) {
  return createHash('sha1').update(url).digest('hex').slice(0, 12);
}

async function download(url) {
  const response = await fetch(url, {
    headers: { 'User-Agent': 'tete-santos-site-optimizer/1.0' },
    signal: AbortSignal.timeout(45000),
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} for ${url}`);
  }
  return Buffer.from(await response.arrayBuffer());
}

async function writeVariant(buffer, outPath, width, format, qualityWebp = WEBP_QUALITY, qualityAvif = AVIF_QUALITY) {
  let img = sharp(buffer).rotate().resize({ width, withoutEnlargement: true });
  if (format === 'avif') {
    await img.avif({ quality: qualityAvif, effort: 4 }).toFile(outPath);
  } else {
    await img.webp({ quality: qualityWebp, effort: 4 }).toFile(outPath);
  }
}

async function ensureFromCard(cardAbs, destAbs, width, format, qualityWebp = WEBP_QUALITY, qualityAvif = AVIF_QUALITY) {
  try {
    await stat(destAbs);
    return;
  } catch {
    // generate
  }
  let img = sharp(cardAbs).resize({ width, withoutEnlargement: true });
  if (format === 'avif') {
    await img.avif({ quality: qualityAvif, effort: 4 }).toFile(destAbs);
  } else {
    await img.webp({ quality: qualityWebp, effort: 4 }).toFile(destAbs);
  }
}

async function optimizeUrl(url, cache) {
  if (cache.has(url)) return cache.get(url);

  const id = hashUrl(url);
  const cardRel = `/images/listings/opt/${id}-card.webp`;
  const cardSmRel = `/images/listings/opt/${id}-card-sm.webp`;
  const detailRel = `/images/listings/opt/${id}-detail.webp`;
  const thumbRel = `/images/listings/opt/${id}-thumb.webp`;
  const cardAbs = join(outDir, `${id}-card.webp`);
  const cardSmAbs = join(outDir, `${id}-card-sm.webp`);
  const detailAbs = join(outDir, `${id}-detail.webp`);
  const detailAvifAbs = join(outDir, `${id}-detail.avif`);
  const thumbAbs = join(outDir, `${id}-thumb.webp`);
  const cardAvifAbs = join(outDir, `${id}-card.avif`);
  const cardSmAvifAbs = join(outDir, `${id}-card-sm.avif`);
  const thumbAvifAbs = join(outDir, `${id}-thumb.avif`);

  try {
    const buffer = await download(url);
    await writeVariant(buffer, cardAbs, CARD_WIDTH, 'webp');
    await writeVariant(buffer, cardSmAbs, CARD_SM_WIDTH, 'webp');
    await writeVariant(buffer, detailAbs, DETAIL_WIDTH, 'webp');
    await writeVariant(buffer, detailAvifAbs, DETAIL_WIDTH, 'avif');
    await writeVariant(buffer, thumbAbs, THUMB_WIDTH, 'webp', THUMB_WEBP_QUALITY, THUMB_AVIF_QUALITY);
    await writeVariant(buffer, cardAvifAbs, CARD_WIDTH, 'avif');
    await writeVariant(buffer, cardSmAvifAbs, CARD_SM_WIDTH, 'avif');
    await writeVariant(buffer, thumbAvifAbs, THUMB_WIDTH, 'avif', THUMB_WEBP_QUALITY, THUMB_AVIF_QUALITY);
    const mapped = { card: cardRel, cardSm: cardSmRel, detail: detailRel, thumb: thumbRel };
    cache.set(url, mapped);
    console.log(`[optimize-listings] ${id} ok (${(buffer.length / 1024).toFixed(0)} KB → webp+avif+thumb)`);
    return mapped;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`[optimize-listings] keep remote ${url}: ${message}`);
    const mapped = { card: url, cardSm: url, detail: url };
    cache.set(url, mapped);
    return mapped;
  }
}

async function ensureLocalVariants(xml) {
  const fromXml = [
    ...xml.matchAll(/\/images\/listings\/opt\/([a-f0-9]+)-(?:detail|card)\.webp/gi),
  ].map((m) => m[1]);

  let fromDisk = [];
  try {
    const { readdir } = await import('node:fs/promises');
    const files = await readdir(outDir);
    fromDisk = files
      .map((name) => name.match(/^([a-f0-9]+)-(?:detail|card)\.webp$/i)?.[1])
      .filter(Boolean);
  } catch {
    // pasta ainda vazia
  }

  const ids = [...new Set([...fromXml, ...fromDisk])];

  for (const id of ids) {
    const cardAbs = join(outDir, `${id}-card.webp`);
    const cardSmAbs = join(outDir, `${id}-card-sm.webp`);
    const detailAbs = join(outDir, `${id}-detail.webp`);
    const thumbAbs = join(outDir, `${id}-thumb.webp`);
    const cardAvifAbs = join(outDir, `${id}-card.avif`);
    const cardSmAvifAbs = join(outDir, `${id}-card-sm.avif`);
    const thumbAvifAbs = join(outDir, `${id}-thumb.avif`);
    try {
      const sourceForThumb = (await stat(detailAbs).then(() => detailAbs).catch(() => null))
        || (await stat(cardAbs).then(() => cardAbs).catch(() => null));
      if (!sourceForThumb) continue;

      try {
        await stat(cardAbs);
        await ensureFromCard(cardAbs, cardSmAbs, CARD_SM_WIDTH, 'webp');
        await ensureFromCard(cardAbs, cardAvifAbs, CARD_WIDTH, 'avif');
        await ensureFromCard(cardAbs, cardSmAvifAbs, CARD_SM_WIDTH, 'avif');
      } catch {
        // card ausente
      }

      await ensureFromCard(sourceForThumb, thumbAbs, THUMB_WIDTH, 'webp', THUMB_WEBP_QUALITY, THUMB_AVIF_QUALITY);
      await ensureFromCard(sourceForThumb, thumbAvifAbs, THUMB_WIDTH, 'avif', THUMB_WEBP_QUALITY, THUMB_AVIF_QUALITY);
      if (sourceForThumb.endsWith('-detail.webp')) {
        const detailAvifAbs = join(outDir, `${id}-detail.avif`);
        await ensureFromCard(sourceForThumb, detailAvifAbs, DETAIL_WIDTH, 'avif');
      }
      console.log(`[optimize-listings] ${id} thumb ensured`);
    } catch {
      // ignora
    }
  }
}

async function main() {
  let xml;
  try {
    xml = await readFile(xmlPath, 'utf8');
  } catch {
    console.warn('[optimize-listings] listings.xml missing; skip.');
    return;
  }

  const urls = [...xml.matchAll(/https?:\/\/[^\s<>|"']+\.(?:jpe?g|png|webp|gif)/gi)].map((m) => m[0]);
  const unique = [...new Set(urls)];
  if (!unique.length) {
    console.log('[optimize-listings] no remote images found; ensuring local AVIF variants.');
    await mkdir(outDir, { recursive: true });
    await ensureLocalVariants(xml);
    return;
  }

  await mkdir(outDir, { recursive: true });
  const cache = new Map();

  for (const url of unique) {
    await optimizeUrl(url, cache);
  }

  let next = xml;
  next = next.replace(/<image>([\s\S]*?)<\/image>/g, (_full, inner) => {
    const url = String(inner).trim();
    const mapped = cache.get(url);
    return `<image>${mapped?.card ?? url}</image>`;
  });

  next = next.replace(/<images>([\s\S]*?)<\/images>/g, (_full, inner) => {
    const parts = String(inner)
      .split('|')
      .map((item) => item.trim())
      .filter(Boolean)
      .map((url) => cache.get(url)?.detail ?? url);
    return `<images>${parts.join('|')}</images>`;
  });

  for (const [url, mapped] of cache) {
    if (url !== mapped.detail) {
      next = next.split(url).join(mapped.detail);
    }
  }

  next = next.replace(/<image>([\s\S]*?)<\/image>/g, (_full, inner) => {
    const current = String(inner).trim();
    const card = current.replace(/-detail\.webp$/i, '-card.webp');
    return `<image>${card}</image>`;
  });

  await writeFile(xmlPath, next, 'utf8');
  await ensureLocalVariants(next);

  console.log(`[optimize-listings] rewritten ${unique.length} image URL(s) in listings.xml.`);
}

main().catch((error) => {
  console.error('[optimize-listings]', error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
