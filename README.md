# Site Tetê Santos · preview público

Preview estático do site Tetê Santos (Heritage Real · P4) para validação da cliente.

## Preview online

**URL:** https://sarmyento.github.io/tete-santos-preview/

**Produção:** https://tetesantos.com.br · indexável · feed CRM no build · imagens WebP/AVIF · Cloudflare Pages (mesmo repo `main`).

Rotas sugeridas para revisão:

- `/tete-santos-preview/` (home)
- `/tete-santos-preview/imoveis`
- `/tete-santos-preview/imoveis/tes00001`
- `/tete-santos-preview/sobre`
- `/tete-santos-preview/servicos`
- `/tete-santos-preview/contato`

## Repo local

`C:\Users\sarmy\Dev\Sarmy\sites-clientes\tete-santos\`

## Estado visual (01/08/2026)

- **Hero:** rotação **H8 + H17 + H18** (1 foto Tetê + 2 imóveis). Commit recente `83ba9b0`.
  - Foto flush sob o menu (`top: header × 2` + overlay).
  - Desktop: hero mais alto (`100vh + header`).
  - Mobile H8: `object-position 62% 0%`, Ken Burns desligado (rosto visível).
- **Serviços (home):** fundo **sólido bordô** — sem imagem `services-bg-living` (removida 01/08).
- **Header:** opaco no desktop; overlay transparente no mobile (foto sobe sob o menu).

## Ver mobile no localhost

1. `npm run dev` → http://localhost:4321/
2. Chrome/Edge → **F12** → **Ctrl+Shift+M** (device toolbar)
3. Preset iPhone ou viewport **390×844** → recarregar (**Ctrl+R**)

## Comandos

```bash
npm install
npm run dev
npm run build
npm run preview
```

Build espelhando GitHub Pages:

```bash
PUBLIC_DEPLOY_TARGET=github-pages npm run build
```

## Deploy

Push na branch `main` publica:

1. **GitHub Pages** (workflow `Deploy preview to GitHub Pages` → branch `gh-pages`)
2. **Cloudflare Pages** (autodeploy do mesmo `main` → `tetesantos.com.br`)

**Ativar preview (uma vez):** GitHub → Settings → Pages → Source: **Deploy from a branch** → `gh-pages` / `/ (root)`.

- Astro 7 · output estático
- Motion LCW · identidade Heritage Real
- Avatar seed **42002** · hero H8/H17/H18
- Listings: feed CRM via `LISTINGS_FEED_URL` (secret Actions / CF / `.env`); fallback `public/data/listings-mock.xml`

## Tracking (Item 2 — no ar)

- GTM `GTM-MT4VG7GP` via Stape: `https://v1.tetesantos.com.br/gtm.js`
- Pixel Meta: só no container da agência (não hardcodado no site)
- Pop-up lead WhatsApp + Web3Forms (`PUBLIC_WEB3FORMS_ACCESS_KEY`) + `/privacidade`

## Pendente

- Lighthouse QA contínuo · form→CRM/Supabase
- Home “destaque” só lista imóveis com `featured=true` no CRM
