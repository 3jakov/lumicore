# Module Handoff Checklist

Use this checklist before declaring any module ready for frontend integration.

The goal is simple: verify that backend, shared types, and frontend assumptions are aligned enough that the next feature step can proceed without guessing contracts or creating avoidable rework.

## 1. Backend Exists

- Is there a real module in `apps/api/src/<module>/`?
- Are `controller`, `service`, `dto`, and `module` files present?
- Do the required endpoints exist in code, not just in docs or plans?

## 2. Shared Types Ready

- Are the relevant files in `packages/shared-types/` filled in?
- Are request and response contracts present for the current scope?
- Are there any empty `TODO` stubs where real interfaces should exist?

## 3. Contract Alignment

- Do backend response shapes match frontend assumptions?
- Are field names aligned (`snake_case` vs `camelCase`)?
- Is the frontend expecting fields the backend does not actually return?
- Do enum values match across Prisma, shared-types, and frontend usage?

## 4. Runtime Readiness

- Does the real endpoint work end-to-end?
- Is there at least one smoke-tested happy path?
- Is the UI blocked by a missing or failing endpoint (`404`, `500`, invalid shape)?

## 5. List / Detail Semantics

- For list endpoints, is the `{ data, meta }` contract stable?
- For detail endpoints, is the single-item response shape clear?
- Are pagination and filter params defined if the current step needs them?

## 6. Frontend Dependency Check

- Is the frontend using shared-types instead of rogue local contracts?
- If local temporary types exist, are they narrow and clearly temporary?
- Can frontend work continue without guessing backend contracts?

## 7. Scope Discipline

- Is the implementation still inside the current milestone/scope?
- Are we avoiding Phase 2 concerns unless they block the current handoff?
- Are we reviewing the current handoff, not the imagined final system?

## 8. Handoff Verdict

Always end the review with these four calls:

- `Backend ready? yes / mostly / no`
- `Shared contract ready? yes / mostly / no`
- `Frontend can proceed safely? yes / mostly / no`
- `Top 3 blockers or follow-ups`

## Fast Rules

- No backend module: frontend should not proceed with real feature integration.
- No shared-types: only narrow temporary adapters are acceptable; do not expand the feature deeply.
- No working runtime endpoint: frontend may build only shell/foundation UI.
- Stable contracts plus working endpoint: real feature integration can proceed.
