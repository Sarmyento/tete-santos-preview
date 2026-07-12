/**
 * Baixa fotos remotas do feed XML e grava WebP local (card + detail + thumb).
 * Reescreve as URLs no listings.xml para apontar aos arquivos otimizados.
 *
 * AVIF é opcional e DESLIGADO por padrão no CI/Cloudflare Pages (CPU fraca:
 * 12× JPG ~4 MB + AVIF effort 4 estourou 30+ min). Ative com OPTIMIZE_LISTINGS_AVIF=1.
 *
 * Roda depois de fetch-listings.mjs no prebuild.
 */
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile, stat, readdir } from 'node:fs/promises';
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
const THUMB_WEBP_QUALITY = 68;
const AVIF_QUALITY = 55;
const THUMB_AVIF_QUALITY = 50;

/** CF Pages / CI: só WebP. Local: WebP; AVIF só se OPTIMIZE_LISTINGS_AVIF=1. */
const WRITE_AVIF =
  process.env.OPTIMIZE_LISTINGS_AVIF === '1' &&
  process.env.CF_PAGES !== '1' &&
  process.env.CI !== 'true';

const WEBP_EFFORT = process.env.CF_PAGES === '1' || process.env.CI === 'true' ? 2 : 4;

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

async function writeWebp(buffer, outPath, width, quality = WEBP_QUALITY) {
  await sharp(buffer)
    .rotate()
    .resize({ width, withoutEnlargement: true })
    .webp({ quality, effort: WEBP_EFFORT })
    .toFile(outPath);
}

async function writeAvif(buffer, outPath, width, quality = AVIF_QUALITY) {
  await sharp(buffer)
    .rotate()
    .resize({ width, withoutEnlargement: true })
    .avif({ quality, effort: 2 })
    .toFile(outPath);
}

async function ensureWebpFromFile(sourceAbs, destAbs, width, quality = WEBP_QUALITY) {
  try {
    await stat(destAbs);
    return;
  } catch {
    // generate
  }
  await sharp(sourceAbs)
    .resize({ width, withoutEnlargement: true })
    .webp({ quality, effort: WEBP_EFFORT })
    .toFile(destAbs);
}

async function ensureAvifFromFile(sourceAbs, destAbs, width, quality = AVIF_QUALITY) {
  if (!WRITE_AVIF) return;
  try {
    await stat(destAbs);
    return;
  } catch {
    // generate
  }
  await sharp(sourceAbs)
    .resize({ width, withoutEnlargement: true })
    .avif({ quality, effort: 2 })
    .toFile(destAbs);
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
  const thumbAbs = join(outDir, `${id}-thumb.webp`);

  try {
    const buffer = await download(url);
    await writeWebp(buffer, cardAbs, CARD_WIDTH);
    await writeWebp(buffer, cardSmAbs, CARD_SM_WIDTH);
    await writeWebp(buffer, detailAbs, DETAIL_WIDTH);
    await writeWebp(buffer, thumbAbs, THUMB_WIDTH, THUMB_WEBP_QUALITY);

    if (WRITE_AVIF) {
      await writeAvif(buffer, join(outDir, `${id}-card.avif`), CARD_WIDTH);
      await writeAvif(buffer, join(outDir, `${id}-card-sm.avif`), CARD_SM_WIDTH);
      await writeAvif(buffer, join(outDir, `${id}-detail.avif`), DETAIL_WIDTH);
      await writeAvif(buffer, join(outDir, `${id}-thumb.avif`), THUMB_WIDTH, THUMB_AVIF_QUALITY);
    }

    const mapped = { card: cardRel, cardSm: cardSmRel, detail: detailRel, thumb: thumbRel };
    cache.set(url, mapped);
    const mode = WRITE_AVIF ? 'webp+avif+thumb' : 'webp+thumb';
    console.log(`[optimize-listings] ${id} ok (${(buffer.length / 1024).toFixed(0)} KB → ${mode})`);
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
    try {
      const sourceForThumb =
        (await stat(detailAbs)
          .then(() => detailAbs)
          .catch(() => null)) ||
        (await stat(cardAbs)
          .then(() => cardAbs)
          .catch(() => null));
      if (!sourceForThumb) continue;

      try {
        await stat(cardAbs);
        await ensureWebpFromFile(cardAbs, cardSmAbs, CARD_SM_WIDTH);
        await ensureAvifFromFile(cardAbs, join(outDir, `${id}-card.avif`), CARD_WIDTH);
        await ensureAvifFromFile(cardAbs, join(outDir, `${id}-card-sm.avif`), CARD_SM_WIDTH);
      } catch {
        // card ausente
      }

      await ensureWebpFromFile(sourceForThumb, thumbAbs, THUMB_WIDTH, THUMB_WEBP_QUALITY);
      await ensureAvifFromFile(
        sourceForThumb,
        join(outDir, `${id}-thumb.avif`),
        THUMB_WIDTH,
        THUMB_AVIF_QUALITY,
      );
      if (sourceForThumb.endsWith('-detail.webp')) {
        await ensureAvifFromFile(sourceForThumb, join(outDir, `${id}-detail.avif`), DETAIL_WIDTH);
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

  console.log(
    `[optimize-listings] mode=${WRITE_AVIF ? 'webp+avif' : 'webp-only'} effort=${WEBP_EFFORT}`,
  );

  const urls = [...xml.matchAll(/https?:\/\/[^\s<>|"']+\.(?:jpe?g|png|webp|gif)/gi)].map((m) => m[0]);
  const unique = [...new Set(urls)];
  if (!unique.length) {
    console.log('[optimize-listings] no remote images found; ensuring local variants.');
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
