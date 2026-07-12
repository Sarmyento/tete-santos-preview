// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

const previewSite = 'https://sarmyento.github.io/tete-santos-preview';
const previewBase = '/tete-santos-preview/';
const isPreviewBuild = process.env.PUBLIC_DEPLOY_TARGET === 'github-pages';

/** @type {import('astro/config').SiteConfig} */
const siteUrl = process.env.PUBLIC_SITE_URL ?? (isPreviewBuild ? previewSite : 'https://tetesantos.com.br');
const base = process.env.PUBLIC_BASE_PATH ?? (isPreviewBuild ? previewBase : undefined);

export default defineConfig({
  site: siteUrl,
  base,
  trailingSlash: 'never',
  integrations: [sitemap()],
  build: {
    assets: '_astro',
    // CSS total ~6 KiB: inline evita cadeia crítica de 2 requests render-blocking no Lighthouse
    inlineStylesheets: 'always',
  },
  vite: {
    css: {
      devSourcemap: true,
    },
  },
});
