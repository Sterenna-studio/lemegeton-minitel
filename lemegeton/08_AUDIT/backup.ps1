#requires -Version 7.0
param([switch]$VerifyOnly, [string]$Archive)
$ErrorActionPreference = 'Stop'
$root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$destination = Join-Path $root '09_SAUVEGARDES'
if (-not $destination.StartsWith($root + '\', [StringComparison]::OrdinalIgnoreCase)) { throw 'Destination hors projet' }
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem

function Get-ProjectFiles([string]$folder) {
    foreach ($entry in Get-ChildItem -LiteralPath $folder -Force) {
        if ($entry.Attributes -band [IO.FileAttributes]::ReparsePoint) { throw "Lien a auditer avant sauvegarde: $($entry.FullName)" }
        if ($entry.PSIsContainer) {
            if ($entry.Name -in @('09_SAUVEGARDES', 'node_modules', 'dist', 'test-results', 'playwright-report', '.git', '__pycache__')) { continue }
            Get-ProjectFiles $entry.FullName
        } elseif (($entry.Name -notlike '*.log' -or $entry.FullName.StartsWith($PSScriptRoot + '\', [StringComparison]::OrdinalIgnoreCase)) -and $entry.Name -notlike '*.tsbuildinfo' -and $entry.Name -notlike '*.pyc') {
            $entry
        }
    }
}
function Test-Archive([string]$file) {
    $zip = [IO.Compression.ZipFile]::OpenRead($file)
    try {
        $entry = $zip.GetEntry('_BACKUP_MANIFEST.csv')
        if ($null -eq $entry) { throw 'Manifeste interne absent' }
        $reader = [IO.StreamReader]::new($entry.Open())
        try { $rows = @($reader.ReadToEnd() | ConvertFrom-Csv) } finally { $reader.Dispose() }
        $verified = 0
        foreach ($row in $rows) {
            $item = $zip.GetEntry($row.path)
            if ($null -eq $item -or $item.Length -ne [long]$row.bytes) { throw "Entree absente ou taille incorrecte: $($row.path)" }
            $stream = $item.Open()
            $sha = [Security.Cryptography.SHA256]::Create()
            try { $actual = [Convert]::ToHexString($sha.ComputeHash($stream)) } finally { $stream.Dispose(); $sha.Dispose() }
            if ($actual -ne $row.sha256) { throw "Empreinte incorrecte: $($row.path)" }
            $verified++
            if ($verified % 100 -eq 0) { Write-Host "Archive verifiee: $verified / $($rows.Count) fichiers" }
        }
        if ($zip.Entries.Count -ne $rows.Count + 1) { throw 'Nombre inattendu d entrees dans le ZIP' }
        return $verified
    } finally { $zip.Dispose() }
}
if ($VerifyOnly) {
    if (-not $Archive) { throw 'Specifier -Archive pour la verification' }
    $resolved = (Resolve-Path -LiteralPath $Archive).Path
    if (-not $resolved.StartsWith($destination + '\', [StringComparison]::OrdinalIgnoreCase)) { throw 'Archive hors dossier de sauvegarde' }
    $count = Test-Archive $resolved
    Write-Host "OK: $count fichiers verifies"
    exit 0
}

New-Item -ItemType Directory -Path $destination -Force | Out-Null
$stamp = [DateTime]::UtcNow.ToString('yyyyMMdd-HHmmss')
$base = Join-Path $destination "LEMEGETON-$stamp"
$files = @(Get-ProjectFiles $root | Sort-Object FullName)
$bytes = ($files | Measure-Object Length -Sum).Sum
$drive = [IO.DriveInfo]::new([IO.Path]::GetPathRoot($root))
if ($drive.AvailableFreeSpace -lt $bytes + 256MB) { throw 'Espace disque insuffisant pour une sauvegarde prudente' }
$rows = @($files | ForEach-Object {
    [pscustomobject]@{path=[IO.Path]::GetRelativePath($root, $_.FullName).Replace('\','/'); bytes=$_.Length; sha256=(Get-FileHash -LiteralPath $_.FullName -Algorithm SHA256).Hash}
})
$rows | Export-Csv -LiteralPath "$base.manifest.csv" -NoTypeInformation -Encoding utf8
$zip = [IO.Compression.ZipFile]::Open("$base.zip", [IO.Compression.ZipArchiveMode]::Create)
try {
    for ($i=0; $i -lt $files.Count; $i++) {
        [IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, $files[$i].FullName, $rows[$i].path, [IO.Compression.CompressionLevel]::Fastest) | Out-Null
        if (($i+1) % 100 -eq 0) { Write-Host "Archive creee: $($i+1) / $($files.Count) fichiers" }
    }
    [IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, "$base.manifest.csv", '_BACKUP_MANIFEST.csv') | Out-Null
} finally { $zip.Dispose() }
$verified = Test-Archive "$base.zip"
$report = [pscustomobject]@{
    createdUtc=[DateTime]::UtcNow.ToString('o'); archive=[IO.Path]::GetRelativePath($root,"$base.zip").Replace('\','/');
    manifest=[IO.Path]::GetRelativePath($root,"$base.manifest.csv").Replace('\','/'); sourceFiles=$files.Count;
    sourceBytes=$bytes; archiveBytes=(Get-Item -LiteralPath "$base.zip").Length; verifiedEntries=$verified;
    archiveSHA256=(Get-FileHash -LiteralPath "$base.zip" -Algorithm SHA256).Hash;
    excluded=@('09_SAUVEGARDES','node_modules','dist','test-results','playwright-report','.git','__pycache__','*.log hors 08_AUDIT','*.tsbuildinfo','*.pyc');
    independentBackup=$false; unsavedBlenderStateIncluded=$false
}
$report | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath "$base.report.json" -Encoding utf8
$report | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath (Join-Path $destination 'LATEST.json') -Encoding utf8
$report | ConvertTo-Json -Depth 5
