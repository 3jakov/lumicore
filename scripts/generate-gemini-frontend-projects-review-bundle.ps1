param(
  [string]$OutputPath = "C:\git\lumicore\gemini-frontend-projects-review-bundle.md"
)

$repoRoot = Split-Path -Parent $PSScriptRoot

$files = @(
  "apps/web/app/(app)/projects/page.tsx",
  "apps/web/app/(app)/projects/[id]/page.tsx",
  "apps/web/app/(app)/projects/new/page.tsx",
  "apps/web/hooks/use-projects.ts",
  "apps/web/components/projects/project-status-badge.tsx",
  "apps/web/components/projects/projects-list.tsx",
  "apps/web/lib/api-client.ts",
  "apps/web/lib/query/query-keys.ts",
  "apps/web/types/contracts.ts",
  "packages/shared-types/src/project.types.ts",
  "packages/shared-types/src/enums.ts"
)

$header = @"
# Gemini Frontend Projects Review Bundle

Use the companion prompt from `scripts/gemini-frontend-projects-review-prompt.txt`.

Repository root: `C:\git\lumicore`

This bundle contains the frontend Projects files needed to review the current Projects page and next-step readiness.

---

"@

$builder = [System.Text.StringBuilder]::new()
[void]$builder.Append($header)

foreach ($relativePath in $files) {
  $fullPath = Join-Path $repoRoot $relativePath

  [void]$builder.AppendLine("## FILE: $relativePath")
  [void]$builder.AppendLine()

  if (-not (Test-Path -LiteralPath $fullPath)) {
    [void]$builder.AppendLine('```text')
    [void]$builder.AppendLine("MISSING: File does not exist in current repository state.")
    [void]$builder.AppendLine('```')
    [void]$builder.AppendLine()
    continue
  }

  $extension = [System.IO.Path]::GetExtension($relativePath).TrimStart('.')
  if ([string]::IsNullOrWhiteSpace($extension)) {
    $extension = 'text'
  }

  $content = Get-Content -LiteralPath $fullPath -Raw -Encoding UTF8

  [void]$builder.AppendLine(('```' + $extension))
  [void]$builder.Append($content)
  if (-not $content.EndsWith([Environment]::NewLine)) {
    [void]$builder.AppendLine()
  }
  [void]$builder.AppendLine('```')
  [void]$builder.AppendLine()
}

[System.IO.File]::WriteAllText($OutputPath, $builder.ToString(), [System.Text.Encoding]::UTF8)
Write-Host "Gemini frontend projects review bundle written to $OutputPath"
