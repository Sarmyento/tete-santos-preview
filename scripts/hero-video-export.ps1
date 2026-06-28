# Hero video export — bundle responsivo (P3/P4)
# Uso padrao (bundle mobile + desktop + posters):
#   .\scripts\hero-video-export.ps1 -InputVideo ".\raw.mp4"
# Legado (1 arquivo):
#   .\scripts\hero-video-export.ps1 -InputVideo ".\raw.mp4" -Single -Preset 720p-lean
# SOP: sarmy/_hub/base-conhecimento/sites/hero-video-sop.md

param(
    [Parameter(Mandatory = $true)]
    [string]$InputVideo,

    [switch]$Single,

    [ValidateSet('720p-lean', '720p-crisp', '1080p-lean')]
    [string]$Preset = '720p-lean',

    [string]$Start = '00:00:00',
    [int]$Duration = 10,

    [string]$OutDir = 'public'
)

$ErrorActionPreference = 'Stop'

if (-not (Get-Command ffmpeg -ErrorAction SilentlyContinue)) {
    Write-Error 'FFmpeg nao encontrado. Instale ou use WSL.'
}

if (-not (Test-Path $InputVideo)) {
    Write-Error "Arquivo nao encontrado: $InputVideo"
}

New-Item -ItemType Directory -Force -Path $OutDir | Out-Null

function Export-HeroVariant {
    param(
        [string]$Master,
        [string]$Output,
        [string]$Size,
        [int]$Crf,
        [string]$Maxrate,
        [string]$Bufsize,
        [double]$TargetMb
    )

    $w, $h = $Size.Split(':')
    $vf = "scale=${w}:${h}:force_original_aspect_ratio=increase,crop=${w}:${h}"

    ffmpeg -y -i $Master -an `
        -vf $vf `
        -c:v libx264 -preset slow -crf $Crf -maxrate $Maxrate -bufsize $Bufsize `
        -pix_fmt yuv420p -movflags +faststart `
        $Output

    $mb = [math]::Round((Get-Item $Output).Length / 1MB, 2)
    Write-Host "   -> $(Split-Path $Output -Leaf): ${mb} MB (alvo <= ${TargetMb} MB)"
    if ($mb -gt $TargetMb) {
        Write-Warning "   Acima do alvo. Ver SOP passo 5 (CRF +2 ou duracao menor)."
    }
    return $mb
}

function Export-Poster {
    param(
        [string]$FromVideo,
        [string]$Output,
        [int]$Width,
        [int]$Quality
    )

    ffmpeg -y -ss 00:00:00.5 -i $FromVideo -vframes 1 `
        -vf "scale=${Width}:-1" -c:v libwebp -quality $Quality `
        $Output

    $kb = [math]::Round((Get-Item $Output).Length / 1KB, 0)
    Write-Host "   -> $(Split-Path $Output -Leaf): ${kb} KB"
}

$master = Join-Path $env:TEMP "hero-master-$PID.mp4"

Write-Host ">> Trim master (${Duration}s)..."
ffmpeg -y -ss $Start -i $InputVideo -t $Duration -an `
    -c:v libx264 -crf 18 -preset fast `
    $master

if ($Single) {
    switch ($Preset) {
        '720p-lean'  { $size = '1280:720';  $crf = 30; $maxrate = '1200k'; $buf = '2400k'; $targetMb = 2 }
        '720p-crisp' { $size = '1280:720';  $crf = 26; $maxrate = '1800k'; $buf = '3600k'; $targetMb = 3 }
        '1080p-lean' { $size = '1920:1080'; $crf = 28; $maxrate = '2500k'; $buf = '5000k'; $targetMb = 4 }
    }

    $mp4 = Join-Path $OutDir 'hero-loop.mp4'
    Write-Host ">> Export single ($Preset)..."
    Export-HeroVariant -Master $master -Output $mp4 -Size $size -Crf $crf -Maxrate $maxrate -Bufsize $buf -TargetMb $targetMb | Out-Null

    Write-Host ">> Poster hero-poster.webp..."
    Export-Poster -FromVideo $mp4 -Output (Join-Path $OutDir 'hero-poster.webp') -Width 1280 -Quality 80
}
else {
    Write-Host ">> Bundle responsivo..."

    $mobile = Join-Path $OutDir 'hero-loop-mobile.mp4'
    $desktop = Join-Path $OutDir 'hero-loop-desktop.mp4'
    $legacy = Join-Path $OutDir 'hero-loop.mp4'

    Export-HeroVariant -Master $master -Output $mobile -Size '1280:720' `
        -Crf 31 -Maxrate '1000k' -Bufsize '2000k' -TargetMb 1.5 | Out-Null

    Export-HeroVariant -Master $master -Output $desktop -Size '1920:1080' `
        -Crf 28 -Maxrate '2200k' -Bufsize '4400k' -TargetMb 3 | Out-Null

    Copy-Item -Force $mobile $legacy
    Write-Host "   -> hero-loop.mp4 (copia mobile, compat legado)"

    Write-Host ">> Posters srcset..."
    Export-Poster -FromVideo $mobile -Output (Join-Path $OutDir 'hero-poster-640.webp') -Width 640 -Quality 78
    Export-Poster -FromVideo $desktop -Output (Join-Path $OutDir 'hero-poster-1280.webp') -Width 1280 -Quality 80

    Copy-Item -Force (Join-Path $OutDir 'hero-poster-1280.webp') (Join-Path $OutDir 'hero-poster.webp')
    Write-Host "   -> hero-poster.webp (copia 1280, compat legado)"
}

Remove-Item $master -Force -ErrorAction SilentlyContinue

Write-Host ">> Concluido. Wire HeroVideo.astro com defaults ou paths em public/"
