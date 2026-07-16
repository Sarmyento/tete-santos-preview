# Estado · correção e auditoria

Documento operacional do site Tetê Santos (preview + produção).

---

## Convenções de trabalho

> **NUNCA dar `git push` direto em `main`.**  
> Todo commit vai por **branch + PR**, mesmo para fixes pequenos ou de tipagem.  
> Isso vale também para o **Cursor/agente**.

| Regra | Detalhe |
|---|---|
| Fluxo obrigatório | `git checkout -b …` → commit → `git push -u origin HEAD` → `gh pr create` → merge |
| Proibido | `git push origin main` (ou qualquer push cujo destino seja `refs/heads/main`) |
| Exceção | Só com `ALLOW_MAIN_PUSH=1` em emergência documentada (hotfix crítico, infra fora do ar) |
| Por quê | Repo privado no GitHub Free **não tem branch protection real** — o guardrail é processo + hook local |

**Incidente de referência (o que não fazer):** push direto em `main` no commit `71c7b6b`. Esse padrão não deve se repetir — nem humano, nem agente.

### Hook local (bloqueio de push em `main`)

Hooks versionados em `.githooks/`. Após clonar (ou uma vez por máquina):

```bash
git config core.hooksPath .githooks
```

Ou: `npm install` (o script `prepare` configura `core.hooksPath` automaticamente).

Emergência documentada:

```bash
ALLOW_MAIN_PUSH=1 git push origin main
```

---

## Ambientes

| Ambiente | URL | Deploy |
|---|---|---|
| Preview | https://sarmyento.github.io/tete-santos-preview/ | Push/merge em `main` → Action → `gh-pages` |
| Produção | https://tetesantos.com.br | Cloudflare Pages (zona do domínio) |
