# CLAUDE.md — Tetê Santos (site)

Lido no início de cada sessão neste repo.

## Convenções de trabalho (obrigatório)

> **NUNCA dar `git push` direto em `main`.**  
> Todo commit vai por **branch + PR**, mesmo para fixes pequenos ou de tipagem.  
> Isso vale também para o **Cursor/agente**.

- Fluxo: branch → commit → push da branch → PR → merge.
- Exceção só com `ALLOW_MAIN_PUSH=1` (emergência documentada).
- Incidente de referência: commit `71c7b6b` (push direto em `main` — não repetir).
- Detalhes: `docs/ESTADO-CORRECAO-AUDITORIA.md` § Convenções de trabalho.

## Hook local (uma vez por clone)

```bash
git config core.hooksPath .githooks
```

Ou rode `npm install` — o script `prepare` configura automaticamente.

## Spec / contexto

- README.md — preview, comandos, deploy
- docs/ESTADO-CORRECAO-AUDITORIA.md — convenções + ambientes
