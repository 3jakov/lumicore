# SNAPSHOT — Lumicore
**Обновлено:** 2026-05-13
**Ветка:** `develop` (PR #3 смёрджен)

---

## 🎯 Общий статус: код завершён, готовимся к production deploy

- Phase 1 (web + API): **ЗАВЕРШЁН ✅**
- Mobile M0–M5: **ЗАВЕРШЕНЫ ✅**
- CI: **зелёный ✅** (Typecheck + API Tests + Web Build)
- `develop` ← PR #3 смёрджен

---

## Следующий шаг: VPS подготовка → Release PR → Production

### Чеклист до `develop → main`

#### 1. VPS (одноразовая настройка)
- [ ] Залить `scripts/vps-setup.sh` на VPS и запустить: `bash vps-setup.sh <DOMAIN> deploy`
- [ ] Создать `/opt/lumicore/.env` (все переменные из CLAUDE.md)
- [ ] Убедиться что Docker + Docker Compose v2 установлены

#### 2. GitHub Secrets (Settings → Secrets → Actions)
- [ ] `VPS_HOST` — IP или hostname VPS
- [ ] `VPS_USER` — `deploy` (пользователь созданный скриптом)
- [ ] `VPS_SSH_KEY` — приватный SSH ключ (пара к тому что в `~deploy/.ssh/authorized_keys`)
- [ ] `DOMAIN` — реальный домен (используется в deploy.yml для nginx.conf substitution)
- [ ] `NEXT_PUBLIC_API_URL` — `https://<DOMAIN>/api/v1`
- [ ] `NEXT_PUBLIC_WS_URL` — `wss://<DOMAIN>`

#### 3. GHCR permissions
- [ ] Settings → Packages → `lumicore-api` / `lumicore-web` → visibility: Internal или Public
  (иначе VPS не сможет pull образы без токена)

#### 4. Release PR
- [ ] Создать PR `develop → main`
- [ ] Merge → deploy.yml запустится автоматически
- [ ] Smoke test: `GET https://<DOMAIN>/api/v1/health`

---

## Backend — все модули ✅

| Модуль | Статус |
|---|---|
| auth | ✅ |
| projects | ✅ |
| tasks | ✅ |
| time-tracking | ✅ WebSocket, Praegu, Excel, team timesheet, reports |
| employees | ✅ |
| settings (roles/tags/groups) | ✅ |
| tools | ✅ |
| photos | ✅ S3, comments |
| documents | ✅ |
| doc-acknowledgement | ✅ BR-016/017/018 |
| absences | ✅ 28 типов, CRUD, 8 unit tests |
| notifications | ✅ cron 8:00/18:00, dedup, WebSocket push, REST, 9 unit tests |
| push notifications (device tokens) | ✅ DeviceToken model, upsert/remove, ExpoPushService |

## Infrastructure ✅

| Компонент | Статус |
|---|---|
| CI (ci.yml) | ✅ typecheck + api-tests + web-build (prisma:generate добавлен) |
| CD (deploy.yml) | ✅ GHCR build + SSH deploy on push to main |
| apps/api/Dockerfile | ✅ multi-stage |
| apps/web/Dockerfile | ✅ Next.js standalone |
| docker-compose.prod.yml | ✅ postgres, redis, api, web, nginx |
| nginx/nginx.conf | ✅ HTTPS, /api/, /socket.io/ |
| scripts/vps-setup.sh | ✅ certbot + renewal hooks + deploy user |

## Mobile (apps/mobile) — Expo SDK 55 ✅

| Milestone | Статус |
|---|---|
| M0 — Foundation | ✅ |
| M1 — Timer MVP | ✅ |
| M2 — Camera MVP | ✅ |
| M3 — Projects + Tasks + Photos | ✅ |
| M4 — My Timesheet | ✅ |
| M5 — Push Notifications | ✅ |

После `eas init`:
- [ ] Добавить `EXPO_PUBLIC_EAS_PROJECT_ID` как EAS secret

## Post-MVP backlog (отложено)

- [ ] Notifications: фильтр по ролям
- [ ] Auto stop timer после N часов
- [ ] Module permissions per role
- [ ] Search Phase 2 — фильтры по типу, история поиска

## Архитектурные заметки

- `apiClient.post(path, { body })` — не `post(path, dto)` напрямую
- NativeWind: `"types": ["nativewind/types"]` в tsconfig обязателен
- `@types/react` конфликт решён через `pnpm.overrides` в root `package.json`
- `prisma` в `dependencies` (не `devDependencies`) — нужен в prod Docker image
- Certbot renewal hooks: pre/post останавливают/запускают nginx контейнер
