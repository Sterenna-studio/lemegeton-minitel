#requires -Version 7.0
$ErrorActionPreference = 'Stop'
$root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$web = Join-Path $root '07_WEB_MINITEL'
$out = Join-Path $PSScriptRoot ('validation-' + [DateTime]::UtcNow.ToString('yyyyMMdd-HHmmss'))
New-Item -ItemType Directory -Path $out -ErrorAction Stop | Out-Null
$blender = 'C:\Program Files\Blender Foundation\Blender 5.2\blender.exe'
$checks = @(
    @{name='typecheck'; exe='npm.cmd'; args=@('run','typecheck'); cwd=$web},
    @{name='lint'; exe='npm.cmd'; args=@('run','lint'); cwd=$web},
    @{name='unit'; exe='npm.cmd'; args=@('test'); cwd=$web},
    @{name='build'; exe='npm.cmd'; args=@('run','build'); cwd=$web},
    @{name='browser'; exe='npm.cmd'; args=@('run','test:browser'); cwd=$web},
    @{name='production'; exe='node'; args=@('tools/verify_production.mjs'); cwd=$web},
    @{name='npm-audit'; exe='npm.cmd'; args=@('audit','--json'); cwd=$web},
    @{name='blender-workshop'; exe=$blender; args=@('--background','--python-exit-code','1','--python','04_BLENDER/scripts/verify_workshop.py'); cwd=$root},
    @{name='blender-export'; exe=$blender; args=@('--background','--python-exit-code','1','--python','04_BLENDER/scripts/verify_export.py'); cwd=$root}
)
$results = @()
foreach ($check in $checks) {
    Write-Host "VERIFICATION: $($check.name)"
    Push-Location -LiteralPath $check.cwd
    try {
        $started = [DateTime]::UtcNow
        & $check.exe @($check.args) 2>&1 | Tee-Object -FilePath (Join-Path $out ($check.name + '.log')) | Out-Host
        $code = $LASTEXITCODE
        $results += [pscustomobject]@{name=$check.name; exitCode=$code; startedUtc=$started.ToString('o'); endedUtc=[DateTime]::UtcNow.ToString('o')}
    } finally { Pop-Location }
}
$results | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath (Join-Path $out 'results.json') -Encoding utf8
[pscustomobject]@{validationFolder=[IO.Path]::GetRelativePath($root,$out).Replace('\','/'); checks=$results} | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath (Join-Path $PSScriptRoot 'LATEST_VALIDATION.json') -Encoding utf8
if (@($results | Where-Object exitCode -ne 0).Count) { throw 'Une ou plusieurs verifications ont echoue : lire results.json et les journaux' }
Write-Host "VALIDATION_OK: $out"
