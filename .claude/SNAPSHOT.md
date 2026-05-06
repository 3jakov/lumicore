# SNAPSHOT — Lumicore (Development)
**Обновлено:** 2026-05-06
**Ветка:** `feat/scope-update-chat-docack`

---

## 🎯 Phase 1 статус: ЗАВЕРШЁН ✅
## 📱 Phase 2 — Mobile App: в работе (M0 + M1 готовы)

---

## Backend — все модули ✅

| Модуль | Статус |
|---|---|
| auth | ✅ (+ unit tests) |
| projects | ✅ (+ unit tests) + search param |
| tasks | ✅ + search param |
| time-tracking | ✅ WebSocket, Praegu, Excel, team timesheet + absences, reports (+ unit tests) + `GET /active` |
| employees | ✅ (+ unit tests) + search param |
| settings (roles/tags/groups) | ✅ |
| tools | ✅ |
| photos | ✅ S3, PhotoComment, GET/:id, comments |
| documents | ✅ |
| doc-acknowledgement | ✅ BR-016/017/018 |
| absences | ✅ 28 типов, CRUD, date-range overlap, 8 unit tests |
| notifications | ✅ cron 8:00/18:00, dedup, WebSocket push, REST API, 9 unit tests |
| CORS | ✅ multi-origin |

## Infrastructure — всё ✅

| Компонент | Статус |
|---|---|
| CI (ci.yml) | ✅ typecheck + api-tests + web-build |
| CD (deploy.yml) | ✅ GHCR build + SSH deploy on push to main |
| apps/api/Dockerfile | ✅ multi-stage |
| apps/web/Dockerfile | ✅ Next.js standalone |
| docker-compose.prod.yml | ✅ postgres, redis, api, web, nginx |
| nginx/nginx.conf | ✅ HTTPS, /api/, /socket.io/ (домен: YOUR_DOMAIN → заменить) |

## Frontend web — все модули ✅

| Страница/компонент | Статус |
|---|---|
| Auth / Login | ✅ |
| AppShell, Sidebar | ✅ + мобильный drawer |
| Header + Notifications bell | ✅ badge, dropdown, mark-read, WebSocket live |
| Global Search Modal | ✅ проекты/задачи/сотрудники |
| Projects / Tasks / Tools / Documents / Settings / DocAck | ✅ |
| Time entry list, timer controls | ✅ |
| My Timesheet | ✅ |
| Team Timesheet grid + Excel export + Absences UI | ✅ |
| Team: Praegu (live WebSocket) | ✅ |
| Team: People + Reports | ✅ |
| Photos галерея + upload + лайтбокс + комментарии | ✅ |
| i18n ET/RU | ✅ |
| PWA | ✅ |

## 📱 Mobile (apps/mobile) — Expo SDK 55

| Milestone | Статус | Коммит |
|---|---|---|
| M0 — Foundation (auth, navigation, NativeWind, monorepo) | ✅ | `92cde76` |
| M1 — Timer MVP (active card, pause/resume/stop, start form) | ✅ | `b6edf6c` |
| M2 — Camera MVP (expo-camera, S3, GPS) | 🔜 | — |
| M3 — Projects + Tasks (list screens) | 🔜 | — |
| M4 — My Timesheet | 🔜 | — |
| M5 — Push Notifications (APNs/FCM) | 🔜 | — |

## Последние коммиты

| Hash | Описание |
|---|---|
| `b6edf6c` | feat(time-tracking): add GET /time-entries/active + mobile M1 timer screen |
| `92cde76` | feat(infra): add Expo SDK 55 mobile app scaffold (M0) |
| `c6bfc20` | feat(absences): add absence delete confirmation modal |
| `6bd40e1` | refactor(absences): carry absence id in day_absences for delete support |
| `2767b69` | feat(notifications): add notifications bell |
| `7054df7` | feat(absences): add absence form modal and timesheet grid integration |
| `518db2f` | fix(notifications): correct stale comment in evening cron |
| `de0a838` | fix(notifications): dedup cron, fix typos, add service tests |

**Всего коммитов: ~88 (не запушено)**

## Что осталось

### VPS deploy (ручная настройка — не код)
- [ ] GitHub secrets: `VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY`, `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_WS_URL`
- [ ] Заменить `YOUR_DOMAIN` в `nginx/nginx.conf` на реальный домен
- [ ] Let's Encrypt SSL на VPS
- [ ] Первый deploy + smoke test

### Mobile Phase 2
- [ ] **M2** — Camera: expo-camera + S3 presigned upload + GPS (`expo-location`)
- [ ] **M3** — Projects list + Tasks list (read-only навигация)
- [ ] **M4** — My Timesheet (месячный грид, самостоятельный просмотр)
- [ ] **M5** — Push Notifications (Expo Notifications + APNs/FCM регистрация)

### Phase 2 Backend (отложено)
- [ ] Notifications: фильтр по ролям (сейчас уведомления всем `Aktiivne`)
- [ ] Auto stop timer после N часов
- [ ] Module permissions per role
- [ ] Search Phase 2 — фильтры по типу, история поиска

## Git
- Working tree: чистый (кроме `.codex` untracked)
- Ветка: `feat/scope-update-chat-docack`
- ~88 коммитов, не запушено в remote
- typecheck: ✅ api + web + mobile зелёный
- tests: ✅ 106 unit tests passing (7 suites)

## Архитектурные заметки (mobile)
- `apps/mobile/src/lib/api-client.ts` — `post(path, { body })` не `post(path, dto)` напрямую
- `TimeEntryDetail` не несёт `project_name` — `ActiveTimerCard` показывает `#project_id`. Добавить в M3 pass
- NativeWind types: `"types": ["nativewind/types"]` в tsconfig обязателен для `className` на RN компонентах
