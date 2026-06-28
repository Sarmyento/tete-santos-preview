/**
 * Gera src/styles/tokens.css a partir de brand.json (schema A22).
 * Uso: node scripts/apply-brand.mjs [caminho/brand.json]
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const brandPath = process.argv[2]
  ? resolve(process.argv[2])
  : resolve(root, 'brand.json.example');

const FORBIDDEN = ['#9994CE', '#9994ce', 'Urbanist'];

function loadBrand(path) {
  const raw = readFileSync(path, 'utf8');
  const brand = JSON.parse(raw);
  const blob = JSON.stringify(brand);
  for (const f of FORBIDDEN) {
    if (blob.includes(f)) {
      console.error(`ERRO: brand.json contem token Sarmy proibido (${f}). Corrija antes de aplicar.`);
      process.exit(1);
    }
  }
  return brand;
}

function cssVar(name, value) {
  return `  ${name}: ${value};`;
}

function buildTokens(brand) {
  const c = brand.colors ?? {};
  const t = brand.typography ?? {};
  const scale = t.scale ?? {};
  const base = brand.spacing?.base ?? 8;
  const neutrals = c.neutrals ?? ['#1a1a1a', '#f5f5f5', '#6b7280'];
  const semantic = c.semantic ?? {};

  const lines = [
    '/* Gerado por scripts/apply-brand.mjs — nao editar manualmente */',
    ':root {',
    cssVar('--color-primary', c.primary ?? '#2563eb'),
    cssVar('--color-secondary', c.secondary ?? '#64748b'),
    cssVar('--color-neutral-900', neutrals[0] ?? '#1a1a1a'),
    cssVar('--color-neutral-100', neutrals[1] ?? '#f5f5f5'),
    cssVar('--color-neutral-500', neutrals[2] ?? '#6b7280'),
    cssVar('--color-success', semantic.success ?? '#15803d'),
    cssVar('--color-warning', semantic.warning ?? '#ca8a04'),
    cssVar('--color-danger', semantic.danger ?? '#b91c1c'),
    cssVar('--font-heading', `"${t.heading?.family ?? 'Georgia'}", serif`),
    cssVar('--font-body', `"${t.body?.family ?? 'system-ui'}", sans-serif`),
    cssVar('--text-h1', scale.h1 ?? '2.75rem'),
    cssVar('--text-h2', scale.h2 ?? '2rem'),
    cssVar('--text-h3', scale.h3 ?? '1.5rem'),
    cssVar('--text-body', scale.body ?? '1rem'),
    cssVar('--text-small', scale.small ?? '0.875rem'),
    cssVar('--space-base', `${base}px`),
    cssVar('--space-1', `calc(var(--space-base) * 1)`),
    cssVar('--space-2', `calc(var(--space-base) * 2)`),
    cssVar('--space-3', `calc(var(--space-base) * 3)`),
    cssVar('--space-4', `calc(var(--space-base) * 4)`),
    cssVar('--space-6', `calc(var(--space-base) * 6)`),
    cssVar('--space-8', `calc(var(--space-base) * 8)`),
    cssVar('--radius-sm', '4px'),
    cssVar('--radius-md', '8px'),
    cssVar('--radius-lg', '16px'),
    cssVar('--shadow-soft', '0 4px 24px rgb(0 0 0 / 0.08)'),
    cssVar('--transition-base', '0.25s ease'),
    '}',
    '',
  ];
  return lines.join('\n');
}

const brand = loadBrand(brandPath);
const out = resolve(root, 'src/styles/tokens.css');
writeFileSync(out, buildTokens(brand), 'utf8');
console.log(`OK: tokens aplicados de ${brandPath}`);
console.log(`     -> ${out}`);
