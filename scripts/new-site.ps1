# Cria novo site cliente a partir do scaffold
# Uso: .\scripts\new-site.ps1 -Slug "acme" -BrandJson "C:\...\brand.json"

param(
  [Parameter(Mandatory = $true)]
  [string]$Slug,
  [string]$BrandJson = ""
)

$ErrorActionPreference = "Stop"
$Root = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$Scaffold = Join-Path $Root "sites-scaffold"
$Target = Join-Path $Root "sites-clientes" $Slug

if (Test-Path $Target) {
  Write-Error "Ja existe: $Target"
}

New-Item -ItemType Directory -Path (Join-Path $Root "sites-clientes") -Force | Out-Null
Copy-Item -Recurse $Scaffold $Target
Remove-Item -Recurse -Force (Join-Path $Target "node_modules") -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force (Join-Path $Target "dist") -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force (Join-Path $Target ".astro") -ErrorAction SilentlyContinue

Push-Location $Target
npm install
if ($BrandJson -and (Test-Path $BrandJson)) {
  npm run apply-brand -- $BrandJson
} else {
  npm run apply-brand -- brand.json.example
  Write-Host "AVISO: brand.json nao passado; usando example. Rode apply-brand depois."
}
Pop-Location

Write-Host "OK: $Target"
Write-Host "Proximo: editar src/config/site.ts e npm run dev"
