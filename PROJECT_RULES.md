# Project Rules

Authoritative rules and phased plan for making this codebase production‑ready. This file governs architecture, tooling, delivery, and quality.

## Non‑negotiable principles

- Package manager: pnpm only (no npm/yarn). All commands and scripts must use pnpm.
- No demo/mock/TODO code in production paths. Stubs allowed only behind explicit feature flags or in test fixtures.
- Modular by default:
  - UI/components/hooks: hard cap ~50 lines per file; split further if exceeded.
  - Server/infra modules: small, focused modules; avoid god files; prefer single‑responsibility.
  - No circular deps; public APIs stabilized via types.
- Python MCP SDK is primary for servers. Do not add a TypeScript MCP SDK unless explicitly approved.
- Security first: short‑lived JWTs, rate limits, quotas, deterministic errors, minimal CORS, privacy‑safe logs.
- Observability: metrics (Prometheus), structured JSON logs, health endpoints, alerts.
- Reproducibility: pinned deps, lockfiles checked in (pnpm-lock.yaml), deterministic builds.

## Deliverables (scope)

- Two control panels in the frontend:
  - Hosting (public): lists/monitors 20 no‑key remote MCP servers; live status, limits, versions.
  - Personal (owner‑only): internal tools, admin actions, server controls.
- 20 “no‑key” remote MCP servers exposed at wss://mcp.digitalhustlelab.com/<server> (or equivalent) with per‑IP quotas and abuse protection.
- Clean, modular UI replacing the monolithic `components/mcp-connections.tsx`.
- REST proxy endpoints (Next.js API routes) for tool listing and execution with auth and limits.

## Phased execution plan

- Phase 0 — Stabilize and deduplicate
  - Select a single authoritative Python server tree (`llm/servers`). Archive legacy duplicates under `mcp/backup/`.
  - Fix launcher paths and config host typos; remove broken references.
- Phase 1 — Restore core Python foundations
  - Rebuild `mcp/utils` minimal production layers: validation, rate limiter, retry, security (JWT/IP), network (timeouts/payload caps).
  - Make `MCPJWTUtils` use restored validation errors consistently.
- Phase 2 — Harden server manager and bring up baseline fleet
  - Add JWT auth for admin endpoints; anonymous read‑only listings where safe.
  - Enforce rate limits/quotas, timeouts, payload caps, structured logs, Prometheus metrics, health/readiness.
  - Stand up initial servers (remote, web_scraper via official APIs, database_connector, ai_assistant, api_integrator) behind TLS WSS.
- Phase 3 — Frontend dashboards and hooks (modular, <50 lines)
  - Remove monolith. Implement `components/mcp-connections/*` and `lib/mcp/hooks/*` for servers/tools/health/state.
  - Implement Next.js API: `GET /api/mcp/tools`, `POST /api/mcp/tools/[toolId]/execute` with auth + limits.
- Phase 4 — Ops, metrics, and alerts
  - Prometheus/Grafana dashboards; uptime checks; alerting (email/Slack). JSON logs with request IDs.
- Phase 5 — Scale to 20 no‑key servers and publish
  - Manifest defines wsPath, limits, policies, version/schema hash; enforce per‑IP quotas.
- Phase 6 — Smithery alignment (learn only)
  - Align discovery and OAuth patterns; do not copy. Keep our registry format distinct.

## Directory and module layout

- Frontend (Next.js):
  - `components/mcp-connections/` — small UI units (ToolCard, ToolExecutionDialog, ServerHealthBadge, MetricsMini, HostingPanel, PersonalPanel, etc.).
  - `lib/mcp/hooks/` — `use-mcp`, `use-mcp-servers`, `use-mcp-tools`, `use-mcp-health` (pure, side‑effect light, <50 lines each).
  - `app/api/mcp/` — `tools/route.ts`, `tools/[toolId]/execute/route.ts` (proxy, auth, limits, typed responses).
- Backend (Python):
  - `servers/` — the only authoritative runtime servers and manager.
  - `mcp/config/` — `mcp-config.json` (source of truth), expanded JSONs for documentation/testing.
  - `mcp/utils/` — security, validation, rate limiting, retry, network; no empty placeholders in prod.
  - `mcp/backup/` — archived legacy implementations only.

## Security and policy

- Auth: HS256 JWT, exp ≤ 15 minutes; rotate secrets. Owner/admin scopes separate from public.
- CORS: allow only required origins (frontend domain). No `*` in production.
- Rate limits: sliding window (e.g., 60 rpm/IP), per‑tool quotas, burst controls.
- Request bounds: max payload size (e.g., 1–2 MB), timeouts (e.g., 10–30s), concurrency caps.
- Errors: deterministic JSON contract; no stack traces/PII to clients.
- Privacy: scrub secrets/user data in logs; log request IDs, durations, status codes.

## Observability and quality

- Metrics: requests_total, errors_total, p50/p95/p99 latency, active_ws, uptime_seconds.
- Health: `/health` (liveness), `/ready` (readiness). Include version, schema hash.
- Logging: JSON lines; rotate files on disk or ship to centralized log store.
- CI gates: build, lint/typecheck, unit tests, minimal smoke tests.
- Definition of Done per change:
  - Meets rules above; modular file sizes respected.
  - Types defined for public interfaces.
  - Tests updated/added (happy path + 1 edge case).
  - Docs touched if behavior changes.

## Tooling and commands (pnpm)

- Install deps:
  - `pnpm i`
- Dev server:
  - `pnpm dev`
- Lint/typecheck:
  - `pnpm lint`
- Build:
  - `pnpm build`
- Start:
  - `pnpm start`

Python (servers): use existing virtualenv/uv; do not bake into pnpm. Keep server scripts independent.

## API contracts (high‑level)

- `GET /api/mcp/tools`
  - Returns: `{ tools: Array<{ id, name, description, serverId, parameters, version }> }`
  - Errors: 401 (unauthorized for personal), 429 (rate limit), 500 (deterministic message)
- `POST /api/mcp/tools/[toolId]/execute`
  - Input: `{ args: Record<string, unknown> }`
  - Returns: `{ success, data?, error?, executionTime }`

## Deployment and networking

- Frontend on Vercel. Servers run on dedicated VM/Kubernetes with TLS termination (Nginx/Traefik/Caddy).
- Expose WSS at `wss://mcp.digitalhustlelab.com/<server>`; enforce HSTS; single region unless otherwise approved.
- Reverse proxy maps ws paths to internal server ports; sticky sessions where needed.

## Change management

- All changes must reference this file. If a change violates a rule, include justification and update this file in the same PR.
- Version this file with semantic sections; keep it current.

---

This document is the single source of truth for architecture and delivery discipline. All contributors must adhere to it.
