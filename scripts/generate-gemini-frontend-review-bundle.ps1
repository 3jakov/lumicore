param(
  [string]$OutputPath = "C:\git\lumicore\gemini-frontend-review-bundle.md"
)

$repoRoot = Split-Path -Parent $PSScriptRoot

$files = @(
  "apps/web/package.json",
  "apps/web/tsconfig.json",
  "apps/web/next.config.ts",
  "apps/web/tailwind.config.ts",
  "apps/web/.eslintrc.js",
  "apps/web/.env.local.example",
  "apps/web/app/layout.tsx",
  "apps/web/app/globals.css",
  "apps/web/app/page.tsx",
  "apps/web/app/manifest.ts",
  "apps/web/app/(auth)/layout.tsx",
  "apps/web/app/(auth)/login/page.tsx",
  "apps/web/app/(app)/layout.tsx",
  "apps/web/app/(app)/dashboard/page.tsx",
  "apps/web/app/(app)/projects/page.tsx",
  "apps/web/app/(app)/projects/new/page.tsx",
  "apps/web/app/(app)/projects/[id]/page.tsx",
  "apps/web/app/(app)/tasks/page.tsx",
  "apps/web/app/(app)/tasks/[id]/page.tsx",
  "apps/web/app/(app)/time/page.tsx",
  "apps/web/app/(app)/time/timesheet/page.tsx",
  "apps/web/app/(app)/team/praegu/page.tsx",
  "apps/web/app/(app)/team/timesheet/page.tsx",
  "apps/web/app/(app)/team/reports/page.tsx",
  "apps/web/app/(app)/team/people/page.tsx",
  "apps/web/app/(app)/team/people/[id]/page.tsx",
  "apps/web/app/(app)/tools/page.tsx",
  "apps/web/app/(app)/documents/page.tsx",
  "apps/web/app/(app)/settings/profile/page.tsx",
  "apps/web/app/(app)/settings/company/page.tsx",
  "apps/web/app/(app)/settings/tags/page.tsx",
  "apps/web/app/(app)/settings/roles/page.tsx",
  "apps/web/app/(app)/settings/templates/page.tsx",
  "apps/web/components/layout/app-shell.tsx",
  "apps/web/components/layout/app-shell-header.tsx",
  "apps/web/components/layout/app-shell-sidebar.tsx",
  "apps/web/components/layout/auth-intro-card.tsx",
  "apps/web/components/layout/placeholder-auth-panel.tsx",
  "apps/web/components/layout/placeholder-route-page.tsx",
  "apps/web/components/layout/placeholder-panel.tsx",
  "apps/web/components/layout/page-header.tsx",
  "apps/web/components/layout/language-badge.tsx",
  "apps/web/components/layout/timer-dock.tsx",
  "apps/web/components/providers/app-providers.tsx",
  "apps/web/components/providers/query-provider.tsx",
  "apps/web/components/ui/button.tsx",
  "apps/web/hooks/use-translation.ts",
  "apps/web/hooks/use-projects.ts",
  "apps/web/hooks/use-tasks.ts",
  "apps/web/hooks/use-time-entries.ts",
  "apps/web/hooks/use-employees.ts",
  "apps/web/hooks/use-timer.ts",
  "apps/web/hooks/use-socket.ts",
  "apps/web/lib/api-client.ts",
  "apps/web/lib/socket.ts",
  "apps/web/lib/config/env.ts",
  "apps/web/lib/config/navigation.ts",
  "apps/web/lib/i18n/et.ts",
  "apps/web/lib/i18n/ru.ts",
  "apps/web/lib/i18n/index.ts",
  "apps/web/lib/pwa/manifest.ts",
  "apps/web/lib/query/query-client.ts",
  "apps/web/lib/query/query-keys.ts",
  "apps/web/lib/utils/cn.ts",
  "apps/web/store/auth.store.ts",
  "apps/web/store/timer.store.ts",
  "apps/web/store/socket.store.ts",
  "apps/web/types/contracts.ts",
  "apps/web/types/jsx.d.ts",
  "apps/web/public/icon.svg"
)

$header = @"
# Gemini Frontend Review Bundle

Use the companion prompt from `scripts/gemini-frontend-review-prompt.txt`.

Repository root: `C:\git\lumicore`

This bundle contains the frontend M0 scaffold files needed to review foundation quality and M1 auth-readiness.

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
Write-Host "Gemini frontend review bundle written to $OutputPath"
