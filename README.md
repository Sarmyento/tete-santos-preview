# Site Tetê Santos · preview público

Preview estático do site Tetê Santos (Heritage Real · P4) para validação da cliente.

## Preview online

**URL:** https://sarmyento.github.io/tete-santos-preview/

Rotas sugeridas para revisão:

- `/tete-santos-preview/` (home)
- `/tete-santos-preview/imoveis`
- `/tete-santos-preview/imoveis/ts-003`
- `/tete-santos-preview/sobre`
- `/tete-santos-preview/contato`

> Ambiente de preview: `noindex` ativo · imóveis/endereços mock · domínio final `tetesantos.com.br` pendente.

## Repo local

`C:\Users\sarmy\Dev\Sarmy\sites-clientes\tete-santos\`

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

Push na branch `main` publica o build na branch `gh-pages`.

**Ativar preview (uma vez):** GitHub → repo → Settings → Pages → Source: **Deploy from a branch** → branch `gh-pages` / `/ (root)`.

URL final: https://sarmyento.github.io/tete-santos-preview/

- Astro 7 · output estático
- Motion LCW · identidade Heritage Real
- Hero/about: kit avatar seed **42002**
- Listings: `public/data/listings-mock.xml` (CRM real na fase P4)

## Pendente pós-aprovação Tetê

- Lighthouse QA · domínio · feed CRM · forms Supabase · termo LGPD
