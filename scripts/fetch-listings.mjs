import { copyFile, mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

const destinationPath = resolve(process.cwd(), 'public/data/listings.xml');
const mockPath = resolve(process.cwd(), 'public/data/listings-mock.xml');
const feedUrl = process.env.LISTINGS_FEED_URL?.trim();

async function ensureOutputDir() {
  await mkdir(dirname(destinationPath), { recursive: true });
}

async function useMock(reason) {
  await ensureOutputDir();
  await copyFile(mockPath, destinationPath);
  console.warn(`[listings] ${reason}. Using mock feed at public/data/listings-mock.xml.`);
}

async function fetchRemoteFeed(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} ${response.statusText}`.trim());
  }

  const xmlContent = await response.text();
  if (!xmlContent.trim()) {
    throw new Error('Empty feed response');
  }

  await ensureOutputDir();
  await writeFile(destinationPath, xmlContent, 'utf8');
  console.log('[listings] Feed fetched successfully to public/data/listings.xml.');
}

async function main() {
  if (!feedUrl) {
    await useMock('LISTINGS_FEED_URL not set');
    return;
  }

  try {
    await fetchRemoteFeed(feedUrl);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await useMock(`Failed to fetch remote feed (${message})`);
  }
}

main().catch(async (error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[listings] Unexpected error: ${message}`);
  process.exitCode = 1;
});
