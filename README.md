# Site Tetê Santos · preview + produção

Site Astro estático (Heritage Real · P4). Repo: `Sarmyento/tete-santos-preview`.

## URLs

| Ambiente | URL |
|---|---|
| **Produção** | https://tetesantos.com.br |
| Preview GH Pages | https://sarmyento.github.io/tete-santos-preview/ |
| Cloudflare Pages | projeto `tete-santos-preview` (autodeploy de `main`) |

Rotas úteis (prod): `/` · `/imoveis` · `/sobre` · `/servicos` · `/contato` · `/privacidade`

## Repo local

`C:\Users\sarmy\Dev\Sarmy\sites-clientes\tete-santos\`

## Estado visual (01/08/2026)

- **Hero:** rotação **H8 + H17 + H18** (1 foto Tetê + 2 imóveis).
  - Foto flush sob o menu (`top: header × 2` + overlay).
  - Desktop: hero mais alto (`100vh + header`); header opaco.
  - Mobile H8: `object-position 62% 0%`, Ken Burns desligado.
- **Serviços (home):** fundo **sólido bordô** (sem `services-bg-living`).

## Tracking / leads (Item 2 — no ar desde `74a4d16`)

| Peça | Detalhe |
|---|---|
| GTM | `GTM-MT4VG7GP` |
| Loader | `https://v1.tetesantos.com.br/gtm.js` (Stape sGTM) |
| DNS | `v1.tetesantos.com.br` → CNAME `saf.stape.io` |
| Pixel Meta | só no container da agência (não hardcodado no site) |
| Pop-up WA | `WhatsAppLeadModal` + `dataLayer` `generate_lead` |
| Web3Forms | `PUBLIC_WEB3FORMS_ACCESS_KEY` (CF Pages + secret GH Actions) |
| Destino e-mail | `contato@tetesantos.com.br` (alias Workspace) |
| LGPD | `/privacidade` + link no rodapé |

**Validado 01/08:** HTML prod com snippet Stape; `dataLayer` + `gtm.js` + `fbevents.js` carregando. Tag Assistant da agência falhava antes porque o snippet ainda não estava publicado.

**Pendência da agência:** substituir placeholders `AW-PREENCHER` / `PREENCHER` (Ads, Pinterest, LinkedIn) no container GTM.

Detalhe ops: [`docs/ops-email-gtm.md`](docs/ops-email-gtm.md)

## E-mail Google Workspace (01/08)

| Item | Estado |
|---|---|
| Conta | `tetesantos@tetesantos.com.br` (única mailbox) |
| Alias | `contato@tetesantos.com.br` → mesma caixa |
| MX / SPF | Google OK |
| DKIM | `google._domainkey` + autenticação ativa no Admin |
| DMARC | `p=quarantine` · `rua=mailto:contato@…` |
| Web3Forms | recipient `contato@` · e-mail verificado |

Checklist histórico da reunião: [`docs/checklist-google-workspace-reuniao-tete.html`](docs/checklist-google-workspace-reuniao-tete.html)

## Ver mobile no localhost

1. `npm run dev` → http://localhost:4321/
2. Chrome/Edge → **F12** → **Ctrl+Shift+M**
3. Preset iPhone ou **390×844** → recarregar (**Ctrl+R**)

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

Push em `main` publica:

1. **GitHub Pages** (workflow → branch `gh-pages`)
2. **Cloudflare Pages** → `tetesantos.com.br`

Env de produção (CF Pages): `LISTINGS_FEED_URL`, `PUBLIC_WEB3FORMS_ACCESS_KEY`.

- Astro 7 · output estático · Motion LCW · Heritage Real
- Avatar seed **42002** · hero H8/H17/H18
- Listings: feed CRM via `LISTINGS_FEED_URL`; fallback `public/data/listings-mock.xml`

## Pendente

- Lighthouse QA contínuo · form→CRM/Supabase
- Home “destaque” só com `featured=true` no CRM
- Agência: limpar IDs `PREENCHER` no GTM
- DMARC: evoluir para `p=reject` após período estável
