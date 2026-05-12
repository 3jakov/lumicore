param(
  [string]$OutputPath = "C:\git\lumicore\gemini-projects-cross-check-bundle.md"
)

$repoRoot = Split-Path -Parent $PSScriptRoot

$files = @(
  "apps/api/src/projects/projects.controller.ts",
  "apps/api/src/projects/projects.service.ts",
  "apps/api/src/projects/projects.module.ts",
  "apps/api/src/projects/dto/create-project.dto.ts",
  "apps/api/src/projects/dto/update-project.dto.ts",
  "apps/api/prisma/schema.prisma",
  "packages/shared-types/src/project.types.ts",
  "packages/shared-types/src/enums.ts",
  "packages/shared-types/src/index.ts",
  "packages/shared-types/src/api-responses.types.ts",
  "apps/web/app/(app)/projects/page.tsx",
  "apps/web/app/(app)/projects/[id]/page.tsx",
  "apps/web/app/(app)/projects/new/page.tsx",
  "apps/web/hooks/use-projects.ts",
  "apps/web/components/projects/project-status-badge.tsx",
  "apps/web/components/projects/projects-list.tsx",
  "apps/web/lib/api-client.ts",
  "apps/web/lib/query/query-keys.ts",
  "apps/web/types/contracts.ts"
)

$header = @"
# Gemini Projects Cross-Check Bundle

Use the companion prompt from `scripts/gemini-projects-cross-check-prompt.txt`.

Repository root: `C:\git\lumicore`

This bundle is intended for boundary review between backend, shared-types, and frontend Projects implementation.
If a file is missing, that absence is part of the current contract state and is explicitly marked below.

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
Write-Host "Gemini projects cross-check bundle written to $OutputPath"
