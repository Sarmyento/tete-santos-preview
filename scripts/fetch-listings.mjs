import { copyFile, mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

const destinationPath = resolve(process.cwd(), 'public/data/listings.xml');
const mockPath = resolve(process.cwd(), 'public/data/listings-mock.xml');
const feedUrl = process.env.LISTINGS_FEED_URL?.trim();

/** Cloudflare Pages sets CF_PAGES=1. Never ship mock catalog from CI/prod builds. */
const isCiOrPages =
  process.env.CF_PAGES === '1' ||
  process.env.CI === 'true' ||
  process.env.GITHUB_ACTIONS === 'true';

async function ensureOutputDir() {
  await mkdir(dirname(destinationPath), { recursive: true });
}

async function useMock(reason) {
  if (isCiOrPages) {
    console.error(
      `[listings] FATAL: ${reason}. Refusing mock fallback in CI/Pages (would publish placeholders).`,
    );
    process.exitCode = 1;
    return;
  }

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

  if (/source="mock-dev"/.test(xmlContent)) {
    throw new Error('Remote feed looks like mock-dev; refusing to publish');
  }

  await ensureOutputDir();
  await writeFile(destinationPath, xmlContent, 'utf8');
  const count = (xmlContent.match(/<listing>/g) || []).length;
  console.log(
    `[listings] Feed fetched successfully to public/data/listings.xml (${count} listings).`,
  );
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
