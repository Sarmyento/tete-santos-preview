/**
 * Baixa fotos remotas do feed XML e grava WebP local (card + detail).
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
const WEBP_QUALITY = 72;

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

async function writeVariant(buffer, outPath, width) {
  await sharp(buffer)
    .rotate()
    .resize({ width, withoutEnlargement: true })
    .webp({ quality: WEBP_QUALITY, effort: 4 })
    .toFile(outPath);
}

async function optimizeUrl(url, cache) {
  if (cache.has(url)) return cache.get(url);

  const id = hashUrl(url);
  const cardRel = `/images/listings/opt/${id}-card.webp`;
  const cardSmRel = `/images/listings/opt/${id}-card-sm.webp`;
  const detailRel = `/images/listings/opt/${id}-detail.webp`;
  const cardAbs = join(outDir, `${id}-card.webp`);
  const cardSmAbs = join(outDir, `${id}-card-sm.webp`);
  const detailAbs = join(outDir, `${id}-detail.webp`);

  try {
    const buffer = await download(url);
    await writeVariant(buffer, cardAbs, CARD_WIDTH);
    await writeVariant(buffer, cardSmAbs, CARD_SM_WIDTH);
    await writeVariant(buffer, detailAbs, DETAIL_WIDTH);
    const mapped = { card: cardRel, cardSm: cardSmRel, detail: detailRel };
    cache.set(url, mapped);
    console.log(`[optimize-listings] ${id} ok (${(buffer.length / 1024).toFixed(0)} KB → webp)`);
    return mapped;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`[optimize-listings] keep remote ${url}: ${message}`);
    const mapped = { card: url, cardSm: url, detail: url };
    cache.set(url, mapped);
    return mapped;
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
    console.log('[optimize-listings] no remote images found.');
    return;
  }

  await mkdir(outDir, { recursive: true });
  const cache = new Map();

  for (const url of unique) {
    await optimizeUrl(url, cache);
  }

  // Primeira ocorrência de cada URL no XML = capa (card); galeria usa detail.
  // Estratégia: substituir todas por detail; a tag <image> (capa) por card.
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

  // Qualquer URL remota residual em outros campos
  for (const [url, mapped] of cache) {
    if (url !== mapped.detail) {
      next = next.split(url).join(mapped.detail);
    }
  }

  // Reaplicar capa card (o split/join acima pode ter virado detail)
  next = next.replace(/<image>([\s\S]*?)<\/image>/g, (_full, inner) => {
    const current = String(inner).trim();
    // Se já é *-card.webp, ok; se é *-detail.webp do mesmo hash, troca para card
    const card = current.replace(/-detail\.webp$/i, '-card.webp');
    return `<image>${card}</image>`;
  });

  await writeFile(xmlPath, next, 'utf8');
  // Se o XML já aponta para *-card.webp local (rebuild sem refetch), garante card-sm.
  const localCards = [...xml.matchAll(/\/images\/listings\/opt\/([a-f0-9]+)-card\.webp/gi)].map((m) => m[1]);
  for (const id of [...new Set(localCards)]) {
    const cardAbs = join(outDir, `${id}-card.webp`);
    const cardSmAbs = join(outDir, `${id}-card-sm.webp`);
    try {
      await stat(cardAbs);
      try {
        await stat(cardSmAbs);
      } catch {
        await sharp(cardAbs)
          .resize({ width: CARD_SM_WIDTH, withoutEnlargement: true })
          .webp({ quality: WEBP_QUALITY, effort: 4 })
          .toFile(cardSmAbs);
        console.log(`[optimize-listings] ${id} card-sm from local card`);
      }
    } catch {
      // card ausente — ignora
    }
  }

  console.log(`[optimize-listings] rewritten ${unique.length} image URL(s) in listings.xml.`);
}

main().catch((error) => {
  console.error('[optimize-listings]', error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
