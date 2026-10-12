<#
.SYNOPSIS
    Regenerates docs/codebase-index.md from the current repository state.

.DESCRIPTION
    Catalogs tracked documentation, application source, configuration, build,
    and infrastructure files. New files under docs are also included so the
    index can be generated before the documentation is staged or committed.

    Summaries are heuristic and should be reviewed after generation.

.NOTES
    Run from any directory. The repository root is resolved from this script.
#>

[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = (Resolve-Path (Join-Path $scriptDir '..\..')).Path
$docsDir = Join-Path $repoRoot 'docs'
$indexPath = Join-Path $docsDir 'codebase-index.md'

function Get-RelativePath {
    param([string]$FullPath)

    return $FullPath.Substring($repoRoot.Length).TrimStart('\', '/') -replace '\\', '/'
}

function Format-Size {
    param([long]$Bytes)

    $culture = [System.Globalization.CultureInfo]::InvariantCulture
    if ($Bytes -ge 1MB) { return '{0} MB' -f (($Bytes / 1MB).ToString('N1', $culture)) }
    if ($Bytes -ge 1KB) { return '{0} KB' -f (($Bytes / 1KB).ToString('N1', $culture)) }
    return "$Bytes B"
}

function Escape-Cell {
    param([AllowEmptyString()][string]$Value)

    if ($null -eq $Value) { return '' }
    return (($Value -replace '\|', '\|') -replace '\r?\n', ' ').Trim()
}

function Get-LastModified {
    param([string]$RelativePath, [string]$FullPath)

    Push-Location $repoRoot
    try {
        $date = git log -1 --format=%cd --date=short -- $RelativePath 2>$null
    }
    finally {
        Pop-Location
    }

    if ([string]::IsNullOrWhiteSpace($date)) {
        return (Get-Item $FullPath).LastWriteTime.ToString('yyyy-MM-dd')
    }

    return $date
}

function Get-MarkdownTopics {
    param([string]$FullPath)

    $insideFence = $false
    $headings = foreach ($line in Get-Content $FullPath -Encoding UTF8 -TotalCount 150) {
        if ($line -match '^```') {
            $insideFence = -not $insideFence
            continue
        }

        if (-not $insideFence -and $line -match '^#{1,3}\s+(.+)') {
            ($line -replace '^#{1,3}\s+', '').Trim()
        }
    }

    return ($headings | Select-Object -First 4) -join '; '
}

function Get-SourceSymbols {
    param([string]$FullPath, [string]$Extension)

    $content = Get-Content $FullPath -Raw -Encoding UTF8

    if ($Extension -eq '.cs') {
        $matches = [regex]::Matches(
            $content,
            '(?m)^\s*(?:public|internal)?\s*(?:static\s+|abstract\s+|sealed\s+|partial\s+)*(?:class|interface|enum|record)\s+([A-Za-z0-9_]+)'
        )
        return ($matches | ForEach-Object { $_.Groups[1].Value } | Select-Object -Unique) -join ', '
    }

    $matches = [regex]::Matches(
        $content,
        '(?m)^export\s+(?:default\s+)?(?:async\s+)?(?:function|class|const|type|interface)\s+([A-Za-z0-9_]+)'
    )
    return ($matches | ForEach-Object { $_.Groups[1].Value } | Select-Object -Unique) -join ', '
}

function Get-ConfigSummary {
    param([string]$FullPath, [string]$Extension)

    if ($Extension -eq '.json') {
        try {
            $json = Get-Content $FullPath -Raw -Encoding UTF8 | ConvertFrom-Json
            return ($json.PSObject.Properties.Name | Select-Object -First 8) -join ', '
        }
        catch {
            return 'JSON configuration'
        }
    }

    $fileName = [System.IO.Path]::GetFileName($FullPath)
    switch -Regex ($fileName) {
        'docker-compose' { return 'Local service orchestration' }
        '\.ya?ml$' { return 'Workflow or YAML configuration' }
        '\.csproj$' { return '.NET project and package references' }
        '\.mjs$' { return 'JavaScript tooling configuration' }
        '\.example$' { return 'Environment variable template' }
        '\.http$' { return 'HTTP request examples' }
        '\.ps1$' { return 'PowerShell maintenance script' }
        default { return 'Project configuration' }
    }
}

Push-Location $repoRoot
try {
    $trackedFiles = @(git ls-files)
}
finally {
    Pop-Location
}

$newDocs = Get-ChildItem $docsDir -File -Recurse |
    ForEach-Object { Get-RelativePath $_.FullName }

$relativePaths = @($trackedFiles) + @($newDocs) |
    Where-Object { $_ -ne 'docs/codebase-index.md' } |
    Sort-Object -Unique

$files = foreach ($relativePath in $relativePaths) {
    $fullPath = Join-Path $repoRoot ($relativePath -replace '/', '\')
    if (Test-Path $fullPath -PathType Leaf) {
        [pscustomobject]@{
            RelativePath = $relativePath
            FullPath = $fullPath
            Extension = [System.IO.Path]::GetExtension($fullPath).ToLowerInvariant()
        }
    }
}

$documentationExtensions = @('.md')
$sourceExtensions = @('.cs', '.ts', '.tsx')
$configExtensions = @('.json', '.yml', '.yaml', '.csproj', '.mjs', '.example', '.http', '.ps1')

$documentationRows = foreach ($file in $files | Where-Object { $documentationExtensions -contains $_.Extension }) {
    $item = Get-Item $file.FullPath
    $topics = Escape-Cell (Get-MarkdownTopics $file.FullPath)
    $modified = Get-LastModified $file.RelativePath $file.FullPath
    "| $($file.RelativePath) | $(Format-Size $item.Length) | $topics | $modified |"
}

$sourceRows = foreach ($file in $files | Where-Object { $sourceExtensions -contains $_.Extension }) {
    $item = Get-Item $file.FullPath
    $area = if ($file.RelativePath -like 'finapp/frontend/*') { 'Frontend' } else { 'Backend' }
    $symbols = Escape-Cell (Get-SourceSymbols $file.FullPath $file.Extension)
    "| $($file.RelativePath) | $area | $symbols | $(Format-Size $item.Length) |"
}

$configRows = foreach ($file in $files | Where-Object { $configExtensions -contains $_.Extension }) {
    $summary = Escape-Cell (Get-ConfigSummary $file.FullPath $file.Extension)
    "| $($file.RelativePath) | $summary |"
}

$generatedOn = Get-Date -Format 'yyyy-MM-dd'
$builder = [System.Text.StringBuilder]::new()

[void]$builder.AppendLine('# Codebase Index')
[void]$builder.AppendLine()
[void]$builder.AppendLine("> Generated by ``docs/scripts/Update-CodebaseIndex.ps1`` on $generatedOn.")
[void]$builder.AppendLine('> Re-run the script instead of editing table rows manually. Review heuristic summaries after generation.')
[void]$builder.AppendLine()
[void]$builder.AppendLine('## Documentation files')
[void]$builder.AppendLine()
[void]$builder.AppendLine('| Path | Size | Key topics | Last modified |')
[void]$builder.AppendLine('|---|---|---|---|')
foreach ($row in $documentationRows) { [void]$builder.AppendLine($row) }
[void]$builder.AppendLine()
[void]$builder.AppendLine('## Application source files')
[void]$builder.AppendLine()
[void]$builder.AppendLine('| Path | Area | Exported or top-level symbols | Size |')
[void]$builder.AppendLine('|---|---|---|---|')
foreach ($row in $sourceRows) { [void]$builder.AppendLine($row) }
[void]$builder.AppendLine()
[void]$builder.AppendLine('## Configuration, build, and maintenance files')
[void]$builder.AppendLine()
[void]$builder.AppendLine('| Path | Purpose or top-level settings |')
[void]$builder.AppendLine('|---|---|')
foreach ($row in $configRows) { [void]$builder.AppendLine($row) }
[void]$builder.AppendLine()
[void]$builder.AppendLine('## Key relationships')
[void]$builder.AppendLine()
[void]$builder.AppendLine('- Browser authentication uses `lib/firebase/client.ts`; Next.js server sessions use `lib/firebase/admin.ts` through `lib/auth/session.ts`.')
[void]$builder.AppendLine('- `app/api/auth/session/route.ts` exposes the session operations implemented by `lib/auth/session.ts`.')
[void]$builder.AppendLine('- Protected server pages call `getCurrentUser()`; `proxy.ts` only redirects based on cookie presence.')
[void]$builder.AppendLine('- Browser backend calls send a Firebase ID token; `finapp/backend/Program.cs` validates it as a Bearer token.')
[void]$builder.AppendLine('- `AppDbContext` maps `User.DefaultTenantId` to `Tenant.Id`; migrations are the deployed schema history.')
[void]$builder.AppendLine('- `.github/workflows/frontend.yml` and `.github/workflows/backend.yml` validate their corresponding application directories.')

Set-Content -Path $indexPath -Value $builder.ToString() -NoNewline -Encoding UTF8

Write-Host "Wrote $indexPath"
Write-Host "  Documentation files: $($documentationRows.Count)"
Write-Host "  Application source files: $($sourceRows.Count)"
Write-Host "  Configuration files: $($configRows.Count)"
