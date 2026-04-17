param(
  [string]$OutputPath = "C:\git\lumicore\gemini-backend-review-bundle.md"
)

$repoRoot = Split-Path -Parent $PSScriptRoot

$files = @(
  "apps/api/src/auth/auth.controller.ts",
  "apps/api/src/auth/auth.service.ts",
  "apps/api/src/auth/auth.module.ts",
  "apps/api/src/auth/strategies/jwt.strategy.ts",
  "apps/api/src/auth/dto/login.dto.ts",
  "apps/api/src/auth/dto/otp-request.dto.ts",
  "apps/api/src/auth/dto/otp-verify.dto.ts",
  "apps/api/src/auth/dto/refresh-token.dto.ts",
  "apps/api/src/common/guards/jwt-auth.guard.ts",
  "apps/api/src/common/guards/roles.guard.ts",
  "apps/api/src/common/decorators/current-user.decorator.ts",
  "apps/api/src/common/decorators/roles.decorator.ts",
  "apps/api/src/main.ts",
  "apps/api/src/app.module.ts",
  "apps/api/prisma/schema.prisma",
  "apps/api/prisma/seed.ts",
  "packages/shared-types/src/auth.types.ts",
  "packages/shared-types/src/employee.types.ts",
  "packages/shared-types/src/enums.ts",
  "packages/shared-types/src/index.ts",
  "apps/api/package.json",
  "apps/api/prisma/migrations/migration_lock.toml",
  "apps/api/prisma/migrations/20260406_initial_schema/migration.sql"
)

$header = @"
# Gemini Backend Review Bundle

Use the companion prompt from `scripts/gemini-backend-review-prompt.txt`.

Repository root: `C:\git\lumicore`

This bundle contains the backend-auth and shared-contract files needed to review M1 frontend handoff readiness.

---

"@

$builder = [System.Text.StringBuilder]::new()
[void]$builder.Append($header)

foreach ($relativePath in $files) {
  $fullPath = Join-Path $repoRoot $relativePath

  if (-not (Test-Path -LiteralPath $fullPath)) {
    throw "Missing file: $relativePath"
  }

  $extension = [System.IO.Path]::GetExtension($relativePath).TrimStart('.')
  if ([string]::IsNullOrWhiteSpace($extension)) {
    $extension = 'text'
  }

  $content = Get-Content -LiteralPath $fullPath -Raw -Encoding UTF8

  [void]$builder.AppendLine("## FILE: $relativePath")
  [void]$builder.AppendLine()
  [void]$builder.AppendLine("```$extension")
  [void]$builder.Append($content)

  if (-not $content.EndsWith("`n")) {
    [void]$builder.AppendLine()
  }

  [void]$builder.AppendLine('```')
  [void]$builder.AppendLine()
}

[System.IO.File]::WriteAllText($OutputPath, $builder.ToString(), [System.Text.Encoding]::UTF8)
Write-Host "Gemini backend review bundle written to $OutputPath"
