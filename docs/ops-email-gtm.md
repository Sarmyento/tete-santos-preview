# Ops — e-mail + GTM · Tetê Santos

Atualizado: **2026-08-01**

## Google Workspace

| Campo | Valor |
|---|---|
| Domínio | `tetesantos.com.br` |
| Usuário | `tetesantos@tetesantos.com.br` |
| Alias | `contato@tetesantos.com.br` (mesma caixa) |
| Plano | Google Workspace Business Starter |
| Admin | conta da Tetê (Super Admin) |

### DNS (Cloudflare zone)

| Tipo | Nome | Conteúdo (resumo) |
|---|---|---|
| MX | `@` | `aspmx.l.google.com` (+ alt1–4) |
| TXT | `@` | `v=spf1 include:_spf.google.com ~all` |
| TXT | `google._domainkey` | DKIM Google (`v=DKIM1; k=rsa; p=…`) |
| TXT | `_dmarc` | `v=DMARC1; p=quarantine; rua=mailto:contato@tetesantos.com.br; pct=100;` |
| CNAME | `v1` | `saf.stape.io` (Stape sGTM) |

### Status e-mail (01/08)

- [x] Domínio verificado no Admin
- [x] MX / SPF
- [x] DKIM gerado + TXT publicado + **Iniciar autenticação** (botão “Parar autenticação” visível)
- [x] Alias `contato@` criado
- [x] Teste manual: e-mail externo → `contato@` chegou na inbox
- [x] Web3Forms → `contato@` (submit OK + e-mail verificado no Web3Forms)
- [ ] DMARC `p=reject` (só depois de período estável com `quarantine`)

## Web3Forms

| Campo | Valor |
|---|---|
| Access key | env `PUBLIC_WEB3FORMS_ACCESS_KEY` (CF Pages + GH Actions secret) |
| Uso no site | pop-up WhatsApp (`WhatsAppLeadModal.astro`) |
| Destino | `contato@tetesantos.com.br` |
| API | `https://api.web3forms.com/submit` |

O formulário em `/contato` **não** usa Web3Forms — abre WhatsApp com a mensagem montada.

## GTM / Stape (Item 2 agência)

| Campo | Valor |
|---|---|
| Container | `GTM-MT4VG7GP` |
| Host | `https://v1.tetesantos.com.br` |
| Snippet | `src/components/global/Tracking.astro` + `GtmNoscript.astro` |
| Commit no ar | `74a4d16` (`feat(tracking): GTM Stape, pop-up lead e privacidade`) |
| Pixel Meta | gerenciado **só** no GTM da agência |

### Por que o debug Web falhou (28/07)

A agência atualizou o GTM para o domínio próprio, mas o **site em produção ainda não carregava o snippet**. Sem `gtm.js` na página, Preview/Tag Assistant não reconhece. Corrigido com o publish do Item 2 em 01/08.

### Pendência agência

Substituir placeholders `AW-PREENCHER` / `PREENCHER` (Google Ads, Pinterest, LinkedIn) no container.

## Arquivos no repo

- `src/components/global/Tracking.astro`
- `src/components/global/GtmNoscript.astro`
- `src/components/global/WhatsAppLeadModal.astro`
- `src/pages/privacidade.astro`
- `docs/checklist-google-workspace-reuniao-tete.html` (checklist da reunião presencial)
