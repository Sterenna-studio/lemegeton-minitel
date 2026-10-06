#requires -Version 7.0
$ErrorActionPreference = 'Stop'
$root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$rows = @(Import-Csv -LiteralPath (Join-Path $root 'TRI_MANIFEST.csv'))
if ($rows.Count -ne 51) { throw 'Le manifeste historique doit contenir 51 fichiers' }
$results = @($rows | ForEach-Object {
    $path = [IO.Path]::GetFullPath((Join-Path $root $_.chemin_apres))
    if (-not $path.StartsWith($root + '\', [StringComparison]::OrdinalIgnoreCase)) { throw 'Chemin hors projet' }
    $file = Get-Item -LiteralPath $path
    $hash = (Get-FileHash -LiteralPath $path -Algorithm SHA256).Hash
    [pscustomobject]@{path=$_.chemin_apres; bytes=$file.Length; sha256=$hash; unchanged=($hash -eq $_.sha256 -and $file.Length -eq [long]$_.taille_octets)}
})
$changed = @($results | Where-Object { -not $_.unchanged }).Count
$report = [pscustomobject]@{verifiedUtc=[DateTime]::UtcNow.ToString('o'); checked=$results.Count; changed=$changed; files=$results}
$report | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath (Join-Path $PSScriptRoot 'SOURCE_VERIFICATION.json') -Encoding utf8
if ($changed) { throw "$changed sources historiques modifiees : lire SOURCE_VERIFICATION.json" }
Write-Host "SOURCES_OK: $($results.Count) fichiers, aucune modification"
