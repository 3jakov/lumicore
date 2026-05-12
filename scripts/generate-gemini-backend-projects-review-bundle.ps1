param(
  [string]$OutputPath = "C:\git\lumicore\gemini-backend-projects-review-bundle.md"
)

$repoRoot = Split-Path -Parent $PSScriptRoot

$files = @(
  "apps/api/src/projects/projects.controller.ts",
  "apps/api/src/projects/projects.service.ts",
  "apps/api/src/projects/projects.module.ts",
  "apps/api/src/projects/dto/create-project.dto.ts",
  "apps/api/src/projects/dto/update-project.dto.ts",
  "packages/shared-types/src/project.types.ts",
  "packages/shared-types/src/enums.ts",
  "packages/shared-types/src/index.ts",
  "packages/shared-types/src/api-responses.types.ts",
  "apps/api/prisma/schema.prisma",
  "apps/api/src/common/interceptors/transform.interceptor.ts",
  "apps/api/src/common/pipes/parse-pagination.pipe.ts",
  "apps/api/src/main.ts"
)

$header = @"
# Gemini Backend Projects Review Bundle

Use the companion prompt from `scripts/gemini-backend-projects-review-prompt.txt`.

Repository root: `C:\git\lumicore`

This bundle contains the backend Projects files needed to review Projects handoff readiness.
If a file is not present in the repository yet, it is explicitly marked as missing below.

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
Write-Host "Gemini backend projects review bundle written to $OutputPath"
